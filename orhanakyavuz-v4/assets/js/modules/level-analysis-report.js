const REPORT_API_BASE = (window.__API_BASE__ !== undefined) ? window.__API_BASE__ : (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '');

function renderItems(target, items) {
  target.replaceChildren();
  for (const item of Array.isArray(items) ? items : []) {
    const element = document.createElement('li');
    element.textContent = item;
    target.appendChild(element);
  }
}

export async function initLevelAnalysisReport() {
  const page = document.querySelector('[data-analysis-report-page]');
  if (!page) return;
  const status = page.querySelector('[data-report-status]');
  try {
    const response = await fetch(`${REPORT_API_BASE}/api/level-analysis/reports/latest`, { credentials: 'include' });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || 'Rapor yüklenemedi.');
    if (!payload.data.report) return;
    const data = payload.data;
    page.querySelector('[data-report-content]').hidden = false;
    page.querySelector('[data-report-level]').textContent = data.report.level_label || 'Matematik Seviye Analizi';
    page.querySelector('[data-report-assessment]').textContent = `${data.assessment?.title || ''} · Genel puan: ${data.report.overall_score ?? '-'}`;
    page.querySelector('[data-report-note]').textContent = data.report.report_text || 'Öğretmen notu eklenmedi.';
    page.querySelector('[data-report-date]').textContent = new Date(data.submission.reviewed_at || data.submission.created_at).toLocaleDateString('tr-TR');
    renderSummary(page.querySelector('[data-report-summary]'), data.topics);
    const topics = page.querySelector('[data-report-topics]');
    for (const topic of data.topics) {
      const percentage = topic.question_count ? Math.round((topic.correct_count / topic.question_count) * 100) : 0;
      const item = document.createElement('article');
      item.className = 'level-analysis-report-topic';
      item.innerHTML = `<div><strong>${topic.topic}</strong><span>%${percentage}</span></div><div class="level-analysis-report-topic__bar"><span style="width: ${percentage}%"></span></div><small>Doğru ${topic.correct_count} · Yanlış ${topic.wrong_count} · Boş ${topic.blank_count}</small>`;
      topics.appendChild(item);
    }
    renderItems(page.querySelector('[data-report-strengths]'), data.report.strengths);
    renderItems(page.querySelector('[data-report-weaknesses]'), data.report.weaknesses);
    renderItems(page.querySelector('[data-report-recommendations]'), data.report.recommendations);
    status.textContent = 'Değerlendirmen tamamlandı.';
  } catch (error) { status.textContent = error.message; }
}

function renderSummary(target, topics) {
  const totals = topics.reduce((summary, topic) => ({
    correct: summary.correct + Number(topic.correct_count || 0),
    wrong: summary.wrong + Number(topic.wrong_count || 0),
    blank: summary.blank + Number(topic.blank_count || 0),
  }), { correct: 0, wrong: 0, blank: 0 });
  const total = totals.correct + totals.wrong + totals.blank;
  const items = [['Genel başarı', total ? `${Math.round((totals.correct / total) * 100)}%` : '-'], ['Doğru', totals.correct], ['Yanlış', totals.wrong], ['Boş', totals.blank]];
  target.replaceChildren();
  for (const [label, value] of items) {
    const item = document.createElement('div');
    item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    target.appendChild(item);
  }
}