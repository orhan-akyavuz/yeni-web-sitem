/**
 * modules/theme-toggle.js
 * ----------------------------------------------------------------------
 * ⚠️  ÖNEMLİ MİMARİ NOT (dürüstçe belirtilmelidir):
 * Sprint 1–2'deki tasarım sistemi yalnızca AÇIK (light) tema için
 * tanımlandı — Sprint 1 "Arka plan mümkün olduğunca açık tonlarda
 * olsun" ilkesiyle bilinçli bir karardı. Sprint 5 CSS'inde
 * `[data-theme="dark"]` için renk override'ları YAZILMADI (yalnızca
 * `variables.css` içinde Gray 900/950'nin "gelecekteki dark-mode
 * yüzeyi" olabileceğine dair bir yorum var).
 *
 * Bu modül `<html>` elementine `data-theme="dark"` / `"light"` attribute'unu
 * doğru şekilde uygular ve tercihi kalıcı kılar — JS TARAFI TAMAMDIR.
 * Ancak CSS tarafında karşılık gelen renk tokenleri tanımlanana kadar
 * (örn. `:root[data-theme="dark"] { --color-background: ...; }` gibi bir
 * blok `base/variables.css`'e eklenmeden) buton görsel olarak HİÇBİR
 * ŞEYİ DEĞİŞTİRMEYECEKTİR. Bu, bu sprintin "yalnızca JS yaz" kısıtı
 * nedeniyle bilinçli olarak bırakılmış bir sonraki adımdır.
 * ----------------------------------------------------------------------
 */

const STORAGE_KEY = 'orhanakyavuz-theme';

export function initThemeToggle() {
  const container = document.querySelector('.site-header__container');
  if (!container) return;

  applyStoredOrSystemPreference();

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'site-header__theme-toggle';
  button.setAttribute('aria-label', 'Karanlık/Aydınlık temayı değiştir');
  button.style.cssText = [
    'display:inline-flex', 'align-items:center', 'justify-content:center',
    'width:40px', 'height:40px', 'border-radius:8px', 'color:inherit',
  ].join(';');
  updateIcon(button);

  // Arama butonundan hemen önce ekle — Sprint 3 navbar sırasına en yakın konum
  const searchToggle = container.querySelector('.site-header__search-toggle');
  searchToggle ? searchToggle.before(button) : container.append(button);

  button.addEventListener('click', () => {
    const current = document.documentElement.dataset.theme ?? 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
    updateIcon(button);
  });

  // Sistem teması değişirse (ve kullanıcı manuel tercih yapmamışsa) senkron kal
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (localStorage.getItem(STORAGE_KEY)) return; // kullanıcı manuel seçtiyse dokunma
    document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
    updateIcon(button);
  });
}

function applyStoredOrSystemPreference() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = stored ?? (systemPrefersDark ? 'dark' : 'light');
}

function updateIcon(button) {
  const isDark = document.documentElement.dataset.theme === 'dark';
  // Sprint 10: metin karakterleri (☀/☾) yerine gerçek Lucide SVG ikonları
  // (assets/icons/sun.svg, assets/icons/moon.svg) kullanılır — sitenin geri
  // kalanındaki tüm ikonlarla (Sprint 2 §10: 24px grid, 1.5px stroke) tutarlı.
  button.innerHTML = '';
  const img = document.createElement('img');
  img.src = isDark ? '/assets/icons/sun.svg' : '/assets/icons/moon.svg';
  img.alt = '';
  img.width = 20;
  img.height = 20;
  img.setAttribute('aria-hidden', 'true');
  button.append(img);
  button.setAttribute('aria-pressed', String(isDark));
}
