const API_BASE = (window.__API_BASE__ !== undefined)
  ? window.__API_BASE__
  : (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '');

function renderMath(root) {
  if (typeof window.renderMathInElement !== 'function') return;
  window.renderMathInElement(root, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '$', right: '$', display: false },
      { left: '\\(', right: '\\)', display: false },
      { left: '\\[', right: '\\]', display: true },
    ],
    throwOnError: false,
  });
}

function renderLeaderboard(items, list) {
  list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement('li');
    empty.className = 'weekly-leaderboard__state';
    empty.textContent = 'Henüz puan kazanan yok.';
    list.appendChild(empty);
    return;
  }

  for (const leader of items) {
    const item = document.createElement('li');
    item.className = 'weekly-leaderboard__item';
    const rank = document.createElement('span');
    rank.className = 'weekly-leaderboard__rank';
    rank.textContent = String(leader.rank).padStart(2, '0');
    const name = document.createElement('span');
    name.className = 'weekly-leaderboard__name';
    name.textContent = leader.name;
    const solved = document.createElement('span');
    solved.className = 'weekly-leaderboard__solved';
    solved.textContent = `${leader.solved_count} çözüm`;
    name.appendChild(solved);
    const score = document.createElement('strong');
    score.className = 'weekly-leaderboard__score';
    score.textContent = `${leader.score} puan`;
    item.append(rank, name, score);
    list.appendChild(item);
  }
}

async function loadProgress(page) {
  const list = page.querySelector('[data-leaderboard]');
  try {
    const response = await fetch(`${API_BASE}/api/leaderboard`);
    const payload = await response.json();
    renderLeaderboard(payload.data?.leaders || [], list);
  } catch {
    list.replaceChildren();
    const error = document.createElement('li');
    error.className = 'weekly-leaderboard__state';
    error.textContent = 'Sıralama şu anda yüklenemiyor.';
    list.appendChild(error);
  }

  const progress = page.querySelector('[data-my-progress]');
  try {
    const response = await fetch(`${API_BASE}/api/leaderboard/me`, {
      credentials: 'include',
    });
    if (!response.ok) return;
    const payload = await response.json();
    const data = payload.data;
    page.querySelector('[data-my-score]').textContent = data.score;
    page.querySelector('[data-my-streak]').textContent = data.streak.current_streak;
    const badges = page.querySelector('[data-my-badges]');
    for (const badge of data.badges) {
      const badgeElement = document.createElement('span');
      badgeElement.className = 'weekly-progress-card__badge';
      badgeElement.textContent = `${badge.icon} ${badge.name}`;
      badges.appendChild(badgeElement);
    }
    progress.hidden = false;
  } catch {
    // Özel ilerleme isteği başarısız olsa da public liderlik tablosu kullanılabilir.
  }
}

function formatRemaining(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return days > 0
    ? `${days}g ${String(hours).padStart(2, '0')}sa`
    : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

export async function initWeeklyProblem() {
  const page = document.querySelector('[data-weekly-problem-page]');
  if (!page) return;

  loadProgress(page);

  const status = page.querySelector('[data-form-status]');
  const form = page.querySelector('[data-problem-form]');
  let problem;

  try {
    const response = await fetch(`${API_BASE}/api/weekly-problems/active`, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    problem = payload.data?.problem;
    if (!problem) throw new Error('Problem bulunamadı');
  } catch (error) {
    page.querySelector('[data-problem-content]').innerHTML = '<p>Bu hafta için yayınlanmış bir problem bulunmuyor. Yeni problem yayınlandığında burada görünecek.</p>';
    page.querySelector('[data-problem-countdown]').textContent = '--:--:--';
    return;
  }

  page.querySelector('[data-problem-title]').textContent = problem.title;
  page.querySelector('[data-problem-topic]').textContent = problem.topic;
  page.querySelector('[data-problem-grade]').textContent = problem.grade_level;
  const difficulty = { easy: '★☆☆', medium: '★★☆', hard: '★★★' }[problem.difficulty] || '★☆☆';
  page.querySelector('[data-problem-difficulty]').textContent = difficulty;
  page.querySelector('[data-problem-difficulty]').setAttribute('aria-label', `Zorluk: ${problem.difficulty}`);
  page.querySelector('[data-problem-content]').textContent = problem.problem_content;
  renderMath(page.querySelector('[data-problem-content]'));

  const countdown = page.querySelector('[data-problem-countdown]');
  const updateCountdown = () => {
    const remaining = new Date(problem.ends_at).getTime() - Date.now();
    countdown.textContent = formatRemaining(remaining);
    if (remaining <= 0) {
      countdown.textContent = 'Süre doldu';
      form.querySelector('button[type="submit"]').disabled = true;
      return false;
    }
    return true;
  };
  updateCountdown();
  const interval = window.setInterval(() => {
    if (!updateCountdown()) window.clearInterval(interval);
  }, 1000);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    status.textContent = 'Cevabın kontrol ediliyor...';
    status.dataset.state = '';
    try {
      const response = await fetch(`${API_BASE}/api/weekly-problems/${problem.id}/submissions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: form.elements.answer.value,
          solution: form.elements.solution.value,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Gönderim başarısız.');
      status.textContent = payload.data.isCorrect
        ? `Doğru cevap. ${payload.data.score} puan kazandın.`
        : 'Cevabın gönderildi. Bu cevap doğru değil.';
      status.dataset.state = payload.data.isCorrect ? 'success' : 'error';
    } catch (error) {
      status.textContent = error.message;
      status.dataset.state = 'error';
    } finally {
      button.disabled = false;
    }
  });
}