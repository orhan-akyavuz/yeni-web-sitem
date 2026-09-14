// backend/services/currentInfo.js
// ----------------------------------------------------------------------
// Güncel Bilgiler modülü için veritabanı servis katmanı.
// Supabase veya yerel fallback (SQLite) ile şeffaf şekilde haberleşir.
// ----------------------------------------------------------------------
import { createHash } from 'node:crypto';
import { supabase, supabaseClientForToken, supabaseConfigured } from './supabase.js';
import { db } from '../db/connection.js';

// SQLite için yerel tablo oluşturma (yerel geliştirme veya Supabase çevrimdışı fallback'i)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      website_url TEXT NOT NULL,
      feed_url TEXT,
      category TEXT NOT NULL CHECK (category IN ('banka', 'kamu', 'sinav', 'egitim', 'diger')),
      source_type TEXT NOT NULL DEFAULT 'scraper',
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
      last_checked_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS current_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id INTEGER NOT NULL REFERENCES content_sources(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      summary TEXT,
      original_url TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('banka', 'kamu', 'ags', 'kpss', 'ales', 'dgs', 'egitim', 'diger')),
      publish_date TEXT NOT NULL DEFAULT (datetime('now')),
      fetched_at TEXT NOT NULL DEFAULT (datetime('now')),
      status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
      external_id TEXT,
      dedup_hash TEXT NOT NULL UNIQUE,
      is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
      metadata TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Başlangıç resmî banka ve kamu kaynaklarını yerel veritabanına ekle (yoksa)
  const sourceCount = db.prepare('SELECT count(*) as count FROM content_sources').get()?.count || 0;
  if (sourceCount === 0) {
    const insertSource = db.prepare(`
      INSERT INTO content_sources (name, slug, website_url, category, source_type, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    insertSource.run('Ziraat Bankası', 'ziraat-bankasi', 'https://www.ziraatbank.com.tr', 'banka', 'scraper');
    insertSource.run('VakıfBank', 'vakifbank', 'https://www.vakifbank.com.tr', 'banka', 'scraper');
    insertSource.run('Halkbank', 'halkbank', 'https://www.halkbank.com.tr', 'banka', 'scraper');
    insertSource.run('Türkiye İş Bankası', 'is-bankasi', 'https://www.isbank.com.tr', 'banka', 'scraper');
    insertSource.run('ÖSYM', 'osym', 'https://www.osym.gov.tr', 'sinav', 'scraper');
    insertSource.run('Kariyer Kapısı (CBİKO)', 'kariyer-kapisi', 'https://isealimkariyerkapisi.cbiko.gov.tr', 'kamu', 'scraper');
  }
} catch (e) {
  console.warn('[currentInfo.js] SQLite yerel tablo kurulumu atlandı:', e.message);
}

export function generateDedupHash(originalUrl, title) {
  return createHash('sha256')
    .update(`${originalUrl.trim().toLowerCase()}|${title.trim().toLowerCase()}`)
    .digest('hex');
}

/**
 * Kullanıcı tarafı için sadece 'published' durumundaki güncel bilgileri getirir.
 */
export async function getPublicUpdates({ category, search, limit = 20, page = 1 } = {}) {
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (safePage - 1) * safeLimit;

  if (process.env.AUTH_PROVIDER === 'supabase' && supabaseConfigured && supabase) {
    let query = supabase
      .from('current_updates')
      .select('id, title, summary, original_url, category, publish_date, is_featured, content_sources!inner(id, name, slug, website_url)', { count: 'exact' })
      .eq('status', 'published');

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    query = query
      .order('is_featured', { ascending: false })
      .order('publish_date', { ascending: false })
      .range(offset, offset + safeLimit - 1);

    const { data, count, error } = await query;
    if (error) {
      console.error('[currentInfo.js] Supabase getPublicUpdates hatası:', error);
      throw new Error(error.message);
    }

    const items = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      originalUrl: row.original_url,
      category: row.category,
      publishDate: row.publish_date,
      isFeatured: Boolean(row.is_featured),
      source: row.content_sources ? {
        id: row.content_sources.id,
        name: row.content_sources.name,
        slug: row.content_sources.slug,
        websiteUrl: row.content_sources.website_url,
      } : null,
    }));

    return {
      items,
      pagination: {
        total: count ?? items.length,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil((count ?? items.length) / safeLimit) || 1,
      },
    };
  }

  // Fallback: Yerel SQLite
  const conditions = ["u.status = 'published'"];
  const params = [];

  if (category && category !== 'all') {
    conditions.push('u.category = ?');
    params.push(category);
  }
  if (search) {
    conditions.push('(u.title LIKE ? OR u.summary LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const totalRow = db.prepare(`
    SELECT count(*) AS count
    FROM current_updates u
    JOIN content_sources s ON s.id = u.source_id
    ${whereClause}
  `).get(...params);

  const total = totalRow?.count || 0;

  const rows = db.prepare(`
    SELECT
      u.id, u.title, u.summary, u.original_url, u.category, u.publish_date, u.is_featured,
      s.id AS source_id, s.name AS source_name, s.slug AS source_slug, s.website_url AS source_website_url
    FROM current_updates u
    JOIN content_sources s ON s.id = u.source_id
    ${whereClause}
    ORDER BY u.is_featured DESC, u.publish_date DESC
    LIMIT ? OFFSET ?
  `).all(...params, safeLimit, offset);

  const items = rows.map((r) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    originalUrl: r.original_url,
    category: r.category,
    publishDate: r.publish_date,
    isFeatured: Boolean(r.is_featured),
    source: {
      id: r.source_id,
      name: r.source_name,
      slug: r.source_slug,
      websiteUrl: r.source_website_url,
    },
  }));

  return {
    items,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Aktif resmî kaynakları listeler (Admin formunda ve filtrelerde kullanılır).
 */
export async function getActiveSources() {
  if (process.env.AUTH_PROVIDER === 'supabase' && supabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('content_sources')
      .select('id, name, slug, website_url, category')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw new Error(error.message);
    return data ?? [];
  }

  const rows = db.prepare(`
    SELECT id, name, slug, website_url, category
    FROM content_sources
    WHERE is_active = 1
    ORDER BY name ASC
  `).all();

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    websiteUrl: r.website_url,
    category: r.category,
  }));
}

/**
 * Admin: Tüm içerikleri (draft, published, archived) filtreleyerek listeler.
 */
export async function adminListUpdates(authToken, { status, category, search, limit = 50, page = 1 } = {}) {
  const safeLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const offset = (safePage - 1) * safeLimit;

  if (process.env.AUTH_PROVIDER === 'supabase') {
    const client = supabaseClientForToken(authToken);
    let query = client
      .from('current_updates')
      .select('id, title, summary, original_url, category, publish_date, status, is_featured, external_id, created_at, content_sources(id, name, slug)', { count: 'exact' });

    if (status && status !== 'all') query = query.eq('status', status);
    if (category && category !== 'all') query = query.eq('category', category);
    if (search) query = query.ilike('title', `%${search}%`);

    query = query
      .order('publish_date', { ascending: false })
      .range(offset, offset + safeLimit - 1);

    const { data, count, error } = await query;
    if (error) throw new Error(error.message);

    return {
      items: (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        summary: row.summary,
        originalUrl: row.original_url,
        category: row.category,
        publishDate: row.publish_date,
        status: row.status,
        isFeatured: Boolean(row.is_featured),
        externalId: row.external_id,
        createdAt: row.created_at,
        source: row.content_sources ? {
          id: row.content_sources.id,
          name: row.content_sources.name,
          slug: row.content_sources.slug,
        } : null,
      })),
      pagination: {
        total: count ?? 0,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil((count ?? 0) / safeLimit) || 1,
      },
    };
  }

  // SQLite admin listesi
  const conditions = [];
  const params = [];
  if (status && status !== 'all') {
    conditions.push('u.status = ?');
    params.push(status);
  }
  if (category && category !== 'all') {
    conditions.push('u.category = ?');
    params.push(category);
  }
  if (search) {
    conditions.push('(u.title LIKE ? OR u.summary LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const totalRow = db.prepare(`SELECT count(*) AS count FROM current_updates u ${whereClause}`).get(...params);
  const total = totalRow?.count || 0;

  const rows = db.prepare(`
    SELECT
      u.id, u.title, u.summary, u.original_url, u.category, u.publish_date, u.status, u.is_featured, u.external_id, u.created_at,
      s.id AS source_id, s.name AS source_name, s.slug AS source_slug
    FROM current_updates u
    JOIN content_sources s ON s.id = u.source_id
    ${whereClause}
    ORDER BY u.publish_date DESC
    LIMIT ? OFFSET ?
  `).all(...params, safeLimit, offset);

  return {
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      summary: r.summary,
      originalUrl: r.original_url,
      category: r.category,
      publishDate: r.publish_date,
      status: r.status,
      isFeatured: Boolean(r.is_featured),
      externalId: r.external_id,
      createdAt: r.created_at,
      source: {
        id: r.source_id,
        name: r.source_name,
        slug: r.source_slug,
      },
    })),
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
}

/**
 * Admin: Yeni güncel bilgi ekleme.
 */
export async function adminCreateUpdate(authToken, clean) {
  const dedupHash = generateDedupHash(clean.originalUrl, clean.title);

  if (process.env.AUTH_PROVIDER === 'supabase') {
    const client = supabaseClientForToken(authToken);
    const { data, error } = await client
      .from('current_updates')
      .insert({
        source_id: clean.sourceId,
        title: clean.title,
        summary: clean.summary || null,
        original_url: clean.originalUrl,
        category: clean.category,
        publish_date: clean.publishDate,
        status: clean.status,
        is_featured: clean.isFeatured,
        external_id: clean.externalId,
        dedup_hash: dedupHash,
      })
      .select('id')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Bu içerik veya internet bağlantısı zaten veritabanında kayıtlı.');
      }
      throw new Error(error.message);
    }
    return { id: data.id };
  }

  try {
    const result = db.prepare(`
      INSERT INTO current_updates (
        source_id, title, summary, original_url, category, publish_date, status, is_featured, external_id, dedup_hash
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      clean.sourceId,
      clean.title,
      clean.summary || null,
      clean.originalUrl,
      clean.category,
      clean.publishDate,
      clean.status,
      clean.isFeatured ? 1 : 0,
      clean.externalId,
      dedupHash,
    );
    return { id: Number(result.lastInsertRowid) };
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      throw new Error('Bu içerik veya internet bağlantısı zaten veritabanında kayıtlı.');
    }
    throw error;
  }
}

