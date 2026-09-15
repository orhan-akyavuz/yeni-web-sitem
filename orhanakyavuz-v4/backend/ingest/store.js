// backend/ingest/store.js
// The collector uses this small persistence boundary rather than knowing
// whether the application runs on Supabase or the local SQLite fallback.
import { db } from '../db/connection.js';
import { getSupabaseAdmin } from './db.js';

const usesSupabase = () => process.env.AUTH_PROVIDER === 'supabase';

function mapSource(row) {
  return { id: row.id, name: row.name, slug: row.slug, websiteUrl: row.website_url,
    feedUrl: row.feed_url, category: row.category, sourceType: row.source_type };
}

export async function getActiveIngestSources() {
  if (usesSupabase()) {
    const { data, error } = await getSupabaseAdmin().from('content_sources')
      .select('id, name, slug, website_url, feed_url, category, source_type').eq('is_active', true);
    if (error) throw new Error(error.message);
    return (data || []).map(mapSource);
  }
  return db.prepare(`SELECT id, name, slug, website_url, feed_url, category, source_type
    FROM content_sources WHERE is_active = 1`).all().map(mapSource);
}

export async function saveFetchedItem(source, item, dedupHash) {
  if (usesSupabase()) {
    const client = getSupabaseAdmin();
    const { data: existing, error: findError } = await client
      .from('current_updates').select('id').eq('dedup_hash', dedupHash).maybeSingle();
    if (findError) throw new Error(findError.message);
    const values = { source_id: source.id, title: item.title, summary: item.summary || null,
      original_url: item.officialUrl, category: item.category, publish_date: item.publishedAt,
      fetched_at: item.fetchedAt, external_id: item.externalId, dedup_hash: dedupHash };
    const { error } = existing
      ? await client.from('current_updates').update(values).eq('id', existing.id)
      : await client.from('current_updates').insert({ ...values, status: 'draft' });
    if (error) throw new Error(error.message);
    return { inserted: !existing };
  }
  const existing = db.prepare('SELECT id FROM current_updates WHERE dedup_hash = ?').get(dedupHash);
  if (existing) {
    db.prepare(`UPDATE current_updates SET title = ?, summary = ?, original_url = ?, category = ?,
      publish_date = ?, fetched_at = ?, external_id = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(item.title, item.summary || null, item.officialUrl, item.category, item.publishedAt,
      item.fetchedAt, item.externalId, existing.id);
    return { inserted: false };
  }
  db.prepare(`INSERT INTO current_updates (source_id, title, summary, original_url, category,
    publish_date, fetched_at, status, external_id, dedup_hash) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`
  ).run(source.id, item.title, item.summary || null, item.officialUrl, item.category,
    item.publishedAt, item.fetchedAt, item.externalId, dedupHash);
  return { inserted: true };
}

export async function markSourceChecked(sourceId) {
  if (usesSupabase()) {
    const { error } = await getSupabaseAdmin().from('content_sources')
      .update({ last_checked_at: new Date().toISOString() }).eq('id', sourceId);
    if (error) throw new Error(error.message);
    return;
  }
  db.prepare("UPDATE content_sources SET last_checked_at = datetime('now') WHERE id = ?").run(sourceId);
}

// A missing feed item is never deleted. Only items not seen for a long,
// configurable period are archived after a successful collection run.
export async function archiveStaleUpdates(sourceId, days = Number(process.env.INGEST_ARCHIVE_AFTER_DAYS || 90)) {
  if (!Number.isFinite(days) || days < 1) return 0;
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
  if (usesSupabase()) {
    const { data, error } = await getSupabaseAdmin().from('current_updates')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('source_id', sourceId).neq('status', 'archived').lt('fetched_at', cutoff).select('id');
    if (error) throw new Error(error.message);
    return data?.length || 0;
  }
  const result = db.prepare(`UPDATE current_updates SET status = 'archived', updated_at = datetime('now')
    WHERE source_id = ? AND status != 'archived' AND fetched_at < ?`).run(sourceId, cutoff);
  return result.changes;
}
