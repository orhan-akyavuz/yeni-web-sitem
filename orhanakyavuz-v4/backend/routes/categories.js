// backend/routes/categories.js
import { Router } from 'express';
import { db } from '../db/connection.js';
import { sendSuccess, notFound } from '../middleware/response.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT c.slug, c.name, c.description, COUNT(a.id) AS article_count
    FROM categories c
    LEFT JOIN articles a ON a.category_id = c.id
    GROUP BY c.id
    ORDER BY c.name COLLATE NOCASE ASC
  `).all();

  sendSuccess(res, rows.map((r) => ({
    slug: r.slug, name: r.name, description: r.description, articleCount: r.article_count,
  })));
});

categoriesRouter.get('/:slug', (req, res) => {
  const row = db.prepare(`
    SELECT c.slug, c.name, c.description, COUNT(a.id) AS article_count
    FROM categories c
    LEFT JOIN articles a ON a.category_id = c.id
    WHERE c.slug = ?
    GROUP BY c.id
  `).get(req.params.slug);

  if (!row) return notFound(res, 'Kategori');

  sendSuccess(res, {
    slug: row.slug, name: row.name, description: row.description, articleCount: row.article_count,
  });
});
