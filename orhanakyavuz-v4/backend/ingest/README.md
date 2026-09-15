# Güncel Bilgiler veri toplama

Bu altyapı sadece backend'de çalışır. Frontend veya kullanıcı girdisi ile URL
çekmez; yalnızca `content_sources` içindeki aktif, admin tanımlı kaynakları
işler.

## Klasörler

- `adapters/`: Her sağlayıcı için küçük RSS, API veya HTML adapter'ları.
- `types.js`: Ortak kayıt sözleşmesi.
- `normalizer.js`: Ortak formata dönüştürme, URL/kategori doğrulama ve dedup hash.
- `fetchWithTimeout.js`: DNS tabanlı SSRF kontrolü, timeout, retry ve host bazlı hız sınırı.
- `registry.js`: Aktif kaynak kaydını uygun adapter'a bağlar.
- `collector.js`: Kaynak bazlı hata izolasyonu, saklama ve arşivleme.
- `store.js`: Mevcut Supabase veya yerel SQLite veri katmanı.

## Kaynak tanımlama

İlk sürüm yalnızca `source_type = 'rss'` ve dolu `feed_url` alanına sahip
aktif kaynakları çalıştırır. Yeni kaynak eklemek için resmî, kullanım şartları
uygun feed URL'sini yönetimden/veritabanından tanımlayın. API veya HTML desteği
gerektiğinde `adapters/` altında adapter ekleyip `registry.js`e tek eşleme
eklemek yeterlidir.

Her adapter şu alanları döndürür: `sourceName`, `externalId`, `title`,
`summary`, `officialUrl`, `category`, `publishedAt`, `fetchedAt`.

## Çalıştırma ve test

Yönetici oturumuyla `POST /api/admin/current-info/ingest` çağrısı aktif RSS
kaynaklarını toplar. Yeni kayıtlar `draft` olarak saklanır; aynı `externalId`
veya başlık+URL yeniden eklenmez, yalnızca son görülme zamanı güncellenir.

Otomatik çalışma varsayılan olarak kapalıdır. Backend ortamında örneğin
`INGEST_INTERVAL_MINUTES=60` tanımlanırsa güvenli tek-çalışan zamanlayıcı
etkinleşir; bir önceki çalışma bitmeden yenisi başlamaz.

Kayıtlar hiç silinmez. Başarılı çekimden sonra `INGEST_ARCHIVE_AFTER_DAYS`
(varsayılan 90) süredir tekrar görülmeyenler `archived` yapılır.

Gerçek kaynağa bağlanmadan sözleşmeyi test etmek için:

```bash
cd backend
npm run test:ingest
```

Bu test RSS ayrıştırma, doğrulama ve tekrar hash davranışını ağ veya Supabase
kimlik bilgisi olmadan denetler.
