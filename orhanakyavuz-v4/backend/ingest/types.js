// backend/ingest/types.js
// ----------------------------------------------------------------------
// Ortak veri formatı ve adapter sözleşmesi (source adapter interface).
// Her adapter, fetch() metodundan aşağıdaki yapıda ITEM dizisi döndürmek
// zorundadır. Tüm normalizasyon sonrası alanlar burada tanımlıdır.
// ----------------------------------------------------------------------

/**
 * Ortak içerik formatı (normalized item).
 * @typedef {Object} IngestItem
 * @property {string} sourceName   - Kaynak adı (content_sources.name ile eşleşir)
 * @property {string|null} externalId - Kaynağın kendi içerik kimliği (varsa)
 * @property {string} title        - Başlık (zorunlu)
 * @property {string} summary      - Kısa özet
 * @property {string} officialUrl  - Resmî içerik URL'si (http/https, zorunlu)
 * @property {string} category     - banka|kamu|sinav|egitim|diger (current_updates check'e göre)
 * @property {string} publishedAt  - ISO 8601 tarih
 * @property {string} fetchedAt    - ISO 8601 tarih (toplama anı)
 */

/**
 * Adapter sözleşmesi. Yeni bir kaynak eklemek için bu arayüzü uygulayan
 * bir nesne oluşturun ve collector'daki ADAPTERS eşlemesine kaydedin.
 * @typedef {Object} SourceAdapter
 * @property {string} name              - content_sources.slug ile eşleşen benzersiz ad
 * @property {string} sourceType        - rss|api|scraper|manual
 * @property {() => Promise<IngestItem[]>} fetch
 *   - Ham veriyi çeker, normalize eder ve IngestItem[] döndür.
 *   - Hata durumunda exception fırlatabilir; collector bunu izole eder.
 */

export const ITEM_FIELDS = [
  'sourceName',
  'externalId',
  'title',
  'summary',
  'officialUrl',
  'category',
  'publishedAt',
  'fetchedAt',
];

/** current_updates.category check constraint ile uyumlu kategoriler */
export const VALID_CATEGORIES = [
  'banka',
  'kamu',
  'ags',
  'kpss',
  'ales',
  'dgs',
  'egitim',
  'diger',
];
