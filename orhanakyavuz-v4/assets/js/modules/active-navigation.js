/**
 * modules/active-navigation.js
 * ----------------------------------------------------------------------
 * GÖREV: `.site-nav__link` ve `.mobile-nav__link` öğelerinden, geçerli
 * sayfanın URL yoluna (pathname) karşılık gelenine `aria-current="page"`
 * ekler. CSS tarafı (components/navbar.css) bu attribute'u zaten
 * karşılıyor — vurgu rengi + alt çizgi otomatik uygulanır.
 *
 * NOT: Bu site şu an tam sayfa geçişleriyle çalıştığından (her bölüm ayrı
 * bir HTML dosyası — bkz. Sprint 4 klasör yapısı), "aktif sayfa" tespiti
 * URL karşılaştırmasıyla yapılır. İleride ana sayfa içinde `#kategoriler`
 * gibi anchor tabanlı gezinme eklenirse, bu modül IntersectionObserver
 * tabanlı bir "scroll-spy" moduna genişletilebilir; altyapı buna hazır
 * şekilde (fonksiyon dışa açık, tek sorumluluk) yazılmıştır.
 * ----------------------------------------------------------------------
 */

export function initActiveNavigation() {
  const links = document.querySelectorAll('.site-nav__link, .mobile-nav__link');
  if (!links.length) return;

  const currentPath = normalizePath(window.location.pathname);

  links.forEach((link) => {
    const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
    const isActive = linkPath === currentPath;

    link.toggleAttribute('aria-current', isActive);
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

/** Sondaki "/" farkını yok sayar: "/blog" ile "/blog/" aynı kabul edilir. */
function normalizePath(path) {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}
