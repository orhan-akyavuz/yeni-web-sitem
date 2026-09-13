// modules/social-proof.js
// Sosyal kanıt bölümündeki sayaçları doldurur:
//  - Toplam okunma: GET /api/stats (totalViews) → animasyonlu sayaç
//  - YouTube abone sayısı: statik yedek (YouTube API anahtarı olmadan canlı çekilemez)
// API erişilemezse elementler olduğu gibi kalır ("—" placeholder).

const YOUTUBE_FALLBACK_SUBS = 120; // kanal büyüdükçe güncelleyin

export function initSocialProof() {
  const counters = document.querySelectorAll('[data-social-counter]');
  if (!counters.length) return;

  const API_BASE = (window.__API_BASE__ !== undefined)
    ? window.__API_BASE__
    : (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:4000'
      : '');

  // Sayıyı 0'dan hedefe animasyonlu şekilde sayar
  const animateCount = (el, target) => {
    const duration = 1200;
    const start = performance.now();
    const format = (n) => new Intl.NumberFormat('tr-TR').format(n);
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      el.textContent = format(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Toplam okunma — API'den
  const viewsEl = document.querySelector('[data-social-counter="total-views"]');
  if (viewsEl) {
    fetch(`${API_BASE}/api/stats`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((payload) => {
        const data = payload?.data ?? payload;
        const total = Number(data?.totalViews ?? 0);
        if (!Number.isFinite(total) || total <= 0) throw new Error('geçersiz toplam');
        animateCount(viewsEl, total);
      })
      .catch(() => {
        // API yoksa sayaç sessizce "—" olarak kalır; konsolu kirletmeyelim
      });
  }

  // YouTube abone — statik yedek
  const subsEl = document.querySelector('[data-social-counter="youtube-subs"]');
  if (subsEl) animateCount(subsEl, YOUTUBE_FALLBACK_SUBS);
}
