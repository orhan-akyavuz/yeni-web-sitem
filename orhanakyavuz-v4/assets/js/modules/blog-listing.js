/**
 * modules/blog-listing.js
 * ----------------------------------------------------------------------
 * GÖREV: `blog/index.html` (Tüm Yazılar) sayfasındaki filtre/sıralama
 * çubuğunu VE arama sonuçları görünümünü (Sprint 7 § 5 — `/blog/?q=...`
 * aynı sayfanın bir durumu, ayrı bir şablon DEĞİL) tek modülde yönetir.
 *
 * MİMARİ: Sayfa varsayılan olarak 6 örnek makaleyi STATİK HTML olarak
 * içerir (SEO — arama motorları JS çalıştırmadan da içeriği görür,
 * Sprint 9). Kategori/sıralama filtreleri bu statik kartlar üzerinde
 * DOM manipülasyonuyla çalışır.
 *
 * Sprint 16: Arama modu (`?q=` parametresi) artık gerçek backend'e
 * (`backend/routes/search.js` — GET /api/search) bağlanır ve TÜM 10
 * makale üzerinde arama yapar (statik sayfadaki 6 kartla sınırlı değil).
 * Backend'e ulaşılamazsa (sunucu kapalı/yalnızca statik önizleme),
 * mevcut kartlar üzerinde DOM tabanlı filtrelemeye otomatik döner —
 * site backend olmadan da asla kırılmaz.
 * ----------------------------------------------------------------------
 */
import { API_BASE_URL } from './api-config.js';

export function initBlogListing() {
  const grid = document.querySelector('[data-filterable]');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.article-card'));
  const categorySelect = document.querySelector('[data-filter="category"]');
  const sortSelect = document.querySelector('[data-filter="sort"]');
  const resultCount = document.querySelector('[data-result-count]');
  const searchHeading = document.querySelector('[data-search-heading]');
  const emptyState = document.querySelector('[data-empty-state]');

  const params = new URLSearchParams(window.location.search);
  const query = params.get('q')?.trim() ?? '';

  // Sprint 13: arama modunda (?q= var) sayfayı client-side noindex yap.
  // Statik site olduğundan sunucu tarafında koşullu meta etiketi mümkün
  // değil; bunun yerine JS ile <head>'e enjekte edilir (Sprint 9 §1.9
  // kararı — arama sonuçları indekslenmemeli). Googlebot JS render ettiği
  // için bu, gerçek bir noindex sinyali olarak işlev görür.
  if (query) {
    const robotsMeta = document.createElement('meta');
    robotsMeta.name = 'robots';
    robotsMeta.content = 'noindex, follow';
    document.head.append(robotsMeta);
  }

  if (query && searchHeading) {
    searchHeading.hidden = false;
    searchHeading.querySelector('[data-query]').textContent = `"${query}"`;
  }
  if (query && categorySelect) {
    categorySelect.closest('[data-filter-group]')?.setAttribute('hidden', ''); // arama modunda kategori filtresi gizlenir
  }

  if (query) {
    runApiSearch(query);
  } else {
    applyFilters();
    applySort();
  }

  async function runApiSearch(q) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(q)}&limit=20`);
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error('Arama API hatası');

      renderApiResults(payload.data.results);
      if (resultCount) resultCount.textContent = `${payload.data.pagination.total} sonuç bulundu`;
      if (emptyState) emptyState.hidden = payload.data.results.length !== 0;
    } catch (error) {
      // Backend çalışmıyorsa sessizce DOM tabanlı filtrelemeye dön —
      // kullanıcı en azından statik 6 makale içinde arama yapabilir.
      applyFilters();
    }
  }

  function renderApiResults(results) {
    grid.innerHTML = '';
    for (const article of results) {
      const li = document.createElement('li');
      li.innerHTML = `
        <article class="article-card">
          <a class="article-card__link" href="/blog/${article.slug}/">
            <img class="article-card__image" src="${article.coverImage}" alt="" width="376" height="212" loading="lazy" decoding="async" />
            <span class="article-card__category">${article.category}</span>
            <h3 class="article-card__title">${article.title}</h3>
            <p class="article-card__excerpt">${article.excerpt}</p>
            <p class="article-card__meta"><time datetime="${article.publishedAt}">${formatDate(article.publishedAt)}</time><span aria-hidden="true">·</span><span>${article.readMinutes} dk okuma</span></p>
          </a>
        </article>
      `;
      grid.append(li);
    }
  }

  function formatDate(iso) {
    const [y, m, d] = iso.split('-');
    const aylar = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${parseInt(d, 10)} ${aylar[parseInt(m, 10) - 1]} ${y}`;
  }

  function applyFilters() {
    const category = categorySelect?.value ?? 'all';
    const q = query.toLowerCase();

    let visibleCount = 0;
    cards.forEach((card) => {
      const cardCategory = card.dataset.category ?? '';
      const title = (card.dataset.title ?? '').toLowerCase();
      const excerpt = (card.dataset.excerpt ?? '').toLowerCase();

      const matchesCategory = category === 'all' || cardCategory === category;
      const matchesQuery = !q || title.includes(q) || excerpt.includes(q);
      const isVisible = matchesCategory && matchesQuery;

      card.closest('li').hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    if (resultCount) {
      resultCount.textContent = query
        ? `${visibleCount} sonuç bulundu`
        : `${visibleCount} yazı`;
    }
    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }
  }

  function applySort() {
    const mode = sortSelect?.value ?? 'newest';
    const sorted = [...cards].sort((a, b) => {
      if (mode === 'alphabetical') {
        return (a.dataset.title ?? '').localeCompare(b.dataset.title ?? '', 'tr');
      }
      if (mode === 'oldest') {
        return new Date(a.dataset.date) - new Date(b.dataset.date);
      }
      // 'newest' (varsayılan) — Sprint 7 §10 kararı
      return new Date(b.dataset.date) - new Date(a.dataset.date);
    });
    sorted.forEach((card) => grid.append(card.closest('li')));
  }

  categorySelect?.addEventListener('change', () => {
    applyFilters();
    syncUrl();
  });
  sortSelect?.addEventListener('change', () => {
    applySort();
    syncUrl();
  });

  function syncUrl() {
    const url = new URL(window.location.href);
    const category = categorySelect?.value;
    const sort = sortSelect?.value;
    category && category !== 'all' ? url.searchParams.set('kategori', category) : url.searchParams.delete('kategori');
    sort && sort !== 'newest' ? url.searchParams.set('sirala', sort) : url.searchParams.delete('sirala');
    history.replaceState(null, '', url);
  }

  applyFilters();
  applySort();
}
