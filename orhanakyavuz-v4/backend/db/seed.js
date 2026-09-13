// backend/db/seed.js
// ----------------------------------------------------------------------
// Veritabanını (varsa) sıfırlar ve gerçek içerikle yeniden doldurur.
// `node --experimental-sqlite db/seed.js` ile çalıştırılır (npm run seed).
// ----------------------------------------------------------------------
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { seedBadges } from '../services/gamification.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'orhanakyavuz.sqlite');

if (existsSync(DB_PATH)) unlinkSync(DB_PATH);

const db = new DatabaseSync(DB_PATH);
db.exec(readFileSync(join(__dirname, 'schema.sql'), 'utf8'));
seedBadges(db);

// ------------------------------------------------------------------------
// KATEGORİLER (8)
// ------------------------------------------------------------------------
const categories = [
  { slug: 'matematik', name: 'Matematik', description: 'Kalkülüs, ispat teknikleri ve matematiksel düşünme üzerine yazılar.' },
  { slug: 'veri-analizi', name: 'Veri Analizi', description: 'Python, pandas ve gerçek veriyle çalışmanın pratik yönleri.' },
  { slug: 'python-sql', name: 'Python & SQL', description: 'Veritabanı sorgularından script\u2019lere, günlük kullanılan araçlar.' },
  { slug: 'yapay-zeka', name: 'Yapay Zekâ', description: 'Yapay zekânın eğitimden günlük hayata uzanan uygulamaları.' },
  { slug: 'kariyer', name: 'Kariyer', description: 'Kariyer planlaması ve kişisel gelişim üzerine notlar.' },
  { slug: 'egitim', name: 'Eğitim', description: 'Öğrenme bilimi, öğretim yöntemleri ve eğitimde verimlilik.' },
  { slug: 'teknoloji', name: 'Teknoloji', description: 'Programlama, yazılım ve teknolojiye matematikçi bakış açısı.' },
  { slug: 'akademik-yazilar', name: 'Akademik Yazılar', description: 'Akademik yazım, araştırma ve LaTeX üzerine rehberler.' },
];

const insertCategory = db.prepare('INSERT INTO categories (slug, name, description) VALUES (?, ?, ?)');
const categoryIds = {};
for (const c of categories) {
  const result = insertCategory.run(c.slug, c.name, c.description);
  categoryIds[c.slug] = Number(result.lastInsertRowid);
}

// ------------------------------------------------------------------------
// ETİKETLER (24)
// ------------------------------------------------------------------------
const tagNames = {
  matematik: 'Matematik', akademik: 'Akademik', 'problem-cozme': 'Problem Çözme',
  python: 'Python', pandas: 'Pandas', 'veri-temizleme': 'Veri Temizleme',
  sql: 'SQL', performans: 'Performans', 'yapay-zeka': 'Yapay Zekâ', egitim: 'Eğitim',
  ispat: 'İspat', kalkulus: 'Kalkülüs', kariyer: 'Kariyer', veri: 'Veri',
  latex: 'LaTeX', 'akademik-yazim': 'Akademik Yazım', arastirma: 'Araştırma',
  ogrenme: 'Öğrenme', hafiza: 'Hafıza', javascript: 'JavaScript',
  programlama: 'Programlama', teknoloji: 'Teknoloji',
  'fonksiyonel-programlama': 'Fonksiyonel Programlama', 'lambda-hesabi': 'Lambda Hesabı',
};
const insertTag = db.prepare('INSERT INTO tags (slug, name) VALUES (?, ?)');
const tagIds = {};
for (const [slug, name] of Object.entries(tagNames)) {
  const result = insertTag.run(slug, name);
  tagIds[slug] = Number(result.lastInsertRowid);
}

