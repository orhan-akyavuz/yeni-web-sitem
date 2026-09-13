const ADMIN_LEVEL_API = (window.__API_BASE__ !== undefined) ? window.__API_BASE__ : (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '');
const ERROR_LABELS = { concept_error: 'Bilgi eksikliği', calculation_error: 'İşlem hatası', method_error: 'Yöntem hatası', careless_error: 'Dikkat hatası' };

function api(path, options = {}) {
  return fetch(`${ADMIN_LEVEL_API}/api/admin/level-analysis${path}`, { credentials: 'include', ...options }).then(async (response) => {
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || 'İşlem başarısız.');
    return payload.data;
  });
}

function renderList(page, applications) {
  const list = page.querySelector('[data-level-list]');
  list.replaceChildren();
  page.querySelector('[data-level-count]').textContent = applications.length;
  for (const application of applications) {
    const button = document.createElement('button');
    button.className = 'admin-level-item';
    button.type = 'button';
    button.innerHTML = `<strong>${application.full_name}</strong><span>${application.exam_group} · ${application.level}</span><small>${application.status} · ${new Date(application.created_at).toLocaleDateString('tr-TR')}</small>`;
    button.addEventListener('click', () => loadDetail(page, application.id));
    list.appendChild(button);
  }
}

async function loadDetail(page, id) {
  const detail = page.querySelector('[data-level-detail]');
  const data = await api(`/${id}`);
  detail.hidden = false;
  detail.querySelector('[data-detail-title]').textContent = data.application.full_name;
  detail.querySelector('[data-detail-student]').textContent = `${data.application.education_status} · ${data.application.target_exam} · ${data.application.contact_info}`;
  const files = detail.querySelector('[data-detail-files]');
  files.replaceChildren();
  for (const file of data.files) {
    const image = document.createElement('img');
    image.src = file.signedUrl || '';
    image.alt = file.file_name;
    files.appendChild(image);
  }
  renderTopics(detail, data.topics);
  const results = new Map(data.results.map((result) => [result.question_id, result]));
  const questions = detail.querySelector('[data-question-results]');
  questions.replaceChildren();
  for (const question of data.questions) {
    const row = document.createElement('fieldset');
    row.className = 'admin-question-row';
    row.innerHTML = `<legend>${question.question_number}. ${question.topic}</legend><p>${question.question_text || question.question_ref || ''}</p><select name="result-${question.id}"><option value="blank">Boş</option><option value="correct">Doğru</option><option value="wrong">Yanlış</option></select><select name="error-${question.id}"><option value="">Hata türü</option>${Object.entries(ERROR_LABELS).map(([value, label]) => `<option value="${value}">${label}</option>`).join('')}</select>`;
    const previous = results.get(question.id);
    if (previous) { row.querySelector(`[name="result-${question.id}"]`).value = previous.result; row.querySelector(`[name="error-${question.id}"]`).value = previous.error_type || ''; }
    questions.appendChild(row);
  }
  detail.querySelector('[data-review-form]').onsubmit = (event) => saveReview(event, page, id, data.questions);
}

function renderTopics(detail, topics) {
  const target = detail.querySelector('[data-detail-topics]');
  target.replaceChildren();
  for (const topic of topics) {
    const percentage = topic.question_count ? Math.round((topic.correct_count / topic.question_count) * 100) : 0;
    const item = document.createElement('p');
    item.textContent = `${topic.topic} %${percentage}`;
    target.appendChild(item);
  }
}

async function saveReview(event, page, id, questions) {
  event.preventDefault();
  const form = event.currentTarget;
  const results = questions.map((question) => ({ questionId: question.id, result: form.elements[`result-${question.id}`].value, errorType: form.elements[`error-${question.id}`].value || null, pointsEarned: form.elements[`result-${question.id}`].value === 'correct' ? question.points : 0 }));
  try {
    const saved = await api(`/${id}/questions`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ results }) });
    renderTopics(page.querySelector('[data-level-detail]'), saved.topics);
    const payload = Object.fromEntries(new FormData(form).entries());
    await api(`/${id}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    page.querySelector('[data-level-status]').textContent = 'Değerlendirme tamamlandı ve öğrenci raporu kaydedildi.';
  } catch (error) { page.querySelector('[data-level-status]').textContent = error.message; }
}

export function initAdminLevelAnalysis() {
  const page = document.querySelector('[data-admin-level-page]');
  if (!page) return;
  const load = async () => {
    const params = new URLSearchParams(new FormData(page.querySelector('[data-level-filters]')));
    try { renderList(page, (await api(`?${params}`)).applications); } catch (error) { page.querySelector('[data-level-status]').textContent = error.message; }
  };
  page.querySelector('[data-level-filters]').addEventListener('submit', (event) => { event.preventDefault(); load(); });
  load();
}