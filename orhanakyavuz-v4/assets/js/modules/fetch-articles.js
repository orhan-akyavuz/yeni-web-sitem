// fetch-articles.js
// Dynamically fetches articles from the backend and renders `.article-card` items
// into any <ul> that has a `data-dynamic-articles` attribute.

export async function initFetchArticles() {
  const containers = document.querySelectorAll('[data-dynamic-articles]');
  if (!containers || containers.length === 0) return;

  // "Popüler" rozetleri: görüntülenme sayısına göre en yüksek 3 sluku işaretle
  const POPULAR_LIMIT = 3;

  // API temel adresi: production'da aynı origin, geliştirmede backend portu
  const API_BASE = (window.__API_BASE__ !== undefined)
    ? window.__API_BASE__
    : (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
        ? 'http://localhost:4000'
        : '');

  // Backend erişilemezse gösterilecek statik yedek yazılar
  const FALLBACK_ARTICLES = [
    { title: 'Matematiksel Düşünme Rehberi', category: 'Akademik Yazılar', slug: 'matematiksel-dusunme-rehberi', excerpt: 'Matematiksel düşünmenin ne olduğunu, nasıl geliştirileceğini ve günlük problemlere uygulanmasını adım adım inceleyen bir rehber.', date: '2026-07-15', read_time_minutes: 8, image: '/assets/images/articles/placeholder-01.jpg' },
    { title: 'Aralıklı Tekrar Nedir?', category: 'Öğrenme', slug: 'aralikli-tekrar-nedir', excerpt: 'Beynin unutma eğrisine karşı en etkili silah: aralıklı tekrarın bilimsel temelleri ve çalışma rutinine nasıl uygulanacağı.', date: '2026-07-12', read_time_minutes: 6, image: '/assets/images/articles/placeholder-02.jpg' },
    { title: 'SQL Sorgularında Performans İpuçları', category: 'SQL', slug: 'sql-performans-ipuclari', excerpt: 'Yavaş sorguları hızlandırmak için indeks stratejileri, sorgu yeniden yazımları ve sık yapılan hatalar.', date: '2026-07-10', read_time_minutes: 4, image: '/assets/images/articles/placeholder-04.jpg' }
  ];

  for (const list of containers) {
    // keep original list role/class; we'll inject <li> items into it
    const mode = list.dataset.dynamicArticles; // 'latest' or 'all'
    const limit = parseInt(list.dataset.limit || '') || (mode === 'latest' ? 3 : undefined);

    // helper UI nodes
    const makeLoading = () => {
      const li = document.createElement('li');
      li.className = 'article-card__state article-card__state--loading';
      li.setAttribute('aria-live', 'polite');
      li.innerHTML = '<div class="article-card__state-inner">Yükleniyor…</div>';
      return li;
    };

    const makeError = (message, retryFn) => {
      const li = document.createElement('li');
      li.className = 'article-card__state article-card__state--error';
      li.setAttribute('aria-live', 'polite');
      li.innerHTML = `<div class="article-card__state-inner">${message} <button class="button button--small article-card__retry">Yeniden dene</button></div>`;
      const btn = li.querySelector('.article-card__retry');
      if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); retryFn(); });
      return li;
    };

    const makeEmpty = (text) => {
      const li = document.createElement('li');
      li.className = 'article-card__state article-card__state--empty';
      li.setAttribute('aria-live', 'polite');
      li.innerHTML = `<div class="article-card__state-inner">${text}</div>`;
      return li;
    };

    const formatDate = (iso) => {
      try {
        const d = new Date(iso);
        return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (e) {
        return iso;
      }
    };

    const buildCard = (article, isPopular = false) => {
      const li = document.createElement('li');
      const art = document.createElement('article');
      art.className = 'article-card';

      // Okuma ilerleme çubuğu (kart altında ince renkli şerit — hover'da dolar)
      const track = document.createElement('span');
      track.className = 'article-card__progress';
      track.setAttribute('aria-hidden', 'true');
      const fill = document.createElement('span');
      fill.className = 'article-card__progress-fill';
      track.appendChild(fill);

      const a = document.createElement('a');
      a.className = 'article-card__link';
      // determine href: prefer slug/permalink/url
      const href = article.url || (article.slug ? `/blog/${article.slug}/` : (article.path || '#'));      a.setAttribute('href', href);

      const img = document.createElement('img');
      img.className = 'article-card__image';
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');
      img.setAttribute('width', article.imageWidth || '376');
      img.setAttribute('height', article.imageHeight || '212');
      img.setAttribute('alt', article.imageAlt ?? '');
      img.src = article.coverImage || article.image || '/assets/images/articles/placeholder-01.jpg';

      const category = document.createElement('span');
      category.className = 'article-card__category';
      category.textContent = article.category?.name || article.category || (article.categories && article.categories[0]) || '';

      // "🔥 Popüler" rozeti (yalnızca en çok görüntülenen 3 yazıda)
      if (isPopular) {
        const pop = document.createElement('span');
        pop.className = 'article-card__popular-badge';
        pop.innerHTML = '<span aria-hidden="true">🔥</span> Popüler';
        a.appendChild(pop);
      }

      const title = document.createElement('h3');
      title.className = 'article-card__title';
      title.textContent = article.title || 'Başlıksız makale';

      const excerpt = document.createElement('p');
      excerpt.className = 'article-card__excerpt';
      excerpt.textContent = article.excerpt || article.summary || '';

      const meta = document.createElement('p');
      meta.className = 'article-card__meta';
      const time = document.createElement('time');
      time.setAttribute('datetime', article.publishedAt || article.published_at || article.date || '');
      time.textContent = formatDate(article.publishedAt || article.published_at || article.date || '');
      const readSpan = document.createElement('span');
      readSpan.textContent = (article.readMinutes ? `${article.readMinutes} dk okuma` : (article.read_time ? `${article.read_time} dk okuma` : (article.read_time_minutes ? `${article.read_time_minutes} dk okuma` : '—')));
      meta.appendChild(time);
      const dot = document.createElement('span');
      dot.setAttribute('aria-hidden', 'true');
      dot.textContent = '·';
      meta.appendChild(document.createTextNode(' '));
      meta.appendChild(dot);
      meta.appendChild(document.createTextNode(' '));
      meta.appendChild(readSpan);

      // assemble
      a.appendChild(img);
      a.appendChild(category);
      a.appendChild(title);
      a.appendChild(excerpt);
      a.appendChild(meta);
      a.appendChild(track);
      art.appendChild(a);
      li.appendChild(art);
      return li;
    };

    // perform fetch for this list
    const run = async () => {
      list.innerHTML = '';
      list.setAttribute('aria-busy', 'true');
      const loadingNode = makeLoading();
      list.appendChild(loadingNode);

      try {
        let url = `${API_BASE}/api/articles`;
        if (limit) url += `?limit=${encodeURIComponent(limit)}`;
        const res = await fetch(url, { credentials: 'same-origin' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = await res.json();
        // API zarfı: { success, data: { articles } } veya düz dizi olabilir
        const items = Array.isArray(payload)
          ? payload
          : (payload.articles || (payload.data && payload.data.articles) || []);
        list.innerHTML = '';
        if (!items || items.length === 0) {
          list.appendChild(makeEmpty('Henüz gösterilecek yazı yok.'));
        } else {
          // Görüntülenme sayısına göre en yüksek 3 sluku işaretle (popüler rozet)
          const popularSlugs = items
            .slice()
            .sort((x, y) => (y.viewCount || y.view_count || 0) - (x.viewCount || x.view_count || 0))
            .slice(0, POPULAR_LIMIT)
            .filter((a) => (a.viewCount || a.view_count || 0) > 0)
            .map((a) => a.slug);
          for (const item of items) {
            list.appendChild(buildCard(item, popularSlugs.includes(item.slug)));
          }
        }
      } catch (err) {
        console.warn('[fetch-articles] API erişilemedi, yedek içerik gösteriliyor.', err);
        list.innerHTML = '';
        const items = limit ? FALLBACK_ARTICLES.slice(0, limit) : FALLBACK_ARTICLES;
        for (const item of items) {
          list.appendChild(buildCard(item));
        }
      } finally {
        list.removeAttribute('aria-busy');
      }
    };

    // initial run
    run();
  }
}
