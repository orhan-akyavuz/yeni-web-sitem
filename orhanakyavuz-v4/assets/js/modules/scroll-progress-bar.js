/**
 * modules/scroll-progress-bar.js
 * ----------------------------------------------------------------------
 * GÖREV: Sayfanın en üstüne, tüm sayfa yüksekliğine göre scroll ilerlemesini
 * gösteren ince (3px) bir çubuk ekler. `reading-progress.js`'den farkı:
 * bu modül TÜM SAYFAYI baz alır (navbar altında sabit), reading-progress
 * ise yalnızca bir makale gövdesini baz alır.
 *
 * PERFORMANS: `width` değil `transform: scaleX()` kullanılır — width
 * değişimi her karede layout (reflow) tetikler, transform ise yalnızca
 * compositor katmanında çalışır (GPU hızlandırmalı, çok daha ucuz).
 * Scroll event'i `requestAnimationFrame` ile throttle edilir ve
 * `{ passive: true }` ile kayıt edilir — ana thread'i asla bloklamaz.
 * ----------------------------------------------------------------------
 */

export function initScrollProgressBar() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress-bar';
  bar.setAttribute('aria-hidden', 'true');
  bar.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'right:0', 'height:3px', 'z-index:200',
    'background-color:#2454D6', // --color-accent-500
    'transform-origin:left',
    'transform:scaleX(0)',
    'will-change:transform',
  ].join(';');
  document.body.prepend(bar);

  let ticking = false;

  function update() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
    bar.style.transform = `scaleX(${progress})`;
    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );

  update(); // ilk yüklemede (örn. sayfa hash ile açıldıysa) doğru değeri göster
}
