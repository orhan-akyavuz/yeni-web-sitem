const LEVEL_OPTIONS = {
  'tyt-ayt': ['TYT Matematik', 'AYT Matematik', 'TYT + AYT'],
  ortaokul: ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf', 'LGS'],
  kpss: ['KPSS Matematik'],
  ales: ['ALES Sayısal'],
  dgs: ['DGS Sayısal'],
  diger: [],
};

const TEST_DETAILS = {
  'TYT Matematik': ['TYT Matematik Seviye Değerlendirmesi', 'TYT matematik konularındaki mevcut durumunu görmek için hazırlanmış kısa değerlendirme.', '45 dakika', '20 soru'],
  'AYT Matematik': ['AYT Matematik Seviye Değerlendirmesi', 'AYT matematik konularındaki hazırbulunuşluğunu görmek için hazırlanmış değerlendirme.', '60 dakika', '20 soru'],
  'TYT + AYT': ['TYT + AYT Matematik Değerlendirmesi', 'Temel ve ileri düzey matematik becerilerini birlikte inceleyen değerlendirme.', '75 dakika', '30 soru'],
  '5. Sınıf': ['5. Sınıf Matematik Değerlendirmesi', 'Temel matematik becerilerini ve konu hazırbulunuşluğunu görmek için hazırlanmıştır.', '30 dakika', '15 soru'],
  '6. Sınıf': ['6. Sınıf Matematik Değerlendirmesi', 'Sınıf seviyesine uygun temel matematik becerilerini inceleyen değerlendirme.', '30 dakika', '15 soru'],
  '7. Sınıf': ['7. Sınıf Matematik Değerlendirmesi', 'Konu bilgisi ve problem çözme becerilerini birlikte ölçen değerlendirme.', '35 dakika', '15 soru'],
  '8. Sınıf': ['8. Sınıf Matematik Değerlendirmesi', 'LGS hazırlığına temel oluşturacak matematik becerilerini inceleyen değerlendirme.', '40 dakika', '20 soru'],
  LGS: ['LGS Matematik Değerlendirmesi', 'LGS matematik konularındaki güçlü ve gelişime açık alanlarını görmek için hazırlanmıştır.', '45 dakika', '20 soru'],
  'KPSS Matematik': ['KPSS Matematik Değerlendirmesi', 'KPSS matematik soru tiplerine yönelik mevcut seviyeni inceleyen değerlendirme.', '45 dakika', '20 soru'],
  'ALES Sayısal': ['ALES Sayısal Değerlendirmesi', 'ALES sayısal muhakeme becerilerini görmek için hazırlanmış değerlendirme.', '45 dakika', '20 soru'],
  'DGS Sayısal': ['DGS Sayısal Değerlendirmesi', 'DGS sayısal bölümüne yönelik mevcut matematik seviyeni inceleyen değerlendirme.', '45 dakika', '20 soru'],
};

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const API_BASE = (window.__API_BASE__ !== undefined)
  ? window.__API_BASE__
  : (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '');

function renderLevels(list, options) {
  list.replaceChildren();
  for (const option of options) {
    const button = document.createElement('button');
    button.className = 'level-analysis-level-card';
    button.type = 'button';
    button.dataset.analysisLevel = option;
    button.setAttribute('aria-pressed', 'false');
    const title = document.createElement('strong');
    title.textContent = option;
    const description = document.createElement('span');
    description.textContent = 'Bu seviyeye uygun değerlendirmeyi seç';
    button.append(title, description);
    list.appendChild(button);
  }
}

function showTestDetails(page, level) {
  const details = TEST_DETAILS[level] || [`${level} Matematik Değerlendirmesi`, 'Belirttiğin seviyeye uygun özel değerlendirme.', '45 dakika', '20 soru'];
  page.querySelector('[data-analysis-test-title]').textContent = details[0];
  page.querySelector('[data-analysis-test-description]').textContent = details[1];
  page.querySelector('[data-analysis-test-duration]').textContent = details[2];
  page.querySelector('[data-analysis-test-question-count]').textContent = details[3];
}

function setupFileUpload(page) {
  const status = page.querySelector('[data-analysis-upload-status]');
  const files = new Map();
  page.querySelectorAll('[data-analysis-upload-slot]').forEach((slot) => {
    const input = slot.querySelector('input[type="file"]');
    const preview = slot.querySelector('[data-analysis-preview]');
    const index = slot.dataset.analysisUploadSlot;
    const handleFile = (file) => {
      if (!file) return;
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        status.textContent = 'Yalnızca JPG, PNG veya WEBP fotoğrafları yükleyebilirsin.';
        status.dataset.state = 'error';
        input.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        status.textContent = 'Her fotoğraf en fazla 8 MB olabilir.';
        status.dataset.state = 'error';
        input.value = '';
        return;
      }
      files.set(index, file);
      const image = document.createElement('img');
      image.alt = `${index}. çözüm sayfası önizlemesi`;
      image.src = URL.createObjectURL(file);
      preview.replaceChildren(image);
      slot.dataset.hasFile = 'true';
      status.textContent = `${files.size} çözüm sayfası hazır.`;
      delete status.dataset.state;
    };
    input.addEventListener('change', () => handleFile(input.files[0]));
    ['dragenter', 'dragover'].forEach((eventName) => slot.addEventListener(eventName, (event) => {
      event.preventDefault();
      slot.dataset.dragging = 'true';
    }));
    ['dragleave', 'drop'].forEach((eventName) => slot.addEventListener(eventName, (event) => {
      event.preventDefault();
      delete slot.dataset.dragging;
    }));
    slot.addEventListener('drop', (event) => handleFile(event.dataTransfer.files[0]));
  });

  const uploadFiles = async () => {
    const uploaded = [];
    for (const [index, file] of files) {
      const result = await new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', `${API_BASE}/api/level-analysis/uploads`);
        request.withCredentials = true;
        request.setRequestHeader('Content-Type', file.type);
        request.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) status.textContent = `Çözüm Sayfası ${index} yükleniyor: %${Math.round((event.loaded / event.total) * 100)}`;
        });
        request.addEventListener('load', () => {
          let payload;
          try { payload = JSON.parse(request.responseText); } catch { reject(new Error('Yükleme yanıtı okunamadı.')); return; }
          if (request.status < 200 || request.status >= 300) { reject(new Error(payload.error?.message || 'Fotoğraf yüklenemedi.')); return; }
          resolve(payload.data);
        });
        request.addEventListener('error', () => reject(new Error('Fotoğraf yüklenirken bağlantı hatası oluştu.')));
        request.send(file);
      });
      uploaded.push(result);
    }
    return uploaded;
  };

  return { files, uploadFiles };
}