// ------------------------------------------------------------------------
// MAKALELER (10)
// ------------------------------------------------------------------------
const articles = [
  {
    slug: 'matematik-sezgisi-nasil-gelisir',
    title: 'Ortalama Değer Teoremi ve Matematiksel Sezgi',
    subtitle: 'Bir teoremi ezberlemekle onu gerçekten anlamak arasındaki fark, çoğu zaman sezginin nasıl inşa edildiğinde saklıdır.',
    excerpt: 'Bir teoremi ezberlemekle onu gerçekten anlamak arasındaki fark, sezgide saklıdır.',
    category: 'matematik', tags: ['matematik', 'ispat', 'kalkulus'],
    published_at: '2026-07-15', updated_at: null, read_minutes: 9, view_count: 487,
    cover_image: '/assets/images/articles/placeholder-01.jpg',
    body_html: `<h2 id="giris">Giriş</h2><p>Ortalama Değer Teoremi, kalkülüsün en sezgisel teoremlerinden biridir: bir yolculukta ortalama hızınız neyse, yolun bir noktasında tam olarak o hızda gitmiş olmalısınızdır.</p><h2 id="teorem">Teorem</h2><p>$f$, $[a,b]$'de sürekli ve $(a,b)$'de türevlenebilir ise, öyle bir $c$ vardır ki $f'(c) = \\frac{f(b)-f(a)}{b-a}$.</p>`,
  },
  {
    slug: 'python-ile-veri-temizleme',
    title: 'Python ile Veri Temizleme: Pratik Bir Rehber',
    subtitle: 'Gerçek dünya verisi nadiren temizdir. pandas ile eksik değerleri, aykırı gözlemleri ve tutarsız biçimleri ele almanın pratik yolları.',
    excerpt: 'Gerçek dünya verisi nadiren temizdir. pandas ile eksik değerleri ele almak.',
    category: 'veri-analizi', tags: ['python', 'pandas', 'veri-temizleme'],
    published_at: '2026-07-28', updated_at: null, read_minutes: 7, view_count: 342,
    cover_image: '/assets/images/articles/placeholder-02.jpg',
    body_html: `<h2 id="giris">Giriş</h2><p>Bir veri analizi projesinin zamanının büyük bölümü, verinin kullanılabilir hâle getirilmesine gider.</p><h2 id="eksik-degerler">Eksik Değerler</h2><p>Eksik değerleri doğrudan silmek her zaman doğru değildir — önce ne kadarını kaybettiğinizi ölçmelisiniz.</p>`,
  },
  {
    slug: 'sql-performans-ipuclari',
    title: 'SQL Sorgularında Performans İpuçları',
    subtitle: 'Doğru index, doğru JOIN sırası ve doğru EXPLAIN okuma alışkanlığı — büyük veri kümelerinde saniyeler kazandırır.',
    excerpt: 'Doğru index, doğru JOIN sırası ve doğru EXPLAIN okuma alışkanlığı.',
    category: 'python-sql', tags: ['sql', 'performans'],
    published_at: '2026-07-10', updated_at: '2026-07-22', read_minutes: 6, view_count: 615,
    cover_image: '/assets/images/articles/placeholder-04.jpg',
    body_html: `<h2 id="giris">Giriş</h2><p>Yavaş bir SQL sorgusunun çoğu zaman tek bir nedeni vardır: veritabanı motoru gereğinden fazla satır tarıyordur.</p><h2 id="index">Index</h2><p><code>WHERE</code> ve <code>JOIN</code> koşullarında sık kullanılan sütunlara index eklemek en yüksek etkiyi yaratır.</p>`,
  },
  {
    slug: 'yapay-zeka-egitimde-kullanimi',
    title: 'Yapay Zekâ Eğitimde Nasıl Kullanılabilir?',
    subtitle: 'Kişiselleştirilmiş öğrenme yollarından otomatik geri bildirime, YZ araçlarının sınıfa gerçekçi katkıları üzerine.',
    excerpt: 'Kişiselleştirilmiş öğrenme yollarından otomatik geri bildirime.',
    category: 'yapay-zeka', tags: ['yapay-zeka', 'egitim'],
    published_at: '2026-07-20', updated_at: null, read_minutes: 8, view_count: 429,
    cover_image: '/assets/images/articles/placeholder-03.jpg',
    body_html: `<h2 id="giris">Giriş</h2><p>YZ'nin eğitime katkısı üzerine çok abartılı iddia duyuyoruz. Bu yazı üç gerçekçi alana odaklanıyor: kişiselleştirme, geri bildirim, içerik üretimi.</p>`,
  },
  {
    slug: 'matematiksel-dusunme-rehberi',
    title: 'Matematiksel Düşünme: Bir Rehber',
    subtitle: 'Problem çözme yalnızca formül bilmek değildir — doğru soruları sormayı öğrenmektir. Bu rehber o alışkanlığı inşa etmeye odaklanıyor.',
    excerpt: 'Problem çözme yalnızca formül bilmek değildir.',
    category: 'matematik', tags: ['matematik', 'akademik', 'problem-cozme'],
    published_at: '2026-07-15', updated_at: null, read_minutes: 11, view_count: 738,
    cover_image: '/assets/images/articles/placeholder-featured.jpg',
    body_html: `<h2 id="giris">Giriş</h2><p>Pólya'nın "Nasıl Çözülür?" kitabı problem çözmeyi dört adıma ayırır: anlama, planlama, uygulama, geriye dönüp bakma.</p>`,
  },
  {
    slug: 'kariyer-planlamasinda-veri',
    title: 'Kariyer Planlamasında Veri Kullanmak',
    subtitle: 'Sezgiyle karar vermek yerine, kendi kariyer verinizi (beceri, zaman, fırsat) nasıl sistematik biçimde değerlendirebilirsiniz?',
    excerpt: 'Sezgiyle karar vermek yerine, kendi kariyer verinizi sistematik değerlendirmek.',
    category: 'kariyer', tags: ['kariyer', 'veri'],
    published_at: '2026-07-05', updated_at: null, read_minutes: 5, view_count: 276,
    cover_image: '/assets/images/articles/placeholder-05.jpg',
    body_html: `<h2 id="giris">Giriş</h2><p>Kariyer kararlarını genellikle anlık motivasyonla veririz. Oysa aynı sistematik yaklaşımı kendi kariyerimize de uygulayabiliriz.</p>`,
  },
  {
    slug: 'latex-ile-akademik-makale-yazimi',
    title: 'LaTeX ile Akademik Makale Yazımı',
    subtitle: 'Word ile saatler süren formül/kaynakça derdi, LaTeX ile dakikalar içinde çözülür. Yeni başlayanlar için pratik bir giriş.',
    excerpt: 'Word ile saatler süren formül/kaynakça derdi, LaTeX ile dakikalar içinde çözülür.',
    category: 'akademik-yazilar', tags: ['latex', 'akademik-yazim', 'arastirma'],
    published_at: '2026-08-01', updated_at: null, read_minutes: 8, view_count: 318,
    cover_image: '/assets/images/articles/placeholder-06.jpg',
    body_html: `<h2 id="giris">Giriş</h2><p>Matematik ağırlıklı bir tezde ya da makalede LaTeX, formül dizimini otomatikleştirerek yazarın içeriğe odaklanmasını sağlar.</p><h2 id="temel-yapi">Temel Yapı</h2><p>Bir LaTeX belgesi <code>\\documentclass</code>, <code>\\usepackage</code> ve <code>\\begin{document}</code> bloklarından oluşur.</p><h2 id="kaynakca-yonetimi">Kaynakça Yönetimi</h2><p>BibTeX/BibLaTeX, onlarca kaynağı elle biçimlendirme derdinden kurtarır.</p>`,
  },
  {
    slug: 'aralikli-tekrar-nedir',
    title: 'Öğrenme Bilimi: Aralıklı Tekrar Nedir?',
    subtitle: 'Bir konuyu bir gecede "ezberlemek" ile haftalar sonra hâlâ hatırlamak arasındaki fark, tekrarların ne zaman yapıldığında saklı.',
    excerpt: 'Bir konuyu ezberlemekle haftalar sonra hâlâ hatırlamak arasındaki fark tekrar zamanlamasında saklı.',
    category: 'egitim', tags: ['ogrenme', 'hafiza', 'egitim'],
    published_at: '2026-08-03', updated_at: null, read_minutes: 6, view_count: 552,
    cover_image: '/assets/images/articles/placeholder-07.jpg',
    body_html: `<h2 id="giris">Giriş</h2><p>Hermann Ebbinghaus'un 19. yüzyıl sonunda ortaya koyduğu "unutma eğrisi", bilgiyi tekrar etmezsek onu ne kadar hızlı kaybettiğimizi gösterir.</p><h2 id="araliklarin-mantigi">Aralıkların Mantığı</h2><p>Bir konuyu öğrendikten 1 gün, 3 gün, 7 gün ve 21 gün sonra kısaca tekrar etmek, tek seferde uzun çalışmaktan çok daha kalıcıdır.</p>`,
  },
  {
    slug: 'javascripte-matematikci-gozunden-bakis',
    title: "JavaScript'e Matematikçi Gözünden Bakış",
    subtitle: 'Matematik geçmişi olan biri için JavaScript öğrenmek, beklenenden daha tanıdık kavramlarla dolu.',
    excerpt: 'Matematik geçmişi olan biri için JavaScript öğrenmek beklenenden daha tanıdık kavramlarla dolu.',
    category: 'teknoloji', tags: ['javascript', 'programlama', 'teknoloji'],
    published_at: '2026-08-05', updated_at: null, read_minutes: 7, view_count: 264,
    cover_image: '/assets/images/articles/placeholder-08.jpg',
    body_html: `<h2 id="giris">Giriş</h2><p>Fonksiyonlar, kümeler ve dönüşümler — matematikte tanıdık olan bu kavramlar, JavaScript'te de karşımıza çıkar.</p><h2 id="fonksiyonlar">Fonksiyonlar Vatandaştır</h2><p>JavaScript'te fonksiyonlar birinci sınıf değerlerdir; tıpkı matematikte bir fonksiyonu başka bir fonksiyona girdi olarak verebilmemiz gibi.</p>`,
  },
  {
    slug: 'fonksiyonel-programlamanin-matematiksel-kokenleri',
    title: 'Fonksiyonel Programlamanın Matematiksel Kökenleri',
    subtitle: 'map, filter, reduce gibi kavramlar aslında 1930\u2019larda Alonzo Church\u2019ün lambda hesabına kadar uzanır.',
    excerpt: 'map, filter, reduce gibi kavramlar aslında 1930\u2019larda lambda hesabına kadar uzanır.',
    category: 'teknoloji', tags: ['fonksiyonel-programlama', 'matematik', 'lambda-hesabi'],
    published_at: '2026-08-06', updated_at: null, read_minutes: 9, view_count: 195,
    cover_image: '/assets/images/articles/placeholder-09.jpg',
    body_html: `<h2 id="giris">Giriş</h2><p>Modern programlama dillerinde sık kullanılan <code>map</code>/<code>filter</code>/<code>reduce</code> desenlerinin kökü, 1930'larda Alonzo Church'ün geliştirdiği lambda hesabına uzanır.</p><h2 id="lambda-hesabi">Lambda Hesabı</h2><p>Lambda hesabı, hesaplamayı fonksiyon tanımlama ve uygulama üzerinden ifade eden minimal bir sistemdir.</p>`,
  },
];

const insertArticle = db.prepare(`
  INSERT INTO articles (slug, title, subtitle, excerpt, body_html, category_id, cover_image, published_at, updated_at, read_minutes, view_count)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertArticleTag = db.prepare('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)');

for (const a of articles) {
  const result = insertArticle.run(
    a.slug, a.title, a.subtitle, a.excerpt, a.body_html,
    categoryIds[a.category], a.cover_image, a.published_at, a.updated_at, a.read_minutes,
    a.view_count ?? 0,
  );
  const articleId = Number(result.lastInsertRowid);
  for (const tagSlug of a.tags) {
    insertArticleTag.run(articleId, tagIds[tagSlug]);
  }
}

console.log(`Seed tamamlandı: ${categories.length} kategori, ${Object.keys(tagNames).length} etiket, ${articles.length} makale.`);
db.close();
