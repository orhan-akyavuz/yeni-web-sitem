// backend/routes/articles.js
import { Router } from 'express';
import { db } from '../db/connection.js';
import { sendSuccess, notFound } from '../middleware/response.js';

export const articlesRouter = Router();

function serializeArticle(row, tags) {
  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    category: { slug: row.category_slug, name: row.category_name },
    author: row.author_name,
    coverImage: row.cover_image,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    readMinutes: row.read_minutes,
    viewCount: row.view_count,
    tags,
  };
}

function getTagsForArticle(articleId) {
  const stmt = db.prepare(`
    SELECT t.slug, t.name
    FROM tags t
    JOIN article_tags at ON at.tag_id = t.id
    WHERE at.article_id = ?
    ORDER BY t.name
  `);
  return stmt.all(articleId).map((t) => ({ slug: t.slug, name: t.name }));
}

/**
 * GET /api/articles
 * Query parametreleri:
 *   ?category=matematik   — kategoriye göre filtrele
 *   ?tag=python           — etikete göre filtrele
 *   ?sort=newest|oldest|alphabetical|popular  (varsayılan: newest)
 *   ?page=1&limit=6       — sayfalama (Sprint 7 §12 — numaralı sayfalama)
 */
articlesRouter.get('/', (req, res) => {
  const { category, tag } = req.query;
  const sort = req.query.sort ?? 'newest';
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 6));
  const offset = (page - 1) * limit;

  let sql = `
    SELECT a.*, c.slug AS category_slug, c.name AS category_name
    FROM articles a
    JOIN categories c ON c.id = a.category_id
  `;
  const conditions = [];
  const params = [];

  if (category) {
    conditions.push('c.slug = ?');
    params.push(category);
  }
  if (tag) {
    conditions.push(`a.id IN (SELECT at.article_id FROM article_tags at JOIN tags t ON t.id = at.tag_id WHERE t.slug = ?)`);
    params.push(tag);
  }
  if (conditions.length) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  const orderMap = {
    newest: 'a.published_at DESC',
    oldest: 'a.published_at ASC',
    alphabetical: 'a.title COLLATE NOCASE ASC',
    popular: 'a.view_count DESC',
  };
  sql += ` ORDER BY ${orderMap[sort] ?? orderMap.newest}`;

  const countStmt = db.prepare(`SELECT COUNT(*) AS total FROM (${sql})`);
  const total = countStmt.get(...params).total;

  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const rows = db.prepare(sql).all(...params);
  const articles = rows.map((row) => serializeArticle(row, getTagsForArticle(row.id)));

  sendSuccess(res, {
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

/** GET /api/articles/:slug — tekil makale, görüntülenme sayacını da artırır */
articlesRouter.get('/:slug', (req, res) => {
  const row = db.prepare(`
    SELECT a.*, c.slug AS category_slug, c.name AS category_name
    FROM articles a
    JOIN categories c ON c.id = a.category_id
    WHERE a.slug = ?
  `).get(req.params.slug);

  if (!row) return notFound(res, 'Makale');

  db.prepare('UPDATE articles SET view_count = view_count + 1 WHERE id = ?').run(row.id);
  row.view_count += 1;

  const tags = getTagsForArticle(row.id);
  const article = serializeArticle(row, tags);
  article.bodyHtml = row.body_html;

  // Önceki/Sonraki makale (yayın tarihine göre komşular — Sprint 8 §7.5)
  const prev = db.prepare(`
    SELECT slug, title FROM articles WHERE published_at < ? ORDER BY published_at DESC LIMIT 1
  `).get(row.published_at);
  const next = db.prepare(`
    SELECT slug, title FROM articles WHERE published_at > ? ORDER BY published_at ASC LIMIT 1
  `).get(row.published_at);

  // Benzer yazılar: aynı kategoriden, kendisi hariç, en yeni 3 (Sprint 8 §7.6)
  const related = db.prepare(`
    SELECT a.slug, a.title, a.excerpt, a.cover_image, a.published_at, a.read_minutes, c.name AS category_name
    FROM articles a JOIN categories c ON c.id = a.category_id
    WHERE a.category_id = ? AND a.id != ?
    ORDER BY a.published_at DESC LIMIT 3
  `).all(row.category_id, row.id);

  sendSuccess(res, {
    article,
    prev: prev ?? null,
    next: next ?? null,
    related: related.map((r) => ({
      slug: r.slug, title: r.title, excerpt: r.excerpt, coverImage: r.cover_image,
      publishedAt: r.published_at, readMinutes: r.read_minutes, category: r.category_name,
    })),
  });
});
