const ARCHIVE_API_BASE = (window.__API_BASE__ !== undefined)
  ? window.__API_BASE__
  : (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '');

function archiveDifficulty(value) {
  return { easy: '★☆☆', medium: '★★☆', hard: '★★★' }[value] || '★☆☆';
}

function archiveDate(value) {
  return new Date(value).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function renderArchive(problems, list) {
  list.replaceChildren();
  if (!problems.length) {
    const empty = document.createElement('p');
    empty.className = 'weekly-archive-empty';
    empty.textContent = 'Bu filtrelerle eşleşen bir problem bulunamadı.';
    list.appendChild(empty);
    return;
  }
  for (const problem of problems) {
    const card = document.createElement('article');
    card.className = 'weekly-archive-card';
    const top = document.createElement('div');
    top.className = 'weekly-archive-card__top';
    const topic = document.createElement('span');
    topic.className = 'weekly-archive-card__topic';
    topic.textContent = problem.topic;
    const difficulty = document.createElement('span');
    difficulty.className = 'weekly-archive-card__difficulty';
    difficulty.textContent = archiveDifficulty(problem.difficulty);
    difficulty.setAttribute('aria-label', `Zorluk: ${problem.difficulty}`);
    top.append(topic, difficulty);
    const title = document.createElement('h2');
    title.className = 'weekly-archive-card__title';
    title.textContent = problem.title;
    const meta = document.createElement('p');
    meta.className = 'weekly-archive-card__meta';
    meta.textContent = `${problem.grade_level} · ${archiveDate(problem.published_at)}`;
    card.append(top, title, meta);
    list.appendChild(card);
  }
}

export function initWeeklyArchive() {
  const page = document.querySelector('[data-weekly-archive-page]');
  if (!page) return;
  const form = page.querySelector('[data-archive-filters]');
  const list = page.querySelector('[data-archive-list]');
  const count = page.querySelector('[data-archive-count]');
  const fields = ['year', 'topic', 'difficulty'];

  const load = async () => {
    const params = new URLSearchParams();
    for (const field of fields) {
      const value = form.elements[field].value.trim();
      if (value) params.set(field, value);
    }
    const url = `${ARCHIVE_API_BASE}/api/weekly-problems/archive?${params}`;
    try {
      const response = await fetch(url);
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error('Arşiv yüklenemedi.');
      renderArchive(payload.data.problems, list);
      count.textContent = `${payload.data.pagination.total} problem bulundu`;
      history.replaceState(null, '', params.toString() ? `?${params}` : location.pathname);
    } catch (error) {
      list.textContent = error.message;
      count.textContent = '';
    }
  };

  const initial = new URLSearchParams(location.search);
  for (const field of fields) {
    if (initial.has(field)) form.elements[field].value = initial.get(field);
  }
  form.addEventListener('submit', (event) => { event.preventDefault(); load(); });
  page.querySelector('[data-archive-clear]').addEventListener('click', () => { form.reset(); load(); });
  load();
}