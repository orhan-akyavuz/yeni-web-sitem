// backend/routes/adminCurrentInfo.js
// ----------------------------------------------------------------------
// Yönetici için Güncel Bilgiler yönetim rotaları.
// requireAuthenticatedUser ve requireAdmin ile korunmaktadır.
// ----------------------------------------------------------------------
import { Router } from 'express';
import { requireAuthenticatedUser, requireAdmin } from '../middleware/auth.js';
import { validateCurrentUpdatePayload } from '../middleware/validation.js';
import {
  adminListUpdates,
  adminCreateUpdate,
  adminUpdateItem,
  adminDeleteUpdate,
  getActiveSources,
} from '../services/currentInfo.js';
import { runAll } from '../ingest/index.js';
import { sendSuccess, sendError, notFound } from '../middleware/response.js';

export const adminCurrentInfoRouter = Router();

// Tüm rotalar yönetici doğrulaması gerektirir
adminCurrentInfoRouter.use(requireAuthenticatedUser, requireAdmin);

// Manuel ingest tetikleme: aktif kaynaklardan veri ceker, draft olarak kaydeder
adminCurrentInfoRouter.post('/ingest', async (_req, res) => {
  try {
    const result = await runAll();
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, 500, 'INGEST_FAILED', error.message);
  }
});

adminCurrentInfoRouter.get('/sources', async (_req, res) => {
  try {
    const sources = await getActiveSources();
    return sendSuccess(res, { sources });
  } catch (error) {
    return sendError(res, 500, 'ADMIN_SOURCES_ERROR', error.message);
  }
});

adminCurrentInfoRouter.get('/', async (req, res) => {
  try {
    const { status, category, search, page, limit } = req.query;
    const result = await adminListUpdates(req.authToken, { status, category, search, page, limit });
    return sendSuccess(res, result);
  } catch (error) {
    return sendError(res, 500, 'ADMIN_LIST_ERROR', error.message);
  }
});

adminCurrentInfoRouter.post('/', async (req, res) => {
  const { valid, errors, clean } = validateCurrentUpdatePayload(req.body);
  if (!valid) {
    return sendError(res, 422, 'VALIDATION_ERROR', JSON.stringify(errors));
  }

  try {
    const result = await adminCreateUpdate(req.authToken, clean);
    return sendSuccess(res, result, 201);
  } catch (error) {
    return sendError(res, 422, 'CREATE_ERROR', error.message);
  }
});

adminCurrentInfoRouter.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return sendError(res, 400, 'INVALID_ID', 'Geçersiz kayıt kimliği.');
  }

  const { valid, errors, clean } = validateCurrentUpdatePayload(req.body);
  if (!valid) {
    return sendError(res, 422, 'VALIDATION_ERROR', JSON.stringify(errors));
  }

  try {
    const updated = await adminUpdateItem(req.authToken, id, clean);
    if (!updated) return notFound(res, 'Güncel bilgi kaydı');
    return sendSuccess(res, { updated: true });
  } catch (error) {
    return sendError(res, 422, 'UPDATE_ERROR', error.message);
  }
});

adminCurrentInfoRouter.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return sendError(res, 400, 'INVALID_ID', 'Geçersiz kayıt kimliği.');
  }

  try {
    const deleted = await adminDeleteUpdate(req.authToken, id);
    if (!deleted) return notFound(res, 'Güncel bilgi kaydı');
    return sendSuccess(res, { deleted: true });
  } catch (error) {
    return sendError(res, 500, 'DELETE_ERROR', error.message);
  }
});
