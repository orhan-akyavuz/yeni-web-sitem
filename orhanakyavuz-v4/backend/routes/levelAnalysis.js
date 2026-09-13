import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { sendError, sendSuccess } from '../middleware/response.js';
import { supabaseClientForToken, supabaseConfigured } from '../services/supabase.js';

export const levelAnalysisRouter = Router();
const STORAGE_BUCKET = 'level-analysis-solutions';
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 8 * 1024 * 1024;

function requireSupabase(res) {
  if (!supabaseConfigured) {
    sendError(res, 503, 'SUPABASE_NOT_CONFIGURED', 'Seviye analizi şu anda kullanılamıyor.');
    return false;
  }
  return true;
}

levelAnalysisRouter.get('/reports/latest', requireAuthenticatedUser, async (req, res) => {
  if (!requireSupabase(res)) return;
  const client = supabaseClientForToken(req.authToken);
  const { data: submission, error } = await client.from('assessment_submissions')
    .select('id, status, created_at, reviewed_at, assessment_id')
    .eq('student_id', req.user.id)
    .eq('status', 'completed')
    .order('reviewed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return sendError(res, 503, 'REPORT_LOAD_FAILED', error.message);
  if (!submission) return sendSuccess(res, { report: null, topics: [] });
  const [reportResult, topicsResult, assessmentResult] = await Promise.all([
    client.from('assessment_reports').select('overall_score, level_label, strengths, weaknesses, recommendations, report_text, updated_at').eq('submission_id', submission.id).maybeSingle(),
    client.from('assessment_topic_results').select('topic, question_count, correct_count, wrong_count, blank_count, points_earned').eq('submission_id', submission.id).order('topic'),
    client.from('assessments').select('title, description').eq('id', submission.assessment_id).single(),
  ]);
  if (reportResult.error || topicsResult.error) return sendError(res, 503, 'REPORT_LOAD_FAILED', 'Rapor verileri alınamadı.');
  return sendSuccess(res, { report: reportResult.data, topics: topicsResult.data ?? [], assessment: assessmentResult.data, submission });
});

levelAnalysisRouter.post('/uploads', requireAuthenticatedUser, async (req, res) => {
  if (!requireSupabase(res)) return;
  const contentType = String(req.get('content-type') || '').toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) return sendError(res, 415, 'UNSUPPORTED_FILE_TYPE', 'Yalnızca JPG, PNG veya WEBP yükleyebilirsiniz.');
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return sendError(res, 422, 'EMPTY_FILE', 'Yüklenecek fotoğraf bulunamadı.');
  if (req.body.length > MAX_FILE_SIZE) return sendError(res, 413, 'FILE_TOO_LARGE', 'Fotoğraf en fazla 8 MB olabilir.');

  const extension = contentType === 'image/jpeg' ? 'jpg' : contentType.slice('image/'.length);
  const storagePath = `${req.user.id}/${randomUUID()}.${extension}`;
  const client = supabaseClientForToken(req.authToken);
  const { error } = await client.storage.from(STORAGE_BUCKET).upload(storagePath, req.body, {
    contentType,
    cacheControl: '3600',
    upsert: false,
  });
  if (error) return sendError(res, 422, 'FILE_UPLOAD_FAILED', error.message);
  return sendSuccess(res, { path: storagePath, fileName: storagePath.split('/').pop(), mimeType: contentType, fileSize: req.body.length }, 201);
});

levelAnalysisRouter.post('/applications', requireAuthenticatedUser, async (req, res) => {
  if (!requireSupabase(res)) return;
  const body = req.body ?? {};
  const fullName = String(body.fullName ?? '').trim();
  const educationStatus = String(body.educationStatus ?? '').trim();
  const targetExam = String(body.targetExam ?? '').trim();
  const contactInfo = String(body.contactInfo ?? '').trim();
  const examGroup = String(body.examGroup ?? '').trim();
  const level = String(body.level ?? '').trim();
  const files = Array.isArray(body.files) ? body.files : [];

  if (!fullName || !educationStatus || !targetExam || !contactInfo || !examGroup || !level) {
    return sendError(res, 422, 'VALIDATION_ERROR', 'Başvuru bilgileri eksik.');
  }
  if (fullName.length > 120 || educationStatus.length > 120 || targetExam.length > 120 || contactInfo.length > 160 || level.length > 120) {
    return sendError(res, 422, 'VALIDATION_ERROR', 'Başvuru alanlarından biri çok uzun.');
  }
  if (files.length < 1 || files.length > 3 || files.some((file) => !file?.path || !String(file.path).startsWith(`${req.user.id}/`))) {
    return sendError(res, 422, 'FILES_REQUIRED', 'En az bir geçerli çözüm fotoğrafı yüklemelisiniz.');
  }

  const client = supabaseClientForToken(req.authToken);
  const { data: assessment, error: assessmentError } = await client
    .from('assessments')
    .select('id, category_id, assessment_levels!inner(name, slug), assessment_categories!inner(slug)')
    .eq('status', 'published')
    .eq('assessment_categories.slug', examGroup)
    .eq('assessment_levels.name', level)
    .limit(1)
    .maybeSingle();
  if (assessmentError || !assessment) return sendError(res, 422, 'ASSESSMENT_NOT_FOUND', 'Seçilen seviyeye ait aktif test bulunamadı.');

  const { data: submission, error: submissionError } = await client.from('assessment_submissions').insert({
    student_id: req.user.id,
    assessment_id: assessment.id,
    status: 'pending',
  }).select('id').single();
  if (submissionError) return sendError(res, 422, 'SUBMISSION_FAILED', submissionError.message);

  const { data: application, error: applicationError } = await client.from('level_analysis_applications').insert({
    user_id: req.user.id,
    exam_group: examGroup,
    level,
    full_name: fullName,
    education_status: educationStatus,
    target_exam: targetExam,
    contact_info: contactInfo,
    assessment_id: assessment.id,
    submission_id: submission.id,
    status: 'submitted',
  }).select('id').single();
  if (applicationError) return sendError(res, 422, 'APPLICATION_FAILED', applicationError.message);

  const fileRows = files.map((file, index) => ({
    application_id: application.id,
    file_path: file.path,
    file_name: String(file.fileName ?? file.path.split('/').pop()),
    mime_type: String(file.mimeType ?? ''),
    file_size: Number(file.fileSize) || 0,
    sort_order: index + 1,
  }));
  const { error: filesError } = await client.from('level_analysis_files').insert(fileRows);
  if (filesError) return sendError(res, 422, 'APPLICATION_FILES_FAILED', filesError.message);

  const assessmentFileRows = files.map((file, index) => ({
    submission_id: submission.id,
    storage_path: file.path,
    file_name: String(file.fileName ?? file.path.split('/').pop()),
    mime_type: String(file.mimeType ?? ''),
    file_size: Number(file.fileSize) || 0,
    sort_order: index + 1,
  }));
  const { error: assessmentFilesError } = await client.from('assessment_submission_files').insert(assessmentFileRows);
  if (assessmentFilesError) return sendError(res, 422, 'SUBMISSION_FILES_FAILED', assessmentFilesError.message);

  return sendSuccess(res, { applicationId: application.id, submissionId: submission.id }, 201);
});