import { Router } from 'express';
import { db } from '../db/connection.js';
import { sendSuccess, sendError, notFound } from '../middleware/response.js';
import { validateSubmissionPayload, rateLimit } from '../middleware/validation.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { updateStreakAndBadges } from '../services/gamification.js';
import { supabase, supabaseClientForToken } from '../services/supabase.js';

export const submissionsRouter = Router();
const submissionRateLimit = rateLimit({ windowMs: 60_000, max: 10 });

submissionsRouter.get('/active', async (_req, res) => {
  if (process.env.AUTH_PROVIDER === 'supabase' && supabase) {
    const { data, error } = await supabase.from('weekly_problems')
      .select('id, slug, title, problem_content, topic, grade_level, difficulty, published_at, ends_at')
      .eq('status', 'published').lte('published_at', new Date().toISOString()).gt('ends_at', new Date().toISOString())
      .order('published_at', { ascending: false }).limit(1);
    if (error) return sendError(res, 503, 'DATABASE_ERROR', 'Problem verisi alınamadı.');
    return sendSuccess(res, { problem: data?.[0] ?? null });
  }

  const problem = db.prepare(`
    SELECT p.id, p.slug, p.title, p.problem_content, p.topic, p.grade_level, p.difficulty, p.published_at, p.ends_at,
      hs.solution_text AS featured_solution, hu.display_name AS featured_solution_author
    FROM weekly_problems AS p
    LEFT JOIN problem_highlights AS ph ON ph.problem_id = p.id
    LEFT JOIN submissions AS hs ON hs.id = ph.submission_id
    LEFT JOIN users AS hu ON hu.id = hs.user_id
    WHERE status = 'published'
      AND published_at <= datetime('now') AND ends_at > datetime('now')
    ORDER BY published_at DESC
    LIMIT 1
  `).get();

  if (!problem) return sendSuccess(res, { problem: null });
  return sendSuccess(res, { problem });
});

function normalizeAnswer(value) {
  return value.trim().toLocaleLowerCase('tr-TR');
}

submissionsRouter.post('/:problemId/submissions', requireAuthenticatedUser, submissionRateLimit, async (req, res) => {
  const problemId = Number(req.params.problemId);
  if (!Number.isSafeInteger(problemId) || problemId < 1) {
    return sendError(res, 400, 'INVALID_PROBLEM_ID', 'Problem kimliği geçersiz.');
  }

  const { valid, errors, clean } = validateSubmissionPayload(req.body);
  if (!valid) return sendError(res, 422, 'VALIDATION_ERROR', JSON.stringify(errors));

  if (process.env.AUTH_PROVIDER === 'supabase') {
    const client = supabaseClientForToken(req.authToken);
    const { data, error } = await client.rpc('submit_weekly_problem', {
      p_problem_id: problemId,
      p_answer: clean.answer,
      p_solution: clean.solution || null,
    });
    if (error) return sendError(res, error.code === '22023' ? 404 : 422, 'SUBMISSION_FAILED', error.message);
    const result = Array.isArray(data) ? data[0] : data;
    return sendSuccess(res, { submissionId: result.submission_id, isCorrect: result.is_correct, score: result.score }, 201);
  }

  const problem = db.prepare(`
    SELECT id, answer_key
    FROM weekly_problems
    WHERE id = ? AND status = 'published'
      AND published_at <= datetime('now') AND ends_at > datetime('now')
  `).get(problemId);

  if (!problem) return notFound(res, 'Aktif problem');

  const isCorrect = normalizeAnswer(clean.answer) === normalizeAnswer(problem.answer_key);
  const priorCorrect = db.prepare('SELECT 1 FROM submissions WHERE problem_id = ? AND user_id = ? AND is_correct = 1 LIMIT 1').get(problem.id, req.user.id);
  const score = isCorrect && !priorCorrect ? (clean.solution ? 15 : 10) : 0;
  const hasExplanation = clean.solution ? 1 : 0;

  db.exec('BEGIN');
  try {
    const submission = db.prepare(`
      INSERT INTO submissions (problem_id, user_id, answer_text, solution_text, is_correct, has_explanation, score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(problem.id, req.user.id, clean.answer, clean.solution || null, isCorrect ? 1 : 0, hasExplanation, score);
    const submissionId = Number(submission.lastInsertRowid);

    if (score > 0) {
      db.prepare(`
        INSERT INTO score_events (user_id, submission_id, event_type, points)
        VALUES (?, ?, ?, ?)
      `).run(req.user.id, submissionId, hasExplanation ? 'correct_with_explanation' : 'correct_answer', score);
    }

    const gamification = updateStreakAndBadges(db, req.user.id);

    db.exec('COMMIT');
    return sendSuccess(res, { submissionId, isCorrect, score, ...gamification }, 201);
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
});

submissionsRouter.get('/archive', async (req, res) => {
  const year = String(req.query.year ?? '').trim();
  const topic = String(req.query.topic ?? '').trim();
  const difficulty = String(req.query.difficulty ?? '').trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(24, Math.max(1, parseInt(req.query.limit, 10) || 12));
  if (process.env.AUTH_PROVIDER === 'supabase' && supabase) {
    let query = supabase.from('weekly_problems')
      .select('id, slug, title, topic, grade_level, difficulty, published_at, ends_at', { count: 'exact' })
      .in('status', ['published', 'archived']).lte('ends_at', new Date().toISOString())
      .order('published_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    if (/^\d{4}$/.test(year)) query = query.gte('published_at', `${year}-01-01T00:00:00.000Z`).lt('published_at', `${Number(year) + 1}-01-01T00:00:00.000Z`);
    if (topic) query = query.eq('topic', topic);
    if (['easy', 'medium', 'hard'].includes(difficulty)) query = query.eq('difficulty', difficulty);
    const { data, count, error } = await query;
    if (error) return sendError(res, 503, 'DATABASE_ERROR', 'Arşiv verisi alınamadı.');
    return sendSuccess(res, { problems: data ?? [], pagination: { page, limit, total: count ?? 0, totalPages: Math.max(1, Math.ceil((count ?? 0) / limit)) } });
  }
  const conditions = ["status IN ('published', 'archived')", "ends_at <= datetime('now')"];
  const params = [];

  if (/^\d{4}$/.test(year)) {
    conditions.push("strftime('%Y', published_at) = ?");
    params.push(year);
  }
  if (topic) {
    conditions.push('topic = ?');
    params.push(topic);
  }
  if (['easy', 'medium', 'hard'].includes(difficulty)) {
    conditions.push('difficulty = ?');
    params.push(difficulty);
  }

  const where = conditions.join(' AND ');
  const total = db.prepare(`SELECT COUNT(*) AS total FROM weekly_problems WHERE ${where}`).get(...params).total;
  const problems = db.prepare(`
    SELECT id, slug, title, topic, grade_level, difficulty, published_at, ends_at
    FROM weekly_problems WHERE ${where}
    ORDER BY published_at DESC LIMIT ? OFFSET ?
  `).all(...params, limit, (page - 1) * limit);
  sendSuccess(res, { problems, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
});