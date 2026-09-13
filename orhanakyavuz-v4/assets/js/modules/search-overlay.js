/**
 * modules/search-overlay.js
 * ----------------------------------------------------------------------
 * GÖREV: `.site-header__search-toggle` butonuna tıklandığında tam ekran
 * bir arama katmanı açar. Markup'ı JS çalışma zamanında oluşturur
 * (Sprint 4 HTML'inde yalnızca tetikleyici buton var), ama görsel stiller
 * Sprint 13'ten itibaren `components/overlay.css`'teki gerçek sınıflardan
 * gelir — satır içi stil kalmadı.
 *
 * Bu sitede henüz bir arama backend'i/index'i olmadığından, form submit
 * `/blog/?q=...` adresine yönlendirme yapar (bkz. `blog-listing.js`).
 * ----------------------------------------------------------------------
 */

export function initSearchOverlay() {
  const trigger = document.querySelector('.site-header__search-toggle');
  if (!trigger) return;

  let overlay = null;
  let lastFocused = null;

  function buildOverlay() {
    const el = document.createElement('div');
    el.className = 'search-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Site içinde ara');

    el.innerHTML = `
      <form class="search-overlay__form" role="search">
        <img src="/assets/icons/search.svg" alt="" width="18" height="18" aria-hidden="true" />
        <label for="search-overlay-input" class="visually-hidden">Arama terimi</label>
        <input
          id="search-overlay-input"
          class="search-overlay__input"
          type="search"
          name="q"
          placeholder="Yazılarda ara…"
          autocomplete="off"
        />
        <button type="submit" class="button button--primary button--medium">Ara</button>
      </form>
    `;

    el.addEventListener('click', (event) => {
      if (event.target === el) close(); // yalnızca arka plana tıklanınca kapat
    });

    el.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      const query = new FormData(event.target).get('q')?.toString().trim();
      if (query) {
        window.location.href = `/blog/?q=${encodeURIComponent(query)}`;
      }
    });

    return el;
  }

  function open() {
    lastFocused = document.activeElement;
    overlay = buildOverlay();
    document.body.append(overlay);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => overlay.classList.add('is-visible'));

    trigger.setAttribute('aria-expanded', 'true');
    overlay.querySelector('input')?.focus();

    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.body.style.overflow = '';
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
    lastFocused?.focus();
  }

  function onKeydown(event) {
    if (event.key === 'Escape') close();
  }

  trigger.addEventListener('click', () => {
    overlay ? close() : open();
  });
}
