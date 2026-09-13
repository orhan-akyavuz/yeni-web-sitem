# orhanakyavuz.com — Proje Klasör Yapısı (Sprint 4)

```
orhanakyavuz/
├── index.html                          → Ana sayfa
├── favicon.ico                         → Kök dizin favicon (tarayıcı sekmesi)
├── site.webmanifest                    → PWA/mobil ana ekran meta verisi
│
├── assets/
│   ├── css/
│   │   ├── base/
│   │   │   ├── reset.css               → Tarayıcı varsayılanlarını sıfırlar
│   │   │   ├── variables.css           → Sprint 2 renk/spacing/radius tokenleri (CSS custom properties)
│   │   │   └── typography.css          → Sprint 2 tipografi skalası
│   │   ├── components/
│   │   │   ├── navbar.css
│   │   │   ├── hero.css                → Hero iç öğe dizilimi (Sprint 5'te eklendi)
│   │   │   ├── buttons.css
│   │   │   ├── cards.css               → article-card, category-card, service-card, stat-card, featured-article-card
│   │   │   ├── forms.css               → input, textarea, newsletter formu
│   │   │   └── footer.css
│   │   ├── layout/
│   │   │   ├── grid.css                → 8-point grid, container genişlikleri
│   │   │   └── sections.css            → section spacing (Sprint 2, Bölüm 2)
│   │   ├── utilities.css               → visually-hidden, skip-link vb. (Sprint 5'te eklendi)
│   │   └── main.css                    → Tüm parçaları @import eden giriş dosyası
│   │
│   ├── js/
│   │   ├── modules/
│   │   │   ├── sticky-navbar.js        → IntersectionObserver tabanlı scroll durumu
│   │   │   ├── active-navigation.js    → Geçerli sayfayı navbar'da işaretler
│   │   │   ├── mobile-menu.js          → Hamburger aç/kapa, focus trap, backdrop
│   │   │   ├── search-overlay.js       → Dinamik tam ekran arama katmanı
│   │   │   ├── back-to-top.js          → Sayfa başına dön butonu (dinamik enjekte)
│   │   │   ├── scroll-progress-bar.js  → Sayfa geneli okuma ilerleme çubuğu
│   │   │   ├── reading-progress.js     → Makale gövdesine özel ilerleme (blog şablonlarında aktif)
│   │   │   ├── smooth-scroll.js        → Navbar offset düzeltmeli yumuşak kaydırma
│   │   │   ├── theme-toggle.js         → Light/Dark tema anahtarı (bkz. Sprint 6 notu — CSS tarafı eksik)
│   │   │   ├── lazy-loading.js         → Görsellerde fade-in geliştirmesi
│   │   │   ├── scroll-reveal.js        → Kart gruplarında stagger'lı görünüm animasyonu
│   │   │   ├── faq-accordion.js        → Jenerik SSS akordeonu (şu an sayfada no-op)
│   │   │   └── newsletter-validation.js → Abone Ol formu doğrulama + mock gönderim
│   │   └── main.js                     → Dinamik `import()` ile tüm modülleri yükleyen orkestratör
│   │
│   ├── images/
│   │   ├── articles/                   → Makale kapak görselleri
│   │   ├── hero/                       → (şu an kullanılmıyor — Hero saf tipografi)
│   │   ├── about/                      → Portre fotoğrafı
│   │   └── og/                         → Open Graph / sosyal paylaşım görseli
│   │
│   ├── icons/                          → Lucide Icons SVG dosyaları (Sprint 2, Bölüm 10)
│   │
│   └── fonts/                          → Google Fonts CDN üzerinden yüklendiği için
│                                          şu an boş; gelecekte self-host yedeği için ayrıldı
│
├── blog/
│   ├── index.html                      → Tüm yazıların listelendiği "Yazılar" sayfası
│   └── [makale-slug]/
│       └── index.html                  → Tekil makale sayfası (örn. matematik-sezgisi-nasil-gelisir/)
│
├── pages/
│   ├── hakkimda.html
│   ├── iletisim.html
│   ├── kategoriler/
│   │   └── index.html                  → Kategori keşif sayfası
│   ├── gizlilik.html
│   └── kullanim-sartlari.html
│
└── data/                                → (opsiyonel, ileri aşama) İçerik bir CMS/JSON
                                            kaynağından besleniyorsa ara veri katmanı
```

## Kararların Gerekçeleri

