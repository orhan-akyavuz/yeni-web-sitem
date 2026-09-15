// backend/ingest/adapters/mock.js
// ----------------------------------------------------------------------
// Test adapter'ı: gerçek kaynağa bağlanmadan collector zincirini
// uçtan uca test etmek için örnek veri üretir. Tekrar kontrolünü ve
// hata izolasyonunu da denemek için duplicate + invalid kayıt içerir.
// ----------------------------------------------------------------------
export function createMockAdapter() {
  return {
    name: 'mock-banka',
    sourceType: 'manual',

    async fetch() {
      const now = new Date().toISOString();
      return [
        {
          sourceName: 'mock-banka',
          externalId: 'mock-001',
          title: 'VakıfBank Yeni Mütercim-Çevirmen Alım İlanı',
          summary: 'VakıfBank test amaçlı örnek duyurusudur.',
          officialUrl: 'https://www.vakifbank.com.tr/tr-TR/Duyurular',
          category: 'banka',
          publishedAt: now,
          fetchedAt: now,
        },
        {
          sourceName: 'mock-banka',
          externalId: 'mock-001', // bilerek aynı externalId -> dedup testi
          title: 'VakıfBank Yeni Mütercim-Çevirmen Alım İlanı (kopya)',
          summary: 'Bu kayıt eklenmemeli (dedup).',
          officialUrl: 'https://www.vakifbank.com.tr/tr-TR/Duyurular',
          category: 'banka',
          publishedAt: now,
          fetchedAt: now,
        },
        {
          sourceName: 'mock-banka',
          externalId: 'mock-002',
          title: 'x', // bilerek geçersiz -> validation testi
          summary: 'Bu kayıt doğrulamadan geçmemeli.',
          officialUrl: 'not-a-url',
          category: 'banka',
          publishedAt: now,
          fetchedAt: now,
        },
      ];
    },
  };
}
