/**
 * modules/mobile-filter-sheet.js
 * ----------------------------------------------------------------------
 * GÖREV: Sprint 7 § 10.1'de tasarlanan mobil "bottom-sheet" filtre
 * panelini uygular. Sprint 13'te bilinçli olarak ertelenmişti ("her
 * zaman görünür select" ile basitleştirilmişti) — bu modül o kararı
 * tam özelliğe yükseltir.
 *
 * MİMARİ: Filtre `<select>` elementleri KOPYALANMAZ — gerçek DOM
 * düğümleri, ekran mobil genişliğe düştüğünde `.filter-bar`dan
 * `.bottom-sheet__body`ye TAŞINIR (reparent). Bu sayede tek bir
 * kaynak-doğruluk (id, event listener, mevcut değer) korunur; masaüstüne
 * dönüldüğünde aynı düğümler orijinal yerine geri taşınır.
 *
 * Sayfada `.filter-bar` yoksa no-op'tur.
 * ----------------------------------------------------------------------
 */

export function initMobileFilterSheet() {
  const filterBar = document.querySelector('.filter-bar');
  if (!filterBar) return;

  const groups = Array.from(filterBar.querySelectorAll('.filter-bar__group'));
  if (!groups.length) return;

  const mediaQuery = window.matchMedia('(min-width: 768px)');
  const sheet = buildSheet();
  const backdrop = createBackdrop();
  const trigger = buildTrigger();

  // Tetikleyici butonu, sonuç sayısı satırının hemen yanına yerleştir
  filterBar.append(trigger);

  document.body.append(sheet, backdrop);

  let lastFocused = null;
  const focusableSelector = 'select, button:not([disabled]), a[href]';

  function moveGroupsToSheet() {
    const body = sheet.querySelector('.bottom-sheet__body');
    groups.forEach((group) => body.append(group));
  }

  function moveGroupsBack() {
    groups.forEach((group) => filterBar.insertBefore(group, trigger));
  }

  function open() {
    lastFocused = document.activeElement;
    sheet.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => {
      sheet.classList.add('is-open');
      backdrop.classList.add('is-visible');
    });
    document.body.style.overflow = 'hidden';
    trigger.setAttribute('aria-expanded', 'true');
    sheet.querySelector(focusableSelector)?.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    sheet.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    document.body.style.overflow = '';
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', onKeydown);
    lastFocused?.focus();
    // Animasyon bitene kadar bekleyip gerçekten gizle (transitionend
    // güvenilir tetiklenmeyebilir — sabit bir gecikme daha sağlam)
    setTimeout(() => {
      if (!sheet.classList.contains('is-open')) {
        sheet.hidden = true;
        backdrop.hidden = true;
      }
    }, 250);
  }

  function onKeydown(event) {
    if (event.key === 'Escape') close();
    if (event.key === 'Tab') trapFocus(event, sheet, focusableSelector);
  }

  trigger.addEventListener('click', open);
  sheet.querySelector('.bottom-sheet__close').addEventListener('click', close);
  sheet.querySelector('[data-sheet-apply]').addEventListener('click', close);
  backdrop.addEventListener('click', close);

  function syncLayout(isDesktop) {
    if (isDesktop) {
      moveGroupsBack();
      trigger.hidden = true;
      if (sheet.classList.contains('is-open')) close();
    } else {
      moveGroupsToSheet();
      trigger.hidden = false;
    }
  }

  syncLayout(mediaQuery.matches);
  mediaQuery.addEventListener('change', (event) => syncLayout(event.matches));
}

function buildTrigger() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'button button--outline button--small filter-bar__mobile-toggle';
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', 'mobile-filter-sheet');
  button.innerHTML = `
    <img src="/assets/icons/chevron-down.svg" alt="" aria-hidden="true" />
    <span>Filtrele</span>
  `;
  return button;
}

function buildSheet() {
  const sheet = document.createElement('div');
  sheet.id = 'mobile-filter-sheet';
  sheet.className = 'bottom-sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', 'Yazıları filtrele');
  sheet.hidden = true;
  sheet.innerHTML = `
    <div class="bottom-sheet__handle" aria-hidden="true"></div>
    <div class="bottom-sheet__header">
      <p class="bottom-sheet__title">Filtrele</p>
      <button type="button" class="bottom-sheet__close" aria-label="Kapat">
        <img src="/assets/icons/close.svg" alt="" width="18" height="18" aria-hidden="true" />
      </button>
    </div>
    <div class="bottom-sheet__body"></div>
    <div class="bottom-sheet__footer">
      <button type="button" class="button button--primary button--medium" data-sheet-apply>Uygula</button>
    </div>
  `;
  return sheet;
}

function createBackdrop() {
  const backdrop = document.createElement('div');
  backdrop.className = 'backdrop';
  backdrop.hidden = true;
  return backdrop;
}

function trapFocus(event, container, selector) {
  const focusables = Array.from(container.querySelectorAll(selector));
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
