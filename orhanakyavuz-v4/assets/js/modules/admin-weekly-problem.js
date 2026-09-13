const ADMIN_API_BASE = (window.__API_BASE__ !== undefined)
  ? window.__API_BASE__
  : (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '');

function adminHeaders(json = false) {
  const headers = {};
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

function adminMessage(node, text, state = '') {
  node.textContent = text;
  node.dataset.state = state;
}

function problemPayload(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function renderAdminProblems(problems, list, count, onSelect, onDelete, onSubmissions) {
  list.replaceChildren();
  count.textContent = problems.length;
  if (!problems.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Henüz problem eklenmedi.';
    list.appendChild(empty);
    return;
  }
  for (const problem of problems) {
    const item = document.createElement('article');
    item.className = 'admin-problem-item';
    const top = document.createElement('div');
    top.className = 'admin-problem-item__top';
    const title = document.createElement('h3');
    title.className = 'admin-problem-item__title';
    title.textContent = problem.title;
    const state = document.createElement('span');
    state.className = 'admin-problem-item__status';
    state.textContent = problem.status;
    top.append(title, state);
    const meta = document.createElement('p');
    meta.className = 'admin-problem-item__meta';
    meta.textContent = `${problem.topic} · ${problem.grade_level} · ${problem.difficulty}`;
    const actions = document.createElement('div');
    actions.className = 'admin-problem-item__actions';
    const edit = document.createElement('button');
    edit.className = 'button button--small button--outline';
    edit.type = 'button';
    edit.textContent = 'Düzenle';
    edit.addEventListener('click', () => onSelect(problem));
    const submissions = document.createElement('button');
    submissions.className = 'button button--small button--secondary';
    submissions.type = 'button';
    submissions.textContent = 'Gönderileri gör';
    submissions.addEventListener('click', () => onSubmissions(problem.id));
    const remove = document.createElement('button');
    remove.className = 'button button--small button--danger';
    remove.type = 'button';
    remove.textContent = 'Sil';
    remove.addEventListener('click', () => onDelete(problem.id));
    actions.append(edit, submissions, remove);
    item.append(top, meta, actions);
    list.appendChild(item);
  }
}

export async function initAdminWeeklyProblem() {
  const page = document.querySelector('[data-admin-weekly-page]');
  if (!page) return;
  const status = page.querySelector('[data-admin-status]');
  const form = page.querySelector('[data-admin-form]');
  const list = page.querySelector('[data-admin-list]');
  const count = page.querySelector('[data-admin-count]');
  let problems = [];

  const loadProblems = async () => {
    const response = await fetch(`${ADMIN_API_BASE}/api/admin/weekly-problems`, { credentials: 'include', headers: adminHeaders() });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || 'Problemler yüklenemedi.');
    problems = payload.data.problems;
    renderAdminProblems(problems, list, count, selectProblem, deleteProblem, loadSubmissions);
  };

  const selectProblem = (problem) => {
    for (const [key, value] of Object.entries({ ...problem, problemContent: problem.problem_content, solutionContent: problem.solution_content, gradeLevel: problem.grade_level, answerKey: problem.answer_key, publishedAt: problem.published_at, endsAt: problem.ends_at })) {
      const field = form.elements[key];
      if (field) field.value = value ?? '';
    }
    form.elements.id.value = problem.id;
    status.textContent = 'Problem düzenleme için yüklendi.';
  };

  const deleteProblem = async (id) => {
    const response = await fetch(`${ADMIN_API_BASE}/api/admin/weekly-problems/${id}`, { method: 'DELETE', credentials: 'include', headers: adminHeaders() });
    if (!response.ok) throw new Error('Problem silinemedi.');
    await loadProblems();
    adminMessage(status, 'Problem silindi.');
  };

  const loadSubmissions = async (id) => {
    const response = await fetch(`${ADMIN_API_BASE}/api/admin/weekly-problems/${id}/submissions`, { credentials: 'include', headers: adminHeaders() });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || 'Gönderiler yüklenemedi.');
    const panel = page.querySelector('[data-admin-submissions]');
    const target = page.querySelector('[data-admin-submission-list]');
    target.replaceChildren();
    for (const submission of payload.data.submissions) {
      const item = document.createElement('article');
      item.className = 'admin-submission-item';
      const answer = document.createElement('p');
      answer.className = 'admin-submission-item__answer';
      answer.textContent = `${submission.display_name}: ${submission.answer_text}`;
      const solution = document.createElement('p');
      solution.className = 'admin-submission-item__solution';
      solution.textContent = submission.solution_text || 'Açıklamalı çözüm yok.';
      const actions = document.createElement('div');
      actions.className = 'admin-submission-item__actions';
      for (const [label, correct] of [['Doğru olarak işaretle', true], ['Yanlış olarak işaretle', false]]) {
        const button = document.createElement('button');
        button.className = 'button button--small button--outline';
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', async () => {
          await fetch(`${ADMIN_API_BASE}/api/admin/weekly-problems/${id}/submissions/${submission.id}`, { method: 'PATCH', credentials: 'include', headers: adminHeaders(true), body: JSON.stringify({ isCorrect: correct, hasExplanation: Boolean(submission.solution_text) }) });
          adminMessage(status, 'Gönderi değerlendirildi.');
        });
        actions.appendChild(button);
      }
      if (submission.solution_text) {
        const highlight = document.createElement('button');
        highlight.className = 'button button--small button--primary';
        highlight.type = 'button';
        highlight.textContent = 'Haftanın Çözümü yap';
        highlight.addEventListener('click', async () => {
          await fetch(`${ADMIN_API_BASE}/api/admin/weekly-problems/${id}/highlight`, { method: 'POST', credentials: 'include', headers: adminHeaders(true), body: JSON.stringify({ submissionId: submission.id }) });
          adminMessage(status, 'Çözüm öne çıkarıldı.');
        });
        actions.appendChild(highlight);
      }
      item.append(answer, solution, actions);
      target.appendChild(item);
    }
    panel.hidden = false;
  };

  try {
    await loadProblems();
  } catch (error) {
    adminMessage(status, error.message, 'error');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = problemPayload(form);
    const id = data.id;
    delete data.id;
    try {
      const response = await fetch(`${ADMIN_API_BASE}/api/admin/weekly-problems${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', credentials: 'include', headers: adminHeaders(true), body: JSON.stringify(data) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Problem kaydedilemedi.');
      form.reset();
      await loadProblems();
      adminMessage(status, 'Problem kaydedildi.');
    } catch (error) {
      adminMessage(status, error.message, 'error');
    }
  });

  page.querySelector('[data-admin-reset]').addEventListener('click', () => form.reset());
}