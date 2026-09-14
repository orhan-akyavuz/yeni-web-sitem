/**
 * main.js
 * ----------------------------------------------------------------------
 * orhanakyavuz.com — JavaScript giriş noktası.
 *
 * MİMARİ KARAR (neden `import()` — statik `import` değil):
 * Sprint 4 HTML'i şu satırla bağlıydı: `<script src="/assets/js/main.js" defer></script>`
 * — yani KLASİK bir script, `type="module"` DEĞİL. Bu sprint'in kısıtı
 * "HTML'i değiştirme" olduğundan, script tag'ine `type="module"` eklemek
 * (statik `import`/`export` için gerekli olurdu) mümkün değildi.
 *
 * Çözüm: her modül dosyası kendi içinde standart bir ES modülüdür
 * (`export function initX() {}`), ama buraya STATİK değil DİNAMİK
 * `import()` ile yüklenir. `import()` tarayıcıda script'in kendi
 * `type`'ından bağımsız çalışır — modern tarayıcıların tamamında
 * (Sprint 6 hedefi: ES2025 uyumlu ortamlar) desteklenir. Ayrıca bu
 * yaklaşımın bir performans faydası da vardır: modüller paralel
 * indirilir ve `Promise.allSettled` ile hiçbiri diğerini bloklamaz.
 *
 * Her modül dosyası tek bir sorumluluğa sahiptir ve ilgili DOM
 * elementi sayfada yoksa kendiliğinden no-op olacak şekilde yazıldı
 * (bkz. her dosyanın kendi üst yorum bloğu) — bu yüzden main.js hangi
 * sayfada çalıştığını bilmek zorunda değildir; aynı main.js hem ana
 * sayfada hem ileride yazılacak blog/pages şablonlarında güvenle
 * kullanılabilir.
 * ----------------------------------------------------------------------
 */

// ======================================================================
// Google Analytics 4 (GA4)
// ----------------------------------------------------------------------
// Ölçüm kimliğini buraya yazın: GA4 mülkünüzün kimliği "G-XXXXXXXXXX"
// biçimindedir. Google Analytics yönetim paneli > Veri Akışları bölümünden
// alabilirsiniz. Placeholder bırakılırsa hiçbir istek gönderilmez.
// ======================================================================
const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX';

if (GA4_MEASUREMENT_ID && !GA4_MEASUREMENT_ID.includes('XXXX')) {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  gtag('js', new Date());
  gtag('config', GA4_MEASUREMENT_ID, { anonymize_ip: true });
}

const MODULES = [
  { path: './modules/sticky-navbar.js', init: 'initStickyNavbar' },
  { path: './modules/active-navigation.js', init: 'initActiveNavigation' },
  { path: './modules/mobile-menu.js', init: 'initMobileMenu' },
  { path: './modules/search-overlay.js', init: 'initSearchOverlay' },
  { path: './modules/back-to-top.js', init: 'initBackToTop' },
  { path: './modules/scroll-progress-bar.js', init: 'initScrollProgressBar' },
  { path: './modules/reading-progress.js', init: 'initReadingProgress' },
  { path: './modules/smooth-scroll.js', init: 'initSmoothScroll' },
  { path: './modules/theme-toggle.js', init: 'initThemeToggle' },
  { path: './modules/lazy-loading.js', init: 'initLazyLoading' },
  { path: './modules/scroll-reveal.js', init: 'initScrollReveal' },
  { path: './modules/faq-accordion.js', init: 'initFaqAccordion' },
  { path: './modules/newsletter-validation.js', init: 'initNewsletterValidation' },
  { path: './modules/toc-scrollspy.js', init: 'initTocScrollspy' },
  { path: './modules/code-copy.js', init: 'initCodeCopy' },
  { path: './modules/blog-listing.js', init: 'initBlogListing' },
  { path: './modules/fetch-articles.js', init: 'initFetchArticles' },
  { path: './modules/social-proof.js', init: 'initSocialProof' },
  { path: './modules/mobile-filter-sheet.js', init: 'initMobileFilterSheet' },
  { path: './modules/pdf-download.js', init: 'initPdfDownload' },
  { path: './modules/contact-form.js', init: 'initContactForm' },
  { path: './modules/math-render.js', init: 'initMathRender' },
  { path: './modules/weekly-problem.js', init: 'initWeeklyProblem' },
  { path: './modules/admin-weekly-problem.js', init: 'initAdminWeeklyProblem' },
  { path: './modules/weekly-archive.js', init: 'initWeeklyArchive' },
  { path: './modules/auth.js', init: 'initAuth' },
  { path: './modules/level-analysis.js', init: 'initLevelAnalysis' },
  { path: './modules/admin-level-analysis.js', init: 'initAdminLevelAnalysis' },
  { path: './modules/level-analysis-report.js', init: 'initLevelAnalysisReport' },
  { path: './modules/current-info.js', init: 'initCurrentInfo' },
  { path: './modules/admin-current-info.js', init: 'initAdminCurrentInfo' },
];

async function bootstrap() {
  const results = await Promise.allSettled(
    MODULES.map(async ({ path, init }) => {
      const module = await import(path);
      const initFn = module[init];
      if (typeof initFn !== 'function') {
        throw new Error(`${path} dosyasında "${init}" adında bir export bulunamadı.`);
      }
      return initFn();
    }),
  );

  // Bir modül hata verirse diğerlerini etkilemez; yalnızca konsola loglanır.
  // Üretimde bu bir hata izleme servisine (Sentry vb.) yönlendirilebilir.
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.error(`[main.js] Modül başlatılamadı: ${MODULES[index].path}`, result.reason);
    }
  });
}

// `defer` attribute'u sayesinde DOM zaten hazır durumda çalışır;
// yine de savunmacı bir kontrol eklenir (script bir gün `defer` olmadan
// kullanılırsa dahi doğru çalışsın diye).
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
