// backend/routes/search.js
import { Router } from 'express';
import { db } from '../db/connection.js';
import { sendSuccess, sendError } from '../middleware/response.js';

export const searchRouter = Router();

/** GET /api/search?q=...&page=1&limit=6 */
searchRouter.get('/', (req, res) => {
  const q = (req.query.q ?? '').toString().trim();
  if (!q) {
    return sendError(res, 400, 'MISSING_QUERY', 'Arama için "q" parametresi gereklidir.');
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6));
  const offset = (page - 1) * limit;
  const like = `%${q}%`;

  const countRow = db.prepare(`
    SELECT COUNT(*) AS total FROM articles
    WHERE title LIKE ? OR excerpt LIKE ? OR body_html LIKE ?
  `).get(like, like, like);

  const rows = db.prepare(`
    SELECT a.slug, a.title, a.excerpt, a.cover_image, a.published_at, a.read_minutes, c.name AS category_name
    FROM articles a JOIN categories c ON c.id = a.category_id
    WHERE a.title LIKE ? OR a.excerpt LIKE ? OR a.body_html LIKE ?
    ORDER BY a.published_at DESC
    LIMIT ? OFFSET ?
  `).all(like, like, like, limit, offset);

  sendSuccess(res, {
    query: q,
    results: rows.map((r) => ({
      slug: r.slug, title: r.title, excerpt: r.excerpt, coverImage: r.cover_image,
      publishedAt: r.published_at, readMinutes: r.read_minutes, category: r.category_name,
    })),
    pagination: {
      page, limit, total: countRow.total,
      totalPages: Math.max(1, Math.ceil(countRow.total / limit)),
    },
  });
});
