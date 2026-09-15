// backend/ingest/collector.js
// Fetch failures are isolated per source so one unavailable provider cannot
// prevent the rest of the official sources from being checked.
import { normalizeItem, validateItem, computeDedupHash } from './normalizer.js';
import { buildAdapters } from './registry.js';
import { archiveStaleUpdates, markSourceChecked, saveFetchedItem } from './store.js';

export async function runAdapter({ source, adapter }) {
  const report = { source: adapter.name, inserted: 0, skipped: 0, archived: 0, errors: [] };
  let items;
  try {
    items = await adapter.fetch();
  } catch (error) {
    report.errors.push(`fetch failed: ${error.message}`);
    logError(adapter.name, 'fetch', error);
    return report;
  }

  // Mock adapters are intentionally in-memory: useful for testing the
  // adapter contract without credentials or external network access.
  if (!source) return report;

  for (const raw of items) {
    try {
      const item = validateItem(normalizeItem(raw, adapter.name));
      const result = await saveFetchedItem(source, item, computeDedupHash(item));
      if (result.inserted) report.inserted += 1;
      else report.skipped += 1;
    } catch (error) {
      report.skipped += 1;
      report.errors.push(error.message);
      logError(adapter.name, 'validate/save', error);
    }
  }

  try {
    await markSourceChecked(source.id);
    report.archived = await archiveStaleUpdates(source.id);
  } catch (error) {
    report.errors.push(`source state failed: ${error.message}`);
    logError(adapter.name, 'source-state', error);
  }
  return report;
}

export async function runAll(entries = null) {
  const activeEntries = entries || await buildAdapters();
  const results = [];
  for (const entry of activeEntries) results.push(await runAdapter(entry));
  return results;
}

function logError(source, stage, error) {
  console.error(JSON.stringify({
    level: 'error', module: 'ingest', source, stage,
    message: error.message, at: new Date().toISOString(),
  }));
}
