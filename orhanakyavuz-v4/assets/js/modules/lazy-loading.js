/**
 * modules/lazy-loading.js
 * ----------------------------------------------------------------------
 * BAĞLAM: Sprint 4 HTML'inde, katlama altındaki tüm görsellere zaten
 * native `loading="lazy"` ve `decoding="async"` attribute'ları eklenmişti
 * (bkz. index.html — article-card__image vb.). Modern tarayıcıların
 * tamamı bunu destekler; bu yüzden bu modül bir "lazy-load fallback'i"
 * DEĞİLDİR (buna gerek yok).
 *
 * Bu modülün gerçek görevi: görseller yüklenirken ani "pop-in" yerine
 * yumuşak bir fade-in vermek — Sprint 2 §12 animasyon felsefesiyle
 * uyumlu, göz yormayan bir yükleme hissi. CSS dosyalarına dokunmadan
 * (bu sprintin kısıtı) tamamen JS'ten satır içi stil ile uygulanır.
 * ----------------------------------------------------------------------
 */

export function initLazyLoading() {
  const images = document.querySelectorAll('img[loading="lazy"]');
  if (!images.length) return;

  images.forEach((img) => {
    // Zaten tarayıcı önbelleğinden anında yüklendiyse (complete === true),
    // fade-in'e gerek yok — doğrudan göster.
    if (img.complete && img.naturalWidth > 0) return;

    img.style.opacity = '0';
    img.style.transition = 'opacity 300ms ease-out';

    img.addEventListener(
      'load',
      () => {
        img.style.opacity = '1';
      },
      { once: true },
    );

    // Görsel yüklenemezse (404 vb.) sonsuza dek şeffaf kalmasın
    img.addEventListener(
      'error',
      () => {
        img.style.opacity = '1';
      },
      { once: true },
    );
  });
}
