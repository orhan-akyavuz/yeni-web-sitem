import { Router } from 'express';
import { db } from '../db/connection.js';
import { sendSuccess, sendError, notFound } from '../middleware/response.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';

export const aiRouter = Router();

aiRouter.post('/solution-analysis', requireAuthenticatedUser, (req, res) => {
  const submissionId = Number(req.body?.submissionId);
  if (!Number.isSafeInteger(submissionId) || submissionId < 1) {
    return sendError(res, 400, 'INVALID_SUBMISSION_ID', 'Gönderi kimliği geçersiz.');
  }

  const submission = db.prepare('SELECT id, user_id FROM submissions WHERE id = ?').get(submissionId);
  if (!submission) return notFound(res, 'Gönderi');
  if (submission.user_id !== req.user.id && req.user.role !== 'admin') {
    return sendError(res, 403, 'SUBMISSION_ACCESS_DENIED', 'Bu gönderiyi analiz etme yetkiniz yok.');
  }

  return sendSuccess(res, {
    requestId: `solution-analysis-${submissionId}-${Date.now()}`,
    status: 'queued',
    analysis: null,
  }, 202);
});