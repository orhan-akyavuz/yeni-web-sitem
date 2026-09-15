// backend/ingest/registry.js
// Converts only active, administrator-defined source records into adapters.
import { createMockAdapter } from './adapters/mock.js';
import { createRssAdapter } from './adapters/rss.js';
import { getActiveIngestSources } from './store.js';

export async function buildAdapters({ mock = false } = {}) {
  if (mock) return [{ source: null, adapter: createMockAdapter() }];
  const sources = await getActiveIngestSources();
  return sources.flatMap((source) => {
    if (source.sourceType !== 'rss' || !source.feedUrl) return [];
    const category = source.category === 'sinav' ? 'diger' : source.category;
    return [{ source, adapter: createRssAdapter(source.slug, source.feedUrl, category) }];
  });
}