- **`assets/css` alt klasörlere bölündü (base/components/layout):** Tek bir dev CSS dosyası yerine, her komponentin (Sprint 2'deki buton, kart, input tanımları) kendi dosyasında yaşaması bakımı kolaylaştırır. `main.css` yalnızca `@import` yapan bir giriş noktasıdır.
- **`blog/[slug]/index.html` yapısı (klasör + index.html), `blog/slug.html` yerine tercih edildi:** URL'de `.html` uzantısı görünmez (`orhanakyavuz.com/blog/matematik-sezgisi-nasil-gelisir/`), bu daha temiz ve profesyonel bir URL yapısıdır — statik hosting (Netlify/Vercel/GitHub Pages) ile doğrudan uyumludur.
- **`pages/` klasörü, blog dışı statik sayfalar için ayrıldı:** Hakkımda, İletişim, Gizlilik gibi sayfalar "içerik" değil "yapı" sayfalarıdır; blog yazılarıyla karışmaması bilinçli bir ayrımdır.
- **`data/` klasörü şimdiden ayrıldı:** İleride içerik bir JSON/Markdown/CMS kaynağından geliyorsa, HTML üretim sürecinin ara katmanı burada yaşayacak — bugün boş olması sorun değil, mimari öngörüyü gösterir.

## Sprint 6 Notları (JavaScript)

- **`main.js` neden statik `import` değil, dinamik `import()` kullanıyor:** `index.html`'deki `<script src="/assets/js/main.js" defer></script>` etiketi `type="module"` değil (Sprint 4'te böyle yazıldı) ve bu sprint HTML'e dokunmayı yasakladığı için script tag'i değiştirilemedi. `import()` tarayıcıda script'in kendi tipinden bağımsız çalıştığından, her modül dosyası standart bir ES modülü olarak kalabildi.
- **Her modül "no-op güvenli":** İlgili DOM elementi sayfada yoksa modül sessizce çıkar (örn. `reading-progress.js` ve `faq-accordion.js` ana sayfada hiçbir şey yapmaz). Bu sayede `main.js` hangi sayfada çalıştığını bilmek zorunda kalmadan her şablonda güvenle kullanılabilir.
- **Açık kalan iki nokta (bilinçli, dürüstçe işaretlendi):**
  1. `theme-toggle.js` işlevsel olarak tamdır ama `base/variables.css` içinde `[data-theme="dark"]` için renk override'ları henüz yazılmadı — buton şu an görsel bir değişiklik yapmıyor.
  2. `mobile-menu.js`, Sprint 5 CSS'inde tanımlı olmayan bir backdrop katmanını geçici olarak satır içi (`element.style`) stille oluşturuyor; ileride `components/navbar.css`'e taşınmalı.

## Sprint 10 Notları (Icon System & Assets)

**Analiz sonucu:** `index.html` 13 farklı ikon dosyasına referans veriyordu, hiçbiri mevcut değildi (sitenin tek çalışan sayfası görsel olarak kırıktı). Bu sprintte tamamı çözüldü.

### İkon Kaynakları

