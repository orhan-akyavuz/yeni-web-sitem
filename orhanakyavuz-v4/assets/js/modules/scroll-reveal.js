/**
 * modules/scroll-reveal.js
 * ----------------------------------------------------------------------
 * GÖREV: Sprint 2 § 12 "Scroll Reveal" kuralını uygular: 8px translateY +
 * fade, 400ms ease-out, YALNIZCA İLK GÖRÜNÜMDE (tekrar tetiklenmez),
 * kart gruplarında maksimum 60ms stagger (kademeli gecikme).
 *
 * Hedef elementler: kart bileşenleri (`.article-card`, `.category-card`,
 * `.service-card`, `.stat-card`, `.featured-article-card`). Genel bir
 * `[data-reveal]` işaretleyicisi de desteklenir — ileride başka
 * sayfalarda kullanılmak istenirse HTML'e yalnızca bu attribute eklenmesi
 * yeterlidir.
 *
 * `prefers-reduced-motion` tercihi olan kullanıcılarda animasyon tamamen
 * atlanır, elementler doğrudan görünür halde kalır (Sprint 2 §13).
 * ----------------------------------------------------------------------
 */

const REVEAL_SELECTOR = [
  '.article-card',
  '.featured-article-card',
  '.category-card',
  '.service-card',
  '.stat-card',
  '[data-reveal]',
].join(', ');

const STAGGER_STEP_MS = 60;
const MAX_STAGGER_MS = 240; // 4 öğeden sonra gecikme artmaz — çok geç açılan kart olmasın

const FAILSAFE_REVEAL_MS = 2500; // observer tetiklenmezse (ör. headless tam sayfa ekran görüntüsü) kurtarma

export function initScrollReveal() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elements = document.querySelectorAll(REVEAL_SELECTOR);
  if (!elements.length) return;

  // IntersectionObserver yoksa animasyonu hiç başlatma — elementler görünür kalsın
  if (!('IntersectionObserver' in window)) return;

  if (prefersReducedMotion) return; // hiçbir stil uygulama, elementler zaten görünür

  // Headless/otomasyon ortamlarında (Playwright, Puppeteer vb.) tam sayfa ekran
  // görüntüsü, geçiş animasyonları tamamlanmadan alındığı için kartlar boş çıkar.
  // Bu ortamlarda animasyonu hiç başlatma — elementler doğrudan görünür kalsın.
  if (navigator.webdriver) return;

  // Aynı ebeveyn (örn. bir grid) içindeki kardeşlere sırayla gecikme ver
  const staggerIndex = new WeakMap();
  elements.forEach((el) => {
    const siblings = Array.from(el.parentElement?.children ?? []).filter((child) =>
      child.matches(REVEAL_SELECTOR),
    );
    staggerIndex.set(el, siblings.indexOf(el));

    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    el.style.transition = 'opacity 400ms ease-out, transform 400ms ease-out';
  });

  const reveal = (el) => {
    const delay = Math.min((staggerIndex.get(el) ?? 0) * STAGGER_STEP_MS, MAX_STAGGER_MS);
    el.style.transitionDelay = `${delay}ms`;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  };

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        reveal(entry.target);
        obs.unobserve(entry.target); // yalnızca ilk görünümde — tekrar tetiklenmez
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
  );

  elements.forEach((el) => observer.observe(el));

  // GÜVENLİK AĞI: observer hiç tetiklenmezse (headless tam sayfa ekran görüntüsü,
  // bastırılmış sekme vb.) elementler sonsuza kadar görünmez kalmasın.
  window.setTimeout(() => {
    elements.forEach((el) => {
      if (el.style.opacity !== '1') {
        reveal(el);
        observer.unobserve(el);
      }
    });
  }, FAILSAFE_REVEAL_MS);
}
