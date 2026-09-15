// backend/ingest/index.js
// Public entry point for the backend-only ingestion module.
export { buildAdapters } from './registry.js';
export { runAll, runAdapter } from './collector.js';
export { normalizeItem, validateItem, computeDedupHash } from './normalizer.js';
export { fetchWithTimeout } from './fetchWithTimeout.js';
export { startIngestScheduler } from './scheduler.js';
