// backend/ingest/normalizer.js
// ----------------------------------------------------------------------
// Ham veriyi ortak IngestItem formatına dönüştür ve zorunlu alanları
// doğrular. Tüm adapter'lar çıktılarını buradan geçirir.
// ----------------------------------------------------------------------
import { VALID_CATEGORIES } from './types.js';

/**
 * Ham kaydı normalize et.
 * @param {Partial<IngestItem>} raw
 * @param {string} fallbackSourceName
 * @returns {IngestItem}
 */
export function normalizeItem(raw, fallbackSourceName = 'bilinmeyen') {
  const now = new Date().toISOString();

  const item = {
    sourceName: String(raw.sourceName || fallbackSourceName).trim(),
    externalId: raw.externalId ? String(raw.externalId).trim() : null,
    title: String(raw.title || '').trim(),
    summary: String(raw.summary || '').trim(),
    officialUrl: String(raw.officialUrl || raw.originalUrl || '').trim(),
    category: String(raw.category || 'diger').trim().toLowerCase(),
    publishedAt: toIso(raw.publishedAt) || now,
    fetchedAt: now,
  };

  return item;
}

/**
 * Zorunlu alanları doğrula. Hatalıysa Error fırlatır (collector yakalar).
 * @param {IngestItem} item
 */
export function validateItem(item) {
  if (!item.title || item.title.length < 3) {
    throw new ValidationError('title zorunlu ve en az 3 karakter olmalı');
  }
  if (!isValidHttpUrl(item.officialUrl)) {
    throw new ValidationError(`officialUrl geçerli bir http(s) adresi değil: ${item.officialUrl}`);
  }
  if (!VALID_CATEGORIES.includes(item.category)) {
    throw new ValidationError(`geçersiz kategori: ${item.category}`);
  }
  if (!item.sourceName) {
    throw new ValidationError('sourceName zorunlu');
  }
  return item;
}

/**
 * Tekrar kontrolü için deterministik dedup hash üretir.
 * Aynı kaynakta aynı external_id veya aynı başlık+URL tekrar eklenmesin.
 * @param {IngestItem} item
 * @returns {string} sha256 hex (dedup_hash kolonuna yazılır)
 */
export function computeDedupHash(item) {
  const basis = item.externalId
    ? `${item.sourceName}::${item.externalId}`
    : `${item.sourceName}::${item.title.toLowerCase()}::${item.officialUrl}`;
  return sha256Hex(basis);
}

// ---------------------------------------------------------------- helpers

class ValidationError extends Error {
  constructor(msg) {
    super(`Doğrulama hatası: ${msg}`);
    this.name = 'ValidationError';
  }
}

function toIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function isValidHttpUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

import { createHash } from 'node:crypto';
function sha256Hex(str) {
  return createHash('sha256').update(str).digest('hex');
}

export { ValidationError };