| Kaynak | Lisans | Kullanım |
|---|---|---|
| **Lucide Icons** (`lucide-static` npm paketi) | ISC | 28 çizgi ikonun tamamı (navbar, arama, kategori, tema, ok, sayfalama, takvim, etiket, okuma süresi vb.) — Sprint 2 §10'da zaten seçilen kütüphane |
| **Simple Icons** | CC0 1.0 (Public Domain) | `github.svg` — resmi marka işareti |
| **Elle çizilmiş** | — | `linkedin.svg` (Simple Icons setinde bulunmuyor — sitenin monokrom çizgi diliyle tutarlı bir "in" monogramı olarak tasarlandı) ve `favicon.svg` (Lucide "pi" glyph'inden türetilmiş, Accent 500 zemin üzerinde marka işareti) |

### Uygulanan Kural (Sprint 2 §10)

Her ikon `1.5px` stroke kalınlığına normalize edildi (Lucide varsayılanı `2px`'tir) — kütüphane kaynaklı tüm dosyalarda bu düzeltme otomatik bir script ile uygulandı, elle yazılan `back-to-top.js` içindeki satır içi ok ikonu da aynı kurala göre güncellendi.

### Kod Tarafında Yapılan Değişiklikler

- `index.html`: `#menu-toggle-icon` id'si eklendi (hamburger/kapatma ikonunun JS ile değiştirilebilmesi için)
- `mobile-menu.js`: panel açılınca ikon `menu.svg` → `close.svg` olarak değişiyor (önceden yalnızca `aria-label` değişiyordu, glif sabit kalıyordu)
- `theme-toggle.js`: `☀`/`☾` metin karakterleri, gerçek `sun.svg`/`moon.svg` ikonlarıyla değiştirildi
- `favicon.ico` (çoklu boyut: 16/32/48) ve `assets/icons/apple-touch-icon.png` (180×180), `favicon.svg`'den üretildi
- `site.webmanifest` gerçek içerikle dolduruldu

### Üretilen Ama Henüz Sayfalarda Kullanılmayan İkonlar

`clock`, `calendar`, `tag`, `eye`, `copy`, `check`, `phone`, `message-circle`, `external-link`, `chevron-*` — Sprint 7/8'de tasarlanan blog kartı/makale sayfası bileşenleri için hazırlandı; o sayfalar kodlanana kadar kullanılmayacaklar ama dosyalar hazır ve isimlendirmesi o sprintlerdeki tasarımla birebir eşleşiyor.

## Sprint 13 Notları (Design Completion & Final Production Pass)

**Bu sprint, Sprint 11'de yarım kalan altyapı işini bitirdi ve projeyi eksiksiz hâle getirdi.**

### Dark Mode — Mimari Karar

`base/dark-mode.css` eklendi. Nötr gri skala (`gray-50…950`) `[data-theme='dark']` altında **tersine çevrildi** — bu, hem semantik tokenleri (`--color-background` vb.) hem de component dosyalarının doğrudan kullandığı ham `gray-*` değerlerini (hover zemini, kenarlık, kod bloğu zemini) tek seferde otomatik uyarladı.

Bunun güvenli olması için üç bileşen (Secondary buton, Skip Link, Newsletter bloğu) — her iki temada da bilinçli olarak koyu kalması gerekenler — yeni bir **tema-bağımsız `--color-ink-fixed` token ailesine** taşındı; aksi hâlde skala tersine çevrilince bu üçü de (yanlışlıkla) açık renge dönerdi.

`theme-toggle.js` (Sprint 6) artık tam görsel karşılığına kavuştu.

### Overlay / Backdrop / Glass Effect

`components/overlay.css` eklendi. Sprint 6/10'da `mobile-menu.js` ve `search-overlay.js` içinde **satır içi (`element.style`)** olarak geçici çözülen backdrop ve arama katmanı stilleri buradan gerçek sınıflara taşındı; JS dosyaları güncellenerek satır içi stil tamamen kaldırıldı.

`.glass` yardımcı sınıfı eklendi — ama Sprint 1'in "glassmorphism kullanmayacağız" ilkesiyle çelişmemesi için yalnızca **fonksiyonel overlay katmanlarında** (backdrop, sticky navbar scroll durumu) kullanılabilir; kart/buton gibi dekoratif yüzeylerde kullanılmaz.

### Yeni Sayfalar (Sprint 11'in bitmemiş kısmı)

- `blog/index.html` — filtre/sıralama/arama entegre Tüm Yazılar sayfası
- `pages/kategoriler/index.html` + 5 kategori detay sayfası
- `pages/etiketler/index.html` + 14 etiket detay sayfası
- Kalan 5 makale sayfası (yalnızca `matematik-sezgisi-nasil-gelisir` Sprint 12'de vardı)

**Toplam: 34 HTML sayfası, 0 kırık iç bağlantı** (site genelinde otomatik script ile doğrulandı).

### SEO Tamamlamaları

- `sitemap.xml` (33 URL, `lastmod`/`changefreq`/`priority` ile)
- `robots.txt` (`/blog/?q=` disallow, sitemap referansı — Sprint 9 §1.9 kararı)
- Her makale sayfasına `Article` + `BreadcrumbList` JSON-LD şeması eklendi (yalnızca ana sayfada `Person` şeması vardı)
- Arama modunda (`?q=` parametresi) `blog-listing.js` artık `<meta name="robots" content="noindex, follow">` etiketini çalışma zamanında enjekte ediyor — statik site olduğundan sunucu tarafı koşullu meta mümkün değil, bu JS tabanlı çözüm Googlebot'un JS render ettiği gerçeğine dayanır

### Bilinçli Basitleştirme

Sprint 7'nin tasarladığı mobil "bottom-sheet" filtre paneli, bu sprintte tam bir ayrı interaktif yüzey (kendi focus trap'i, ARIA yönetimi) olarak uygulanmadı — bunun yerine filtre `<select>`'leri mobilde de doğrudan görünür bırakıldı. Sitenin yalnızca 6 yazısı olduğu bir ölçekte bu, eşit derecede erişilebilir ve çok daha az karmaşık bir çözümdür; gerekirse ileride eklenebilir.

### Kalan (Bilinçli Olarak Kapsam Dışı) Alanlar

- Gerçek görseller (`assets/images/*`) hâlâ yer tutucu — CMS/backend olmadığı için gerçek fotoğraf/ekran görüntüsü üretilemedi
- Yorum sistemi entegrasyonu (Sprint 8'de yer tutucu olarak tasarlandı)
- Gerçek arama backend'i/index'i (mevcut çözüm DOM tabanlı client-side filtreleme)
- CSS/JS build/minify adımı (Sprint 9'da strateji olarak belgelendi, gerçek bundler kurulumu bu projenin "framework/backend yok" ilkesiyle kasıtlı olarak dışarıda bırakıldı)

## Sprint 14 Notları (Master Build & Final Consistency Audit)

Bu sprint kod ÜRETMEDİ — yalnızca Sprint 1-13'te üretilmiş her şeyi birbirine karşı denetledi ve tutarsızlıkları giderdi. Bulunan ve düzeltilen gerçek sorunlar:

| # | Sorun | Çözüm |
|---|---|---|
| 1 | `index.html`'de `.about-summary__eyebrow`, `.contact__eyebrow`, `.contact__title` sınıfları kullanılıyor ama hiç CSS'i yoktu | `layout/sections.css`'e eklendi |
| 2 | `faq-accordion.js`'in beklediği `.accordion__trigger`/`.accordion__panel` taban sınıflarının kendi başlarına (content-box olmadan) hiç görsel karşılığı yoktu | `components/article-content.css`'e jenerik taban stil eklendi |
| 3 | `pages/iletisim.html`'deki `.contact-form` sınıfı CSS'te tanımsızdı, boyutlandırma satır içi stille yapılıyordu | `components/forms.css`'e taşındı |
| 4 | 30 sayfada toplam 60+ satır içi (`style="..."`) stil vardı — bazıları component'in kendi CSS'iyle **birebir duplicate** (örn. `.legal-page`'in `max-width`'i hem CSS'te hem satır içinde tanımlıydı) | Tamamı kaldırıldı; yeni spacing/utility sınıfları (`.mt-*`, `.mb-*`, `.section-intro`, `.empty-state`, `.author-portrait`, `.w-full`, `.my-8`, `.py-16`, `.text-right`) eklenerek yerine gerçek class'lar kullanıldı |
| 5 | `assets/js/data/posts.js` (Sprint 11) hiçbir yerden import edilmiyordu — `blog-listing.js` bunun yerine DOM `data-*` attribute'larını kullanan farklı bir mimariyle yazılmıştı | Kullanılmayan dosya silindi (orphaned/duplicate veri kaynağı) |

### Doğrulama Sonuçları (otomatik script ile)

- Kırık iç link: **0** (67 benzersiz referans tarandı)
- HTML'de kullanılıp CSS'te tanımsız class: **0** (202 benzersiz class kontrol edildi)
- Tanımsız CSS custom property (`var(--...)`) kullanımı: **0** (72 kullanım, 88 tanımlı token)
- CSS brace dengesizliği: **0** (21 dosya)
- JS syntax hatası: **0** (19 dosya, `node --check` ile)
- `main.js`'te kayıtlı olmayan/kaydı olup dosyası olmayan modül: **0**
- Sayfa başına birden fazla/sıfır `<h1>`: **0 sayfa**
- `lang="tr"` veya `rel="canonical"` eksik sayfa: **0 sayfa**
- Kalan satır içi stil: **0**
- `node_modules` kalıntısı: yok (yalnızca ikon kaynağı için Sprint 10'da geçici kullanılmıştı)

**Sonuç: 34 HTML, 21 CSS, 19 JS, 31 SVG — hepsi birbiriyle tutarlı, hiçbir broken import/asset/class kalmadı.**

## Sprint 15 Notları (Profesyonel Tamamlama — Görseller ve Yerel Önizleme)

Kullanıcı "bu gerçekten çalışan bir site mi?" diye sorduğunda iki gerçek eksik ortaya çıktı; ikisi de bu turda kapatıldı.

### 1) Görseller

`assets/images/` altında 8 görsel artık gerçek dosya (önceden yalnızca boş klasörlerdi):

- `about/portre.jpg` — gerçek bir fotoğraf yerine **bilinçli bir monogram avatarı** ("OA", Graphite zemin, Accent çizgi). Var olmayan bir yüzü uydurmak yerine dürüst bir yer tutucu tercih edildi.
- `articles/placeholder-01.jpg` … `placeholder-05.jpg`, `placeholder-featured.jpg` — Design System'in birebir renk paletiyle (Graphite/Accent/Paper White) üretilmiş, her biri farklı soyut geometrik kompozisyon. Sprint 1'in "stok fotoğraf kullanmayacağız" ilkesiyle zaten örtüşüyor — bu yüzden soyut/geometrik seçildi, sahte bir fotoğraf değil.
- `og/og-cover.jpg` — sosyal paylaşım kartı, saf tipografi (Hero'nun kendisi gibi).

Tamamı Python/Pillow ile, marka renklerinin tam HEX değerleri kullanılarak üretildi; gerçek fotoğraflarla değiştirilene kadar sitenin hiçbir yerinde kırık görsel ikonu görünmeyecek.

### 2) Yerel Önizleme — Mutlak Yol Sorunu

Sitedeki tüm yollar (`/assets/...`, `/blog/...`) kök dizinden başlayan mutlak yollardır — bu, gerçek bir barındırma ortamı (Netlify/Vercel/GitHub Pages) için doğru ve standart yaklaşımdır, ama bir HTML dosyasına çift tıklayıp `file://` ile açmayı **kırar**.

Bunu "düzeltmek" için yollara dokunmak (göreceli yollara çevirmek) production kalitesini düşürürdü — bunun yerine **`start-server.sh`** (Mac/Linux) ve **`start-server.bat`** (Windows) eklendi: çalıştırıldığında projeyi geçici bir sunucu olarak başlatıp tarayıcıyı otomatik açar. `python3 -m http.server` ile gerçek sunucu testi yapıldı — tüm CSS/JS/görsel/sayfa istekleri **200 OK** döndü.

## Sprint 16 Notları (Gerçek Backend + İçerik Genişletmesi)

### Backend — Express + node:sqlite

`backend/` klasörü, harici native bağımlılık gerektirmeyen gerçek bir API sunucusu içerir — Node.js 22'nin yerleşik `node:sqlite` modülü kullanıldığı için `better-sqlite3` gibi derleme gerektiren paketlere ihtiyaç yok.

- **Uç noktalar:** `GET /api/articles` (kategori/etiket/sıralama/sayfalama parametreli), `GET /api/articles/:slug` (önceki/sonraki/benzer yazılar dahil, görüntülenme sayacı artırır), `GET /api/categories`, `GET /api/tags`, `GET /api/search`, `POST /api/contact`, `POST /api/newsletter`
- **Veri katmanı:** `categories`, `tags`, `articles`, `article_tags`, `contact_messages`, `newsletter_subscribers` tabloları (`backend/db/schema.sql`)
- **Validasyon:** elle yazılmış (bağımlılıksız) e-posta/uzunluk kontrolleri + IP başına dakikada 5 istekle sınırlı rate limiting
- **Yanıt zarfı:** tüm endpoint'ler `{ success, data }` / `{ success: false, error: { code, message } }` biçiminde tutarlı JSON döner
- Tüm endpoint'ler gerçek `curl` istekleriyle tek tek test edildi (README'de örnekleri var)

### Frontend → Backend Bağlantısı

- `contact-form.js`, `newsletter-validation.js`: artık `mockSend()`/`mockSubscribe()` SİLİNDİ, gerçek `fetch()` ile `POST /api/contact` ve `POST /api/newsletter`'a bağlanıyor
- `blog-listing.js`: arama modu artık `GET /api/search`'e bağlanıp 10 makalenin tamamında arama yapıyor (önceden yalnızca sayfadaki 6 statik karta bakıyordu); API'ye ulaşılamazsa (backend kapalıysa) otomatik olarak DOM tabanlı filtrelemeye düşüyor
- Yeni `api-config.js`: `localhost`'ta çalışırken API'yi otomatik `http://localhost:4000`'de bulur

### İçerik Genişletmesi

| | Önce | Şimdi |
|---|---|---|
| Makale | 6 | 10 |
| Kategori | 5 | 8 (+ Eğitim, Teknoloji, Akademik Yazılar) |
| Etiket | 14 | 24 |
| Toplam HTML sayfası | 34 | 51 |

### Doğrulama

Genişletme sonrası tüm kontroller sıfırdan tekrar çalıştırıldı: 51 sayfa, 88 iç referans, 0 kırık link, 0 tanımsız CSS class, 0 JS syntax hatası (frontend + backend), 0 eksik görsel, 0 satır içi stil. Statik site (port 8000) ve API (port 4000) aynı anda ayağa kaldırılıp gerçek curl istekleriyle uçtan uca test edildi.

### Dürüstçe Kalan Sınır

E-posta bildirimi (SMTP/Mailgun vb.) gerçek bir üçüncü taraf hesabı ve API anahtarı gerektirdiğinden eklenmedi — ama form gönderimleri gerçekten veritabanına yazılıyor (contact_messages, newsletter_subscribers tabloları), yalnızca e-posta bildirimi eksik. backend/README.md'de bunun nasıl ekleneceği belirtildi.

## Sprint 18 Notları (Kalan 3 Eksik Kapatıldı)

Kullanıcı Sprint 16'dan sonra kalan bilinen 3 eksiğin profesyonel şekilde tamamlanmasını istedi.

### 1) Gerçek E-posta Gönderimi

`backend/services/mailer.js` — nodemailer ile herhangi bir SMTP sağlayıcısına bağlanır. `.env` dosyasına gerçek kimlik bilgileri girildiği an, iletişim formu site sahibine bildirim e-postası, bülten aboneliği de hoş geldin e-postası GERÇEKTEN gönderir. `.env` yoksa (bu teslimatta olduğu gibi), servis bunu açıkça loglar ve sessizce atlar — form gönderimi yine de veritabanına yazılmaya devam eder, kullanıcı hiçbir zaman hata görmez. `backend/.env.example` kopyalanıp doldurulacak şekilde hazır.

### 2) Mobil Bottom-Sheet Filtre Paneli

Sprint 7'de tasarlanan, Sprint 13'te "her zaman görünür select" olarak basitleştirilen mobil filtre paneli artık tam özellik: `mobile-filter-sheet.js`, ekran mobil genişliğe düştüğünde gerçek filtre `<select>` elementlerini (kopyalamadan, DOM düğümlerini taşıyarak — tek kaynak doğruluk korunur) bir bottom-sheet'e taşıyor; focus trap, ESC/backdrop ile kapama, masaüstüne dönüldüğünde otomatik geri taşıma dahil.

### 3) Production Build Pipeline (CSS/JS Minify)

Kök dizinde `npm run build` — esbuild ile gerçek bir üretim derlemesi:

- `assets/css/main.css`'teki `@import` zinciri TEK, minify edilmiş, içerik-hash'li dosyada birleştiriliyor (`dist/assets/css/main.<hash>.min.css`)
- `assets/js/main.js` ve her modül dosyası ayrı ayrı minify ediliyor (main.js'in çalışma zamanı `import(path)` — değişken tabanlı dinamik import — kullanması nedeniyle esbuild bunları TEK dosyada birleştiremiyor; bu, Sprint 6'nın bilinçli mimari tercihinin doğal bir sonucu, build script'inde bu kısıt açıkça belgelendi)
- Tüm 51 HTML sayfası `dist/`'e kopyalanıyor, CSS/JS referansları hash'li dosyalara otomatik yeniden yazılıyor (cache-busting)
- İkonlar, görseller, favicon, sitemap, robots.txt olduğu gibi kopyalanıyor
- `dist/` çıktısı ayrı bir sunucuda (port 8099) test edildi — tüm kaynaklar 200 döndü

### Doğrulama

Üç özellik eklendikten sonra tüm otomatik kontroller sıfırdan tekrar çalıştırıldı: 0 kırık link, 0 tanımsız CSS class, 0 JS syntax hatası (frontend + backend + build script), 0 satır içi stil. Backend, SMTP yapılandırılmadan da (mailerConfigured: false) hatasız çalışmaya devam ediyor — gerçek `curl` testiyle doğrulandı.
