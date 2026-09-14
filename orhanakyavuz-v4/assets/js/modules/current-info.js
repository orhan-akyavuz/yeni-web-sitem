// assets/js/modules/current-info.js
// ----------------------------------------------------------------------
// Güncel Bilgiler Sayfa Modülü.
// Yalnızca status = 'published' olan resmî içerikleri listeler, filtreler ve arar.
// ----------------------------------------------------------------------

const API_BASE = (window.__API_BASE__ !== undefined)
  ? window.__API_BASE__
  : (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '');

const CATEGORY_NAMES = {
  banka: 'Banka İlanı',
  kamu: 'Kamu Duyurusu',
  ags: 'AGS',
  kpss: 'KPSS',
  ales: 'ALES',
  dgs: 'DGS',
  egitim: 'Eğitim',
  diger: 'Duyuru',
};

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
}

function buildCard(item) {
  const card = document.createElement('article');
  card.className = `update-card ${item.isFeatured ? 'update-card--featured' : ''}`;

  const top = document.createElement('div');
  top.className = 'update-card__top';

  const sourceName = document.createElement('span');
  sourceName.className = 'update-card__source';
  sourceName.textContent = item.source?.name || 'Resmî Kurum';

  const catBadge = document.createElement('span');
  catBadge.className = 'update-card__badge';
  catBadge.textContent = CATEGORY_NAMES[item.category] || item.category;

  top.append(sourceName, catBadge);

  const title = document.createElement('h2');
  title.className = 'update-card__title';
  title.textContent = item.title;

  const summary = document.createElement('p');
  summary.className = 'update-card__summary';
  summary.textContent = item.summary || 'Bu duyuru için ayrıntılı özet eklenmedi.';

  const footer = document.createElement('div');
  footer.className = 'update-card__footer';

  const dateSpan = document.createElement('span');
  dateSpan.className = 'update-card__date';
  dateSpan.textContent = formatDate(item.publishDate);

  const link = document.createElement('a');
  link.className = 'update-card__btn';
  link.href = item.originalUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `${item.title} için resmî kaynağı yeni sekmede incele`);
  link.innerHTML = `Resmî Kaynağı İncele <span aria-hidden="true">&rarr;</span>`;

  footer.append(dateSpan, link);
  card.append(top, title, summary, footer);

  return card;
}

export function initCurrentInfo() {
  const page = document.querySelector('[data-current-info-page]');
  if (!page) return;

  const grid = page.querySelector('[data-current-grid]');
  const countEl = page.querySelector('[data-current-count]');
  const searchInput = page.querySelector('[data-current-search]');
  const filterPills = page.querySelectorAll('[data-category-filter]');

  let activeCategory = 'all';
  let searchQuery = '';
  let searchTimeout = null;

  async function loadData() {
    if (!grid) return;
    grid.innerHTML = `
      <div class="current-info-state" role="status">
        <p>Güncel duyurular yükleniyor...</p>
      </div>
    `;

    try {
      const params = new URLSearchParams();
      if (activeCategory && activeCategory !== 'all') {
        params.set('category', activeCategory);
      }
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }

      const res = await fetch(`${API_BASE}/api/current-info?${params.toString()}`);
      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.error?.message || 'Veriler alınamadı.');
      }

      const items = payload.data?.items || [];
      const total = payload.data?.pagination?.total ?? items.length;

      if (countEl) {
        countEl.textContent = `${total} güncel duyuru`;
      }

      grid.replaceChildren();

      if (items.length === 0) {
        grid.innerHTML = `
          <div class="current-info-state" role="status">
            <p>Seçili kriterlere uygun güncel bilgi veya duyuru bulunamadı.</p>
          </div>
        `;
        return;
      }

      for (const item of items) {
        grid.appendChild(buildCard(item));
      }
    } catch (err) {
      grid.innerHTML = `
        <div class="current-info-state current-info-state--error" role="alert">
          <p>Duyurular yüklenirken bir hata meydana geldi: ${err.message}</p>
        </div>
      `;
      if (countEl) countEl.textContent = '';
    }
  }

  // Kategori tıklama olayları
  for (const pill of filterPills) {
    pill.addEventListener('click', () => {
      const targetCat = pill.dataset.categoryFilter;
      if (targetCat === activeCategory) return;

      activeCategory = targetCat;
      for (const p of filterPills) {
        p.classList.toggle('current-info-pill--active', p === pill);
        p.setAttribute('aria-pressed', String(p === pill));
      }
      loadData();
    });
  }

  // Arama girdisi (debounce)
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        loadData();
      }, 300);
    });
  }

  // İlk yükleme
  loadData();
}
