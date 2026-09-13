/**
 * modules/sticky-navbar.js
 * ----------------------------------------------------------------------
 * GÖREV: Sayfa scroll edildiğinde `.site-header`e `.is-scrolled` sınıfını
 * ekler/kaldırır (bkz. components/navbar.css — yükseklik ASLA değişmez,
 * yalnızca zemin/kenarlık belirir).
 *
 * PERFORMANS KARARI: Klasik `scroll` event listener + `getBoundingClientRect()`
 * her karede layout thrashing riskine yol açar. Bunun yerine, sayfanın en
 * üstüne 1px yüksekliğinde görünmez bir "sentinel" (nöbetçi) element
 * eklenir ve `IntersectionObserver` ile izlenir. Sentinel viewport dışına
 * çıktığı an navbar'a "scrolled" durumu uygulanır. Bu teknik, tarayıcının
 * scroll thread'ini hiç meşgul etmez — ana thread'de iş yapmadan çalışır.
 * ----------------------------------------------------------------------
 */

export function initStickyNavbar() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  // Sentinel: body'nin en başına, header'dan önce eklenir.
  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute; top:0; left:0; width:1px; height:1px; pointer-events:none;';
  document.body.prepend(sentinel);

  const observer = new IntersectionObserver(
    ([entry]) => {
      header.classList.toggle('is-scrolled', !entry.isIntersecting);
    },
    { threshold: 0, rootMargin: '0px' },
  );

  observer.observe(sentinel);

  // Mega Menü Dropdown Kontrolleri (Tıklama ile aç/kapa, dışarı tıklama & Escape ile kapatma)
  const dropdownItem = header.querySelector('.site-nav__item--has-dropdown');
  const trigger = dropdownItem?.querySelector('.site-nav__trigger');
  if (dropdownItem && trigger) {
    const closeDropdown = () => {
      dropdownItem.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdownItem.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!dropdownItem.contains(e.target)) {
        closeDropdown();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dropdownItem.classList.contains('is-open')) {
        closeDropdown();
        trigger.focus();
      }
    });
  }

  // Temizlik fonksiyonu döndürülür — SPA benzeri sayfa geçişlerinde
  // (Sprint 7+ olası) observer'ı serbest bırakmak için kullanılabilir.
  return () => {
    observer.disconnect();
    sentinel.remove();
  };
}