/**
 * Admin: Güncel bilgiyi güncelleme.
 */
export async function adminUpdateItem(authToken, id, clean) {
  const dedupHash = generateDedupHash(clean.originalUrl, clean.title);

  if (process.env.AUTH_PROVIDER === 'supabase') {
    const client = supabaseClientForToken(authToken);
    const { data, error } = await client
      .from('current_updates')
      .update({
        source_id: clean.sourceId,
        title: clean.title,
        summary: clean.summary || null,
        original_url: clean.originalUrl,
        category: clean.category,
        publish_date: clean.publishDate,
        status: clean.status,
        is_featured: clean.isFeatured,
        external_id: clean.externalId,
        dedup_hash: dedupHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id')
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Bu içerik veya internet bağlantısı başka bir kayıtta zaten kullanılıyor.');
      }
      throw new Error(error.message);
    }
    return Boolean(data);
  }

  const result = db.prepare(`
    UPDATE current_updates
    SET source_id = ?, title = ?, summary = ?, original_url = ?, category = ?, publish_date = ?,
        status = ?, is_featured = ?, external_id = ?, dedup_hash = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    clean.sourceId,
    clean.title,
    clean.summary || null,
    clean.originalUrl,
    clean.category,
    clean.publishDate,
    clean.status,
    clean.isFeatured ? 1 : 0,
    clean.externalId,
    dedupHash,
    id,
  );

  return result.changes > 0;
}

/**
 * Admin: Güncel bilgi kaydını silme.
 */
export async function adminDeleteUpdate(authToken, id) {
  if (process.env.AUTH_PROVIDER === 'supabase') {
    const client = supabaseClientForToken(authToken);
    const { error } = await client
      .from('current_updates')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  const result = db.prepare('DELETE FROM current_updates WHERE id = ?').run(id);
  return result.changes > 0;
}
