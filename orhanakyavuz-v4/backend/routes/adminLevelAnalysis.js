import { Router } from 'express';
import { requireAuthenticatedUser, requireAdmin } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../middleware/response.js';
import { supabaseClientForToken } from '../services/supabase.js';

export const adminLevelAnalysisRouter = Router();
adminLevelAnalysisRouter.use(requireAuthenticatedUser, requireAdmin);

function client(req) {
  return supabaseClientForToken(req.authToken);
}

adminLevelAnalysisRouter.get('/', async (req, res) => {
  const supabase = client(req);
  let query = supabase.from('level_analysis_applications')
    .select('id, user_id, exam_group, level, full_name, education_status, target_exam, contact_info, status, created_at, assessment_id, submission_id')
    .order('created_at', { ascending: false });
  const filters = [
    ['exam_group', req.query.examGroup],
    ['level', req.query.level],
    ['status', req.query.status],
  ];
  for (const [column, value] of filters) if (value) query = query.eq(column, String(value));
  if (req.query.search) query = query.ilike('full_name', `%${String(req.query.search).slice(0, 80)}%`);
  if (req.query.from) query = query.gte('created_at', String(req.query.from));
  if (req.query.to) query = query.lt('created_at', String(req.query.to));
  const { data, error } = await query;
  if (error) return sendError(res, 503, 'ADMIN_DATABASE_ERROR', error.message);
  return sendSuccess(res, { applications: data ?? [] });
});

adminLevelAnalysisRouter.get('/:applicationId', async (req, res) => {
  const id = Number(req.params.applicationId);
  if (!Number.isSafeInteger(id) || id < 1) return sendError(res, 400, 'INVALID_APPLICATION_ID', 'Başvuru kimliği geçersiz.');
  const supabase = client(req);
  const { data: application, error } = await supabase.from('level_analysis_applications').select('*').eq('id', id).single();
  if (error || !application) return sendError(res, 404, 'APPLICATION_NOT_FOUND', 'Başvuru bulunamadı.');

  const [filesResult, submissionResult] = await Promise.all([
    supabase.from('level_analysis_files').select('*').eq('application_id', id).order('sort_order'),
    supabase.from('assessment_submissions').select('id, status, created_at, reviewed_at, assessment_id').eq('id', application.submission_id).maybeSingle(),
  ]);
  if (filesResult.error) return sendError(res, 503, 'FILES_LOAD_FAILED', filesResult.error.message);
  const submission = submissionResult.data;
  if (!submission) return sendSuccess(res, { application, files: filesResult.data ?? [], questions: [], results: [], topics: [], report: null });

  const [assessmentResult, questionsResult, resultsResult, topicsResult, reportResult] = await Promise.all([
    supabase.from('assessments').select('id, title, description, duration_minutes, question_count, level_id, category_id').eq('id', submission.assessment_id).single(),
    supabase.from('assessment_questions').select('*').eq('assessment_id', submission.assessment_id).order('question_number'),
    supabase.from('assessment_question_results').select('*').eq('submission_id', submission.id).order('question_id'),
    supabase.from('assessment_topic_results').select('*').eq('submission_id', submission.id).order('topic'),
    supabase.from('assessment_reports').select('*').eq('submission_id', submission.id).maybeSingle(),
  ]);
  if (questionsResult.error || resultsResult.error || topicsResult.error) return sendError(res, 503, 'RESULTS_LOAD_FAILED', 'Değerlendirme verileri alınamadı.');
  const files = await Promise.all((filesResult.data ?? []).map(async (file) => {
    const signed = await supabase.storage.from('level-analysis-solutions').createSignedUrl(file.file_path, 600);
    return { ...file, signedUrl: signed.data?.signedUrl ?? null };
  }));
  return sendSuccess(res, {
    application,
    submission,
    assessment: assessmentResult.data,
    files,
    questions: questionsResult.data ?? [],
    results: resultsResult.data ?? [],
    topics: topicsResult.data ?? [],
    report: reportResult.data ?? null,
  });
});

