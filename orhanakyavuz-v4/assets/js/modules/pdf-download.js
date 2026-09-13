/*
 * pdf-download.js
 * ----------------------------------------------------------------------
 * Blog/not detay sayfalarındaki içerik alanını PDF'e dönüştürür.
 * html2pdf.js kütüphanesini dinamik olarak yükler ve dosya adını
 * içerik başlığına göre oluşturur.
 * ----------------------------------------------------------------------
 */

export function initPdfDownload() {
  const header = document.querySelector('.article-header');
  const tagsBlock = header?.querySelector('.article-header__tags');
  let button = document.getElementById('download-pdf-btn');
  let content = document.getElementById('pdf-content');

  if (!content) {
    const prose = document.querySelector('.article-body .prose');
    if (prose) {
      prose.id = 'pdf-content';
      prose.classList.add('pdf-template');
      content = prose;
    }
  }

  if (!button && tagsBlock) {
    const wrapper = document.createElement('div');
    wrapper.className = 'article-header__pdf';
    button = document.createElement('button');
    button.id = 'download-pdf-btn';
    button.type = 'button';
    button.className = 'pdf-btn';
    // inject label + spinner elements for consistent UI
    button.innerHTML = '<span class="pdf-label">📄 Makaleyi PDF Olarak İndir</span><span class="pdf-spinner" aria-hidden="true"></span>';
    wrapper.appendChild(button);
    tagsBlock.insertAdjacentElement('afterend', wrapper);
  }

  // If button exists in DOM (server-rendered), ensure it has the label + spinner structure
  if (button && !button.querySelector('.pdf-label')) {
    const existingText = (button.textContent || '').trim();
    button.innerHTML = '<span class="pdf-label">' + (existingText || '📄 Makaleyi PDF Olarak İndir') + '</span><span class="pdf-spinner" aria-hidden="true"></span>';
  }

  if (!button || !content) return;

  const createFileName = () => {
    const title = content.querySelector('h1')?.textContent.trim() || 'ders-notu';
    return title
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase() + '.pdf';
  };

  const loadHtml2pdf = () => {
    if (window.html2pdf) {
      return Promise.resolve(window.html2pdf);
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      script.onload = () => {
        if (window.html2pdf) {
          resolve(window.html2pdf);
        } else {
          reject(new Error('html2pdf yüklenemedi.'));
        }
      };
      script.onerror = () => reject(new Error('html2pdf yüklenirken hata oluştu.'));
      document.head.appendChild(script);
    });
  };

  button.addEventListener('click', async () => {
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.classList.add('is-loading');
    const labelEl = button.querySelector('.pdf-label');
    const originalLabel = labelEl ? labelEl.textContent : '';
    if (labelEl) labelEl.textContent = 'Hazırlanıyor...';

    try {
      const html2pdf = await loadHtml2pdf();
      const fileName = createFileName();
      const options = {
        margin: [12, 12, 12, 12],
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      };

      await html2pdf().set(options).from(content).save();
    } catch (error) {
      console.error('PDF oluşturulamadı:', error);
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
      button.classList.remove('is-loading');
      if (labelEl) labelEl.textContent = originalLabel || '📄 Makaleyi PDF Olarak İndir';
    }
  });
}
