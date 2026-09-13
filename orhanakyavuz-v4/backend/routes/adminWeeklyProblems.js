import { Router } from 'express';
import { db } from '../db/connection.js';
import { sendSuccess, sendError, notFound } from '../middleware/response.js';
import { requireAuthenticatedUser, requireAdmin } from '../middleware/auth.js';
import { validateWeeklyProblemPayload } from '../middleware/validation.js';
import { supabaseClientForToken } from '../services/supabase.js';

export const adminWeeklyProblemsRouter = Router();
adminWeeklyProblemsRouter.use(requireAuthenticatedUser, requireAdmin);

const problemFields = `slug, title, problem_content, solution_content, topic, grade_level, difficulty,
  answer_key, published_at, ends_at, status, created_by`;

adminWeeklyProblemsRouter.get('/', async (req, res) => {
  if (process.env.AUTH_PROVIDER === 'supabase') {
    const { data, error } = await supabaseClientForToken(req.authToken).rpc('admin_list_weekly_problems');
    if (error) return sendError(res, 503, 'ADMIN_DATABASE_ERROR', error.message);
    return sendSuccess(res, { problems: data ?? [] });
  }
  const problems = db.prepare(`SELECT id, ${problemFields}, created_at, updated_at FROM weekly_problems ORDER BY published_at DESC`).all();
  sendSuccess(res, { problems });
});