adminLevelAnalysisRouter.patch('/:applicationId/questions', async (req, res) => {
  const id = Number(req.params.applicationId);
  const entries = Array.isArray(req.body?.results) ? req.body.results : [];
  if (!Number.isSafeInteger(id) || id < 1 || !entries.length) return sendError(res, 422, 'VALIDATION_ERROR', 'Soru değerlendirmesi eksik.');
  const supabase = client(req);
  const { data: application, error: applicationError } = await supabase.from('level_analysis_applications').select('submission_id').eq('id', id).single();
  if (applicationError || !application?.submission_id) return sendError(res, 404, 'SUBMISSION_NOT_FOUND', 'Değerlendirilecek gönderi bulunamadı.');
  const submissionId = application.submission_id;
  const allowedResults = new Set(['correct', 'wrong', 'blank']);
  const allowedErrors = new Set(['concept_error', 'calculation_error', 'method_error', 'careless_error']);
  const rows = entries.map((entry) => ({
    submission_id: submissionId,
    question_id: Number(entry.questionId),
    result: String(entry.result),
    error_type: entry.errorType ? String(entry.errorType) : null,
    teacher_note: String(entry.teacherNote ?? '').slice(0, 2000) || null,
    points_earned: Number(entry.pointsEarned) || 0,
    reviewed_by: req.user.id,
    reviewed_at: new Date().toISOString(),
  })).filter((row) => Number.isSafeInteger(row.question_id) && allowedResults.has(row.result) && (!row.error_type || allowedErrors.has(row.error_type)));
  if (!rows.length) return sendError(res, 422, 'VALIDATION_ERROR', 'Geçerli soru sonucu bulunamadı.');
  const { error } = await supabase.from('assessment_question_results').upsert(rows, { onConflict: 'submission_id,question_id' });
  if (error) return sendError(res, 422, 'RESULTS_SAVE_FAILED', error.message);

  const { data: questionRows, error: questionError } = await supabase.from('assessment_questions').select('id, topic, points').eq('assessment_id', (await supabase.from('assessment_submissions').select('assessment_id').eq('id', submissionId).single()).data.assessment_id);
  if (questionError) return sendError(res, 503, 'QUESTIONS_LOAD_FAILED', questionError.message);
  const resultMap = new Map(rows.map((row) => [row.question_id, row]));
  const topics = new Map();
  for (const question of questionRows ?? []) {
    const topic = topics.get(question.topic) ?? { submission_id: submissionId, topic: question.topic, question_count: 0, correct_count: 0, wrong_count: 0, blank_count: 0, points_earned: 0 };
    topic.question_count += 1;
    const result = resultMap.get(question.id)?.result;
    if (result === 'correct') { topic.correct_count += 1; topic.points_earned += Number(resultMap.get(question.id).points_earned) || Number(question.points); }
    if (result === 'wrong') topic.wrong_count += 1;
    if (result === 'blank') topic.blank_count += 1;
    topics.set(question.topic, topic);
  }
  const { error: topicsError } = await supabase.from('assessment_topic_results').upsert([...topics.values()], { onConflict: 'submission_id,topic' });
  if (topicsError) return sendError(res, 422, 'TOPIC_RESULTS_FAILED', topicsError.message);
  await supabase.from('assessment_submissions').update({ status: 'reviewing' }).eq('id', submissionId);
  return sendSuccess(res, { saved: rows.length, topics: [...topics.values()] });
});

adminLevelAnalysisRouter.post('/:applicationId/complete', async (req, res) => {
  const id = Number(req.params.applicationId);
  const supabase = client(req);
  const { data: application, error } = await supabase.from('level_analysis_applications').select('submission_id').eq('id', id).single();
  if (error || !application?.submission_id) return sendError(res, 404, 'SUBMISSION_NOT_FOUND', 'Başvuru gönderisi bulunamadı.');
  const submissionId = application.submission_id;
  const { data: report, error: reportError } = await supabase.from('assessment_reports').upsert({
    submission_id: submissionId,
    overall_score: Number(req.body?.overallScore) || null,
    level_label: String(req.body?.levelLabel ?? '').slice(0, 120) || null,
    strengths: Array.isArray(req.body?.strengths) ? req.body.strengths : [],
    weaknesses: Array.isArray(req.body?.weaknesses) ? req.body.weaknesses : [],
    recommendations: Array.isArray(req.body?.recommendations) ? req.body.recommendations : [],
    generated_by: 'teacher',
    report_text: String(req.body?.generalNote ?? '').slice(0, 10000) || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'submission_id' }).select('id').single();
  if (reportError) return sendError(res, 422, 'REPORT_SAVE_FAILED', reportError.message);
  await supabase.from('assessment_submissions').update({ status: 'completed', reviewed_at: new Date().toISOString(), reviewed_by: req.user.id }).eq('id', submissionId);
  await supabase.from('level_analysis_applications').update({ status: 'reviewed' }).eq('id', id);
  return sendSuccess(res, { completed: true, reportId: report.id });
});