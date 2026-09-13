// backend/routes/stats.js
// Site geneli toplu istatistikler (sosyal kanıt bölümü için).
// GET /api/stats → { articles, categories, tags, totalViews }
import { Router } from 'express';
import { db } from '../db/connection.js';
import { sendSuccess } from '../middleware/response.js';

export const statsRouter = Router();

statsRouter.get('/', (_req, res) => {
  const articles = db.prepare('SELECT COUNT(*) AS n FROM articles').get().n;
  const categories = db.prepare('SELECT COUNT(*) AS n FROM categories').get().n;
  const tags = db.prepare('SELECT COUNT(*) AS n FROM tags').get().n;
  const totalViews = db.prepare('SELECT COALESCE(SUM(view_count), 0) AS n FROM articles').get().n;

  sendSuccess(res, {
    articles,
    categories,
    tags,
    totalViews,
  });
});
