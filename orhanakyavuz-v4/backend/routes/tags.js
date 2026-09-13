// backend/routes/tags.js
import { Router } from 'express';
import { db } from '../db/connection.js';
import { sendSuccess } from '../middleware/response.js';

export const tagsRouter = Router();

tagsRouter.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT t.slug, t.name, COUNT(at.article_id) AS article_count
    FROM tags t
    LEFT JOIN article_tags at ON at.tag_id = t.id
    GROUP BY t.id
    ORDER BY t.name COLLATE NOCASE ASC
  `).all();

  sendSuccess(res, rows.map((r) => ({
    slug: r.slug, name: r.name, articleCount: r.article_count,
  })));
});