export function initLevelAnalysis() {
  const page = document.querySelector('[data-level-analysis-page]');
  if (!page) return;

  const levelStep = page.querySelector('[data-analysis-level-step]');
  const levelList = page.querySelector('[data-analysis-level-list]');
  const customLevel = page.querySelector('[data-analysis-custom-level]');
  const status = page.querySelector('[data-analysis-level-status]');
  const studentStep = page.querySelector('[data-analysis-student-step]');
  const studentForm = page.querySelector('[data-analysis-student-form]');
  const studentStatus = page.querySelector('[data-analysis-student-status]');
  const testStep = page.querySelector('[data-analysis-test-step]');
  const submitButton = page.querySelector('[data-analysis-submit]');
  const submitStatus = page.querySelector('[data-analysis-submit-status]');
  const reportLink = page.querySelector('[data-analysis-report-link]');
  const upload = setupFileUpload(page);

  page.querySelectorAll('[data-analysis-group]').forEach((card) => {
    card.addEventListener('click', () => {
      const group = card.dataset.analysisGroup;
      page.querySelectorAll('[data-analysis-group]').forEach((item) => {
        item.setAttribute('aria-pressed', String(item === card));
      });
      sessionStorage.setItem('levelAnalysisGroup', group);
      renderLevels(levelList, LEVEL_OPTIONS[group]);
      customLevel.hidden = group !== 'diger';
      status.textContent = group === 'diger' ? 'Kendi seviyeni belirtebilirsin.' : 'Sana uygun seviyeyi seç.';
      levelStep.hidden = false;
      levelStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  levelList.addEventListener('click', (event) => {
    const card = event.target.closest('[data-analysis-level]');
    if (!card) return;
    levelList.querySelectorAll('[data-analysis-level]').forEach((item) => {
      item.setAttribute('aria-pressed', String(item === card));
    });
    sessionStorage.setItem('levelAnalysisLevel', card.dataset.analysisLevel);
    status.textContent = `${card.dataset.analysisLevel} değerlendirmesi seçildi.`;
    studentStep.hidden = false;
    studentStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  studentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    studentStatus.textContent = '';
    if (!studentForm.checkValidity()) {
      studentStatus.textContent = 'Lütfen tüm alanları doğru şekilde doldur.';
      studentStatus.dataset.state = 'error';
      studentForm.querySelector(':invalid')?.focus();
      return;
    }

    const studentData = Object.fromEntries(new FormData(studentForm).entries());
    sessionStorage.setItem('levelAnalysisStudent', JSON.stringify(studentData));
    studentStatus.textContent = 'Bilgilerin kaydedildi. Değerlendirme hazırlanıyor.';
    delete studentStatus.dataset.state;
    showTestDetails(page, sessionStorage.getItem('levelAnalysisLevel') || 'Matematik');
    testStep.hidden = false;
    testStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  submitButton.addEventListener('click', async () => {
    submitButton.disabled = true;
    submitStatus.textContent = 'Çözümlerin yükleniyor...';
    delete submitStatus.dataset.state;
    try {
      if (upload.files.size === 0) throw new Error('Lütfen en az bir çözüm fotoğrafı yükle.');
      const studentData = JSON.parse(sessionStorage.getItem('levelAnalysisStudent') || '{}');
      const uploadedFiles = await upload.uploadFiles();
      const response = await fetch(`${API_BASE}/api/level-analysis/applications`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...studentData,
          examGroup: sessionStorage.getItem('levelAnalysisGroup'),
          level: sessionStorage.getItem('levelAnalysisLevel'),
          files: uploadedFiles,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || 'Başvuru gönderilemedi.');
      submitStatus.textContent = 'Seviye analiz başvurun başarıyla alındı. Çözümlerini inceleyip matematik seviyene ilişkin detaylı değerlendirmeyi hazırlayacağız.';
      submitStatus.dataset.state = 'success';
      reportLink.hidden = false;
    } catch (error) {
      submitStatus.textContent = error.message;
      submitStatus.dataset.state = 'error';
    } finally {
      submitButton.disabled = false;
    }
  });
}