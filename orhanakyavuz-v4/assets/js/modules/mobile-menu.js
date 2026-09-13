/**
 * modules/mobile-menu.js
 * ----------------------------------------------------------------------
 * GÖREV: `.site-header__menu-toggle` butonunu ve `#mobile-nav` panelini
 * (hidden attribute ile kontrol edilir — CSS tarafı zaten
 * `.mobile-nav:not([hidden])` durumuna göre transform uyguluyor, bkz.
 * components/navbar.css) çalışır hale getirir.
 *
 * Sprint 13: backdrop artık `components/overlay.css`'teki `.backdrop`
 * sınıfını kullanıyor — Sprint 6'daki satır içi stil köprüsü kaldırıldı.
 *
 * ERİŞİLEBİLİRLİK: Panel açıkken focus trap uygulanır (Tab döngüsü
 * panelden çıkmaz), ESC ile kapanır, kapanışta focus tetikleyici
 * butona geri döner (WCAG 2.4.3 — odak sırası).
 * ----------------------------------------------------------------------
 */

export function initMobileMenu() {
  const toggle = document.querySelector('.site-header__menu-toggle');
  const panel = document.getElementById('mobile-nav');
  if (!toggle || !panel) return;

  // Sprint 10: hamburger/kapatma ikonları gerçek Lucide SVG dosyalarından
  // (assets/icons/menu.svg, assets/icons/close.svg) geliyor — panel açılıp
  // kapanırken ikon glifi de değişir (yalnızca aria-label değil).
  const icon = document.getElementById('menu-toggle-icon');

  const backdrop = createBackdrop();
  let lastFocused = null;

  const focusableSelector = 'a[href], button:not([disabled])';

  function open() {
    lastFocused = document.activeElement;

    panel.removeAttribute('hidden');
    panel.after(backdrop); // backdrop'ı panelin hemen ardından DOM'a ekle
    requestAnimationFrame(() => backdrop.classList.add('is-visible'));
    document.body.style.overflow = 'hidden'; // arka planın kaymasını engelle

    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Menüyü kapat');
    if (icon) icon.src = '/assets/icons/close.svg';

    // Panel içindeki ilk odaklanabilir öğeye geç
    panel.querySelector(focusableSelector)?.focus();

    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    panel.setAttribute('hidden', '');
    backdrop.classList.remove('is-visible');
    backdrop.remove();
    document.body.style.overflow = '';

    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menüyü aç');
    if (icon) icon.src = '/assets/icons/menu.svg';

    document.removeEventListener('keydown', onKeydown);
    lastFocused?.focus(); // odağı tetikleyici butona geri ver
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key === 'Tab') {
      trapFocus(event, panel, focusableSelector);
    }
  }

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    isOpen ? close() : open();
  });

  backdrop.addEventListener('click', close);

  // Masaüstüne geçişte (Laptop breakpoint) panel açık kalmışsa otomatik kapat
  const desktopQuery = window.matchMedia('(min-width: 1024px)');
  desktopQuery.addEventListener('change', (event) => {
    if (event.matches && toggle.getAttribute('aria-expanded') === 'true') {
      close();
    }
  });
}

function createBackdrop() {
  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  return backdrop;
}

function trapFocus(event, container, selector) {
  const focusables = Array.from(container.querySelectorAll(selector));
  if (!focusables.length) return;

  const first = focusables[0];
  const last = focusables.at(-1); // ES2022+ Array.prototype.at

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