adminWeeklyProblemsRouter.post('/', async (req, res) => {
  const { valid, errors, clean } = validateWeeklyProblemPayload(req.body);
  if (!valid) return sendError(res, 422, 'VALIDATION_ERROR', JSON.stringify(errors));
  if (process.env.AUTH_PROVIDER === 'supabase') {
    const { data, error } = await supabaseClientForToken(req.authToken).rpc('admin_create_weekly_problem', {
      p_slug: clean.slug, p_title: clean.title, p_problem_content: clean.problemContent, p_solution_content: clean.solutionContent,
      p_topic: clean.topic, p_grade_level: clean.gradeLevel, p_difficulty: clean.difficulty, p_answer_key: clean.answerKey,
      p_published_at: clean.publishedAt, p_ends_at: clean.endsAt, p_status: clean.status,
    });
    if (error) return sendError(res, 422, 'ADMIN_DATABASE_ERROR', error.message);
    return sendSuccess(res, { id: data }, 201);
  }
  try {
    const result = db.prepare(`
      INSERT INTO weekly_problems (${problemFields})
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(clean.slug, clean.title, clean.problemContent, clean.solutionContent || null, clean.topic, clean.gradeLevel, clean.difficulty, clean.answerKey, clean.publishedAt, clean.endsAt, clean.status, req.user.id);
    sendSuccess(res, { id: Number(result.lastInsertRowid) }, 201);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return sendError(res, 409, 'SLUG_EXISTS', 'Bu slug zaten kullanılıyor.');
    throw error;
  }
});

adminWeeklyProblemsRouter.put('/:problemId', async (req, res) => {
  const problemId = Number(req.params.problemId);
  const { valid, errors, clean } = validateWeeklyProblemPayload(req.body);
  if (!Number.isSafeInteger(problemId) || problemId < 1) return sendError(res, 400, 'INVALID_PROBLEM_ID', 'Problem kimliği geçersiz.');
  if (!valid) return sendError(res, 422, 'VALIDATION_ERROR', JSON.stringify(errors));
  if (process.env.AUTH_PROVIDER === 'supabase') {
    const { data, error } = await supabaseClientForToken(req.authToken).rpc('admin_update_weekly_problem', {
      p_id: problemId, p_slug: clean.slug, p_title: clean.title, p_problem_content: clean.problemContent, p_solution_content: clean.solutionContent,
      p_topic: clean.topic, p_grade_level: clean.gradeLevel, p_difficulty: clean.difficulty, p_answer_key: clean.answerKey,
      p_published_at: clean.publishedAt, p_ends_at: clean.endsAt, p_status: clean.status,
    });
    if (error) return sendError(res, 422, 'ADMIN_DATABASE_ERROR', error.message);
    if (!data) return notFound(res, 'Problem');
    return sendSuccess(res, { updated: true });
  }
  const result = db.prepare(`
    UPDATE weekly_problems SET slug = ?, title = ?, problem_content = ?, solution_content = ?, topic = ?, grade_level = ?, difficulty = ?, answer_key = ?, published_at = ?, ends_at = ?, status = ?, updated_at = datetime('now') WHERE id = ?
  `).run(clean.slug, clean.title, clean.problemContent, clean.solutionContent || null, clean.topic, clean.gradeLevel, clean.difficulty, clean.answerKey, clean.publishedAt, clean.endsAt, clean.status, problemId);
  if (!result.changes) return notFound(res, 'Problem');
  sendSuccess(res, { updated: true });
});

adminWeeklyProblemsRouter.delete('/:problemId', async (req, res) => {
  if (process.env.AUTH_PROVIDER === 'supabase') {
    const { data, error } = await supabaseClientForToken(req.authToken).rpc('admin_delete_weekly_problem', { p_id: Number(req.params.problemId) });
    if (error) return sendError(res, 422, 'ADMIN_DATABASE_ERROR', error.message);
    if (!data) return notFound(res, 'Problem');
    return sendSuccess(res, { deleted: true });
  }
  const result = db.prepare('DELETE FROM weekly_problems WHERE id = ?').run(Number(req.params.problemId));
  if (!result.changes) return notFound(res, 'Problem');
  sendSuccess(res, { deleted: true });
});

adminWeeklyProblemsRouter.get('/:problemId/submissions', async (req, res) => {
  if (process.env.AUTH_PROVIDER === 'supabase') {
    const problemId = Number(req.params.problemId);
    const client = supabaseClientForToken(req.authToken);
    const { data, error } = await client.rpc('admin_list_submissions', { p_problem_id: problemId });
    if (!error) return sendSuccess(res, { submissions: data ?? [] });

    const fallback = await client
      .from('submissions')
      .select('id, problem_id, answer_text, solution_text, is_correct, has_explanation, score, submitted_at, user_id, profiles(display_name)')
      .eq('problem_id', problemId)
      .order('submitted_at', { ascending: false });

    if (fallback.error) return sendError(res, 503, 'ADMIN_DATABASE_ERROR', fallback.error.message || error.message);

    return sendSuccess(res, {
      submissions: (fallback.data ?? []).map((submission) => ({
        id: submission.id,
        problem_id: submission.problem_id,
        answer_text: submission.answer_text,
        solution_text: submission.solution_text,
        is_correct: submission.is_correct,
        has_explanation: submission.has_explanation,
        score: submission.score,
        submitted_at: submission.submitted_at,
        display_name: submission.profiles?.display_name ?? 'Matematikçi',
      }))
    });
  }
  const submissions = db.prepare(`
    SELECT s.id, s.problem_id, s.answer_text, s.solution_text, s.is_correct, s.has_explanation, s.score, s.submitted_at,
      u.display_name, u.email
    FROM submissions AS s JOIN users AS u ON u.id = s.user_id
    WHERE s.problem_id = ? ORDER BY s.submitted_at DESC
  `).all(Number(req.params.problemId));
  sendSuccess(res, { submissions });
});

adminWeeklyProblemsRouter.patch('/:problemId/submissions/:submissionId', async (req, res) => {
  const submissionId = Number(req.params.submissionId);
  const isCorrect = req.body?.isCorrect === true;
  const score = isCorrect ? (req.body?.hasExplanation === true ? 15 : 10) : 0;
  if (process.env.AUTH_PROVIDER === 'supabase') {
    const { data, error } = await supabaseClientForToken(req.authToken).rpc('admin_review_submission', {
      p_problem_id: Number(req.params.problemId), p_submission_id: submissionId, p_is_correct: isCorrect, p_has_explanation: req.body?.hasExplanation === true,
    });
    if (error) return sendError(res, 422, 'ADMIN_DATABASE_ERROR', error.message);
    return sendSuccess(res, { reviewed: true, score: data });
  }
  db.exec('BEGIN');
  try {
    const result = db.prepare('UPDATE submissions SET is_correct = ?, score = ? WHERE id = ? AND problem_id = ?').run(isCorrect ? 1 : 0, score, submissionId, Number(req.params.problemId));
    if (!result.changes) {
      db.exec('ROLLBACK');
      return notFound(res, 'Gönderi');
    }
    db.prepare('DELETE FROM score_events WHERE submission_id = ?').run(submissionId);
    if (score > 0) {
      const submission = db.prepare('SELECT user_id FROM submissions WHERE id = ?').get(submissionId);
      db.prepare(`INSERT INTO score_events (user_id, submission_id, event_type, points) VALUES (?, ?, 'admin_review', ?)`).run(submission.user_id, submissionId, score);
    }
    db.exec('COMMIT');
    sendSuccess(res, { reviewed: true, score });
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
});

adminWeeklyProblemsRouter.post('/:problemId/highlight', async (req, res) => {
  const submissionId = Number(req.body?.submissionId);
  const problemId = Number(req.params.problemId);
  if (process.env.AUTH_PROVIDER === 'supabase') {
    const { data, error } = await supabaseClientForToken(req.authToken).rpc('admin_highlight_submission', { p_problem_id: problemId, p_submission_id: submissionId });
    if (error) return sendError(res, 422, 'ADMIN_DATABASE_ERROR', error.message);
    return sendSuccess(res, { highlighted: data });
  }
  const submission = db.prepare('SELECT id FROM submissions WHERE id = ? AND problem_id = ?').get(submissionId, problemId);
  if (!submission) return notFound(res, 'Gönderi');
  db.prepare('DELETE FROM problem_highlights WHERE problem_id = ?').run(problemId);
  db.prepare('INSERT INTO problem_highlights (problem_id, submission_id, approved_by) VALUES (?, ?, ?)').run(problemId, submissionId, req.user.id);
  sendSuccess(res, { highlighted: true });
});