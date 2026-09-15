# orhanakyavuz — Backend API

Express + `node:sqlite` (Node.js'in yerleşik SQLite modülü) ile yazılmış gerçek bir API sunucusu. Harici veritabanı motoru veya native derleme gerektiren bir paket (better-sqlite3 vb.) kullanmaz — yalnızca Node.js 22.5+ ve `express` yeterlidir.

## Kurulum ve Çalıştırma

```bash
cd backend
npm install
npm run seed    # veritabanını sıfırlar ve 8 kategori / 24 etiket / 10 makaleyle doldurur
npm start        # http://localhost:4000 üzerinde API'yi başlatır
```

`npm run seed` her çalıştırıldığında `db/orhanakyavuz.sqlite` dosyasını siler ve yeniden oluşturur — geliştirme sırasında veriyi sıfırlamak için güvenle tekrar çalıştırılabilir.

## Uç Noktalar

| Yöntem | Yol | Açıklama |
|---|---|---|
| GET | `/api/health` | Sunucu durumu kontrolü |
| GET | `/api/articles` | Makale listesi — `?category=`, `?tag=`, `?sort=newest\|oldest\|alphabetical`, `?page=`, `?limit=` |
| GET | `/api/articles/:slug` | Tekil makale — gövde, önceki/sonraki, benzer yazılar dahil |
| GET | `/api/categories` | Tüm kategoriler ve yazı sayıları |
| GET | `/api/categories/:slug` | Tekil kategori |
| GET | `/api/tags` | Tüm etiketler ve yazı sayıları |
| GET | `/api/search?q=...` | Başlık/özet/gövde üzerinde arama |
| POST | `/api/contact` | İletişim formu — `{ name, email, message }` |
| POST | `/api/newsletter` | Bülten aboneliği — `{ email }` |
| GET | `/api/current-info` | Yayındaki güncel bilgi kayıtları |
| POST | `/api/admin/current-info/ingest` | Aktif, resmî RSS kaynaklarını toplar (admin) |

Tüm yanıtlar aynı zarfı kullanır:

```json
{ "success": true, "data": { ... } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

## Frontend Bağlantısı

`assets/js/modules/api-config.js`, `localhost`/`127.0.0.1` üzerinde çalışırken otomatik olarak `http://localhost:4000`'e bağlanır. Bu yüzden siteyi (`start-server.sh`) ve backend'i (`npm start`) AYNI ANDA, iki ayrı terminalde çalıştırmanız gerekir:

```bash
# Terminal 1 — statik site (port 8000)
./start-server.sh

# Terminal 2 — API (port 4000)
cd backend && npm start
```

Backend çalışmıyorsa iletişim/bülten formları kullanıcıya net bir hata mesajı gösterir; arama ve kategori/sıralama filtreleri ise otomatik olarak sayfadaki statik içerik üzerinde çalışmaya devam eder (bkz. `blog-listing.js` — API'ye ulaşılamazsa DOM tabanlı filtrelemeye döner).

## E-posta Bildirimi Hakkında Not

`POST /api/contact` ve `POST /api/newsletter`, gönderileri **gerçekten** `contact_messages` ve `newsletter_subscribers` tablolarına yazar — bunlar `backend/db/orhanakyavuz.sqlite` dosyasından herhangi bir SQLite istemcisiyle (ör. `sqlite3` komut satırı veya DB Browser for SQLite) okunabilir. Gerçek zamanlı e-posta bildirimi göndermek, bir SMTP/Mailgun/Resend hesabı ve API anahtarı gerektirir; bu proje ortamında böyle bir üçüncü taraf kimlik bilgisi bulunmadığından bu adım eklenmedi. Böyle bir anahtar edinildiğinde, `backend/routes/contact.js` içindeki `INSERT` satırından hemen sonra tek bir fonksiyon çağrısı eklemek yeterlidir.

## Veri Katmanı Şeması

`db/schema.sql` dosyasında tanımlıdır: `categories`, `tags`, `articles`, `article_tags` (çoktan-çoğa), `contact_messages`, `newsletter_subscribers`.
