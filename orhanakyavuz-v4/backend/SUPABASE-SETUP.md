# Supabase kurulumu

## 1. Proje oluştur

Supabase Dashboard'da yeni bir proje oluştur. Authentication > Providers bölümünde Email provider'ı açık bırak.

## 2. Veritabanı şemasını çalıştır

SQL Editor'u açıp `db/supabase-schema.sql` dosyasının tamamını çalıştır.

Dosya güncellendiğinde yeni RPC fonksiyonlarının da eklenmesi için dosyanın son halini tekrar çalıştır. Özellikle `submit_weekly_problem` ve `get_weekly_leaderboard` fonksiyonları cevap kontrolü ve public sıralama için zorunludur.

Bu migration şu tabloları oluşturur:

- `profiles`
- `weekly_problems`
- `submissions`
- `score_events`
- `streaks`
- `badges`
- `user_badges`
- `problem_highlights`

RLS etkin olduğu için public ve kullanıcıya özel erişim kuralları migration içinde tanımlıdır.

## 3. Backend env ayarları

`backend/.env.example` dosyasını `backend/.env` olarak kopyala ve değerleri doldur:

```env
AUTH_PROVIDER=supabase
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
```

`SUPABASE_ANON_KEY` yalnızca backend env dosyasında kullanılmalıdır. `.env` dosyasını frontend klasörüne koyma ve git'e ekleme.

## 4. Backend'i başlat

```powershell
cd backend
npm install
npm start
```

## 5. Kontrol

- `POST /api/auth/signup`: hesap oluşturur
- `POST /api/auth/signin`: HttpOnly cookie oluşturur
- `GET /api/auth/me`: aktif kullanıcıyı döndürür
- `POST /api/auth/signout`: cookie'yi temizler

## Geçiş notu

Şu an Supabase Auth kimlik doğrulaması, mevcut uygulama verileriyle SQLite kullanıcı eşlemesi üzerinden çalışır. Problem, gönderim ve puan sorgularının tamamen PostgreSQL'e taşınması ayrı bir migration adımıdır. Bu adım, Supabase şeması gerçek projede uygulandıktan sonra yapılmalıdır.

Güncel durumda aktif problem, arşiv, cevap doğrulama/puanlandırma, seri/rozet yazma ve public leaderboard PostgreSQL yolunu kullanır. Admin yönetim route'ları henüz SQLite tabanlıdır ve sonraki migration adımıdır.

Admin route'larını da PostgreSQL'e geçirmek için `db/supabase-admin-functions.sql` dosyasını ayrıca çalıştır. Bu incremental dosya tablo veya policy oluşturmaz; mevcut policy çakışmalarını tetiklemez.
