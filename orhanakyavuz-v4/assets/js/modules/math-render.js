/**
 * modules/math-render.js
 * ----------------------------------------------------------------------
 * GÖREV: Sprint 8 § 3.1 — KaTeX ile LaTeX formüllerini render eder.
 * KaTeX, vanilla-JS ilkesine (Sprint 6) bilinçli bir İSTİSNADIR: LaTeX
 * render etmek bir motor gerektirir, bunu sıfırdan yazmak anlamsızdır.
 * KaTeX, MathJax'e göre çok daha hızlı olduğu için (Sprint 8 §3.1 gerekçesi)
 * seçildi ve yalnızca CDN üzerinden, `<script defer>` ile yüklenir —
 * npm/bundler bağımlılığı eklenmez.
 *
 * Sayfada `window.renderMathInElement` yoksa (KaTeX CDN script'i
 * yüklenmediyse veya sayfa formül içermiyorsa) no-op'tur.
 * ----------------------------------------------------------------------
 */

export function initMathRender() {
  const articleBody = document.querySelector('.article-body');
  if (!articleBody) return; // yalnızca makale sayfalarında çalışır

  if (typeof window.renderMathInElement !== 'function') {
    // KaTeX CDN script'i bu sayfada yok — sessizce çık (Sprint 6 "no-op güvenli" ilkesi)
    return;
  }

  window.renderMathInElement(articleBody, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true },
    ],
    throwOnError: false,
  });
}
