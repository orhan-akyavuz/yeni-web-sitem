// backend/routes/currentInfo.js
// ----------------------------------------------------------------------
// Kullanıcı tarafı için Güncel Bilgiler herkese açık API rotaları.
// Yalnızca status = 'published' olan kayıtları döner.
// ----------------------------------------------------------------------
import { Router } from 'express';
import { getPublicUpdates, getActiveSources } from '../services/currentInfo.js';
import { sendSuccess, sendError } from '../middleware/response.js';

export const currentInfoRouter = Router();

currentInfoRouter.get('/', async (req, res) => {
  try {
    const { category, search, page, limit } = req.query;
    const result = await getPublicUpdates({ category, search, page, limit });
    return sendSuccess(res, result);
  } catch (error) {
    console.error('[currentInfoRouter] Hata:', error);
    return sendError(res, 500, 'FETCH_FAILED', 'Güncel bilgiler yüklenirken bir sorun oluştu.');
  }
});

currentInfoRouter.get('/sources', async (_req, res) => {
  try {
    const sources = await getActiveSources();
    return sendSuccess(res, { sources });
  } catch (error) {
    console.error('[currentInfoRouter /sources] Hata:', error);
    return sendError(res, 500, 'FETCH_SOURCES_FAILED', 'Resmî kaynaklar yüklenemedi.');
  }
});
