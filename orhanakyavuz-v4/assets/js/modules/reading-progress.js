/**
 * modules/reading-progress.js
 * ----------------------------------------------------------------------
 * GÖREV: Sprint 3 § 14'te tanımlanan okuma deneyiminin bir parçası —
 * makale sayfasında `[data-reading-progress]` ile işaretlenmiş gövde
 * elementinin ne kadarının okunduğunu gösterir (navbar'ın hemen altında
 * ince bir çubuk olarak kullanılması önerilir; görsel yerleşim CSS
 * tarafında blog şablonu yazıldığında tanımlanacaktır — Sprint 5 bu
 * şablonu henüz içermiyordu).
 *
 * ANA SAYFADA BU MODÜL NO-OP'TUR: `[data-reading-progress]` elementi
 * bulunmadığından hiçbir DOM değişikliği yapmadan sessizce çıkar. Bu,
 * modülün "her sayfada güvenle çalıştırılabilir" olmasını sağlar —
 * main.js hangi sayfada olduğunu bilmek zorunda kalmaz.
 * ----------------------------------------------------------------------
 */

export function initReadingProgress() {
  const article = document.querySelector('[data-reading-progress]');
  if (!article) return; // Ana sayfada (ve makale içermeyen sayfalarda) hiçbir şey yapma

  const bar = document.createElement('div');
  bar.className = 'reading-progress-bar';
  bar.setAttribute('aria-hidden', 'true');
  bar.style.cssText = [
    'position:sticky', 'top:0', 'height:2px', 'z-index:40',
    'background-color:#2454D6',
    'transform-origin:left', 'transform:scaleX(0)', 'will-change:transform',
  ].join(';');
  article.prepend(bar);

  let ticking = false;

  function update() {
    const rect = article.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const scrolledPast = -rect.top;
    const progress = total > 0 ? Math.min(Math.max(scrolledPast / total, 0), 1) : 0;
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

  update();
}
