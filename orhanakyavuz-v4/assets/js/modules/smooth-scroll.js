/**
 * modules/smooth-scroll.js
 * ----------------------------------------------------------------------
 * GÖREV: Sayfa içi (`#hedef`) linklere tıklandığında yumuşak kaydırma
 * uygular. `base/reset.css` içinde zaten `html { scroll-behavior: smooth }`
 * tanımlı — ama native CSS smooth-scroll, sticky navbar'ın kapladığı
 * alanı hesaba katmaz (hedef başlık navbar'ın ARKASINDA kalır). Bu
 * modülün asıl işi budur: navbar yüksekliği + 24px nefes payı kadar
 * bir offset uygulayıp `window.scrollTo` ile düzeltilmiş konuma kaymak.
 *
 * `prefers-reduced-motion` tercihi olan kullanıcılarda CSS zaten
 * `scroll-behavior: auto`'ya düşüyor (bkz. reset.css); burada da aynı
 * tercihe saygı gösterilir.
 * ----------------------------------------------------------------------
 */

export function initSmoothScroll() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const targetId = link.getAttribute('href').slice(1);
    if (!targetId) return; // yalnızca "#" olan linkleri yok say

    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();

    const headerHeight = document.querySelector('.site-header')?.offsetHeight ?? 0;
    const offset = headerHeight + 24; // Sprint 2 spacing skalası: 24px nefes payı
    const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;

    window.scrollTo({
      top: targetTop,
      behavior: prefersReducedMotion ? 'instant' : 'smooth',
    });

    // Klavye/ekran okuyucu kullanıcıları için odağı hedefe taşı
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });

    // URL'yi güncelle ama sayfayı yeniden yükleme (geri tuşu için geçmişe eklenir)
    history.pushState(null, '', `#${targetId}`);
  });
}
