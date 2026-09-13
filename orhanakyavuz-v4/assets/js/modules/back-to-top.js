/**
 * modules/back-to-top.js
 * ----------------------------------------------------------------------
 * GÖREV: Kullanıcı belirli bir mesafe (600px) kaydırınca sağ altta beliren,
 * tıklanınca sayfa başına yumuşak kaydıran bir buton oluşturur. Bu buton
 * Sprint 4 HTML'inde yok — sitedeki tüm sayfalarda tutarlı çalışması için
 * bilinçli olarak JS tarafından enjekte edilir (böylece her sayfaya tek
 * tek eklenmesi gerekmez).
 *
 * PERFORMANS: Görünürlük kontrolü scroll event yerine bir sentinel +
 * IntersectionObserver ile yapılır (bkz. sticky-navbar.js'deki aynı teknik).
 * ----------------------------------------------------------------------
 */

const VISIBILITY_THRESHOLD_PX = 600;

export function initBackToTop() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button button--icon back-to-top';
  button.setAttribute('aria-label', 'Sayfa başına dön');
  button.style.cssText = [
    'position:fixed', 'right:24px', 'bottom:24px', 'z-index:60',
    'background-color:#12151A', 'color:#FFFFFF',
    'box-shadow:0 8px 24px rgba(18,21,26,0.10)',
    'opacity:0', 'visibility:hidden', 'transform:translateY(8px)',
    'transition:opacity 200ms ease-out, transform 200ms ease-out, visibility 200ms',
  ].join(';');
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 19V5M5 12l7-7 7 7"/>
    </svg>
  `;

  document.body.append(button);

  // Sentinel: sayfanın VISIBILITY_THRESHOLD_PX aşağısına yerleştirilir.
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = `position:absolute; top:${VISIBILITY_THRESHOLD_PX}px; left:0; width:1px; height:1px;`;
  document.body.prepend(sentinel);

  const observer = new IntersectionObserver(([entry]) => {
    const shouldShow = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    button.style.opacity = shouldShow ? '1' : '0';
    button.style.visibility = shouldShow ? 'visible' : 'hidden';
    button.style.transform = shouldShow ? 'translateY(0)' : 'translateY(8px)';
  });
  observer.observe(sentinel);

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  button.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'instant' : 'smooth',
    });
    // Klavye kullanıcıları için odağı mantıklı bir yere taşı
    document.querySelector('.site-header__logo')?.focus();
  });
}
