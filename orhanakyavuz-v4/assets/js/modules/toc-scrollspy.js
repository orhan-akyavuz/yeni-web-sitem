/**
 * modules/toc-scrollspy.js
 * ----------------------------------------------------------------------
 * GÖREV: Sprint 8 § 2.3 — makale gövdesindeki H2/H3 başlıklarının hangisi
 * o an okunuyorsa, `.toc__link`'in karşılığına `.is-active` sınıfını
 * ekler (solunda Accent çizgi belirir, metin Accent 500 olur — CSS
 * tarafı `components/article-content.css`'te zaten tanımlı).
 *
 * Ayrıca makale başındaki mobil/tablet TOC accordion'unu (Sprint 6
 * `faq-accordion.js` ile aynı yükseklik-animasyon deseni) yönetir.
 *
 * Sayfada `.toc` / `.toc-mobile` yoksa (örn. ana sayfa) no-op'tur.
 * ----------------------------------------------------------------------
 */

export function initTocScrollspy() {
  const headings = document.querySelectorAll('.article-body h2[id], .article-body h3[id]');
  const tocLinks = document.querySelectorAll('.toc__link, .toc-mobile .toc__link');
  if (!headings.length || !tocLinks.length) return;

  const linkByHeadingId = new Map();
  tocLinks.forEach((link) => {
    const id = link.getAttribute('href')?.slice(1);
    if (id) linkByHeadingId.set(id, link);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = linkByHeadingId.get(entry.target.id);
        if (!link) return;
        // Aynı id'ye karşılık gelen hem sidebar hem mobil TOC linki varsa ikisini de güncelle
        document
          .querySelectorAll(`a[href="#${entry.target.id}"]`)
          .forEach((el) => el.classList.toggle('is-active', entry.isIntersecting));
      });
    },
    {
      // Üst 20%'de "aktif" say — kullanıcı başlığı yeni geçtiğinde vurgu değişsin
      rootMargin: '-72px 0px -70% 0px',
      threshold: 0,
    },
  );

  headings.forEach((heading) => observer.observe(heading));

  initMobileTocAccordion();
}

function initMobileTocAccordion() {
  const trigger = document.querySelector('.toc-mobile__trigger');
  const panel = document.querySelector('.toc-mobile__panel');
  if (!trigger || !panel) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  trigger.addEventListener('click', () => {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    trigger.setAttribute('aria-expanded', String(!isOpen));

    if (isOpen) {
      if (prefersReducedMotion) {
        panel.hidden = true;
        return;
      }
      panel.style.height = `${panel.scrollHeight}px`;
      requestAnimationFrame(() => (panel.style.height = '0px'));
      panel.addEventListener('transitionend', () => (panel.hidden = true), { once: true });
    } else {
      panel.hidden = false;
      if (prefersReducedMotion) return;
      const targetHeight = panel.scrollHeight;
      panel.style.height = '0px';
      requestAnimationFrame(() => (panel.style.height = `${targetHeight}px`));
      panel.addEventListener('transitionend', () => (panel.style.height = 'auto'), { once: true });
    }
  });
}
