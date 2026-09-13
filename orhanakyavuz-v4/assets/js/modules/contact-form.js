/**
 * modules/contact-form.js
 * ----------------------------------------------------------------------
 * GÖREV: `pages/iletisim.html`'deki formu doğrular VE gerçek backend'e
 * (`backend/routes/contact.js` — POST /api/contact) gönderir. Sprint 6'daki
 * `newsletter-validation.js` ile bilinçli olarak AYNI görsel dili kullanır
 * (`.form-hint--error/--success`) — Sprint 2 §14 "Consistency" ilkesi.
 * ----------------------------------------------------------------------
 */
import { API_BASE_URL } from './api-config.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const nameField = form.querySelector('#contact-name');
  const emailField = form.querySelector('#contact-email');
  const messageField = form.querySelector('#contact-message');
  const submitButton = form.querySelector('button[type="submit"]');
  const statusEl = form.querySelector('[data-form-status]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const errors = [];
    if (!nameField.value.trim()) errors.push([nameField, 'Adınızı girin.']);
    if (!emailField.value.trim() || !EMAIL_PATTERN.test(emailField.value.trim())) {
      errors.push([emailField, 'Geçerli bir e-posta adresi girin.']);
    }
    if (!messageField.value.trim() || messageField.value.trim().length < 10) {
      errors.push([messageField, 'Mesajınız en az 10 karakter olmalı.']);
    }

    if (errors.length) {
      errors.forEach(([field, message]) => showFieldError(field, message));
      errors[0][0].focus();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameField.value.trim(),
          email: emailField.value.trim(),
          message: messageField.value.trim(),
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? 'İstek başarısız oldu.');
      }

      showStatus('Mesajınız alındı, en kısa sürede dönüş yapacağım.', 'success');
      form.reset();
    } catch (error) {
      // API sunucusu çalışmıyorsa (ör. yalnızca statik dosyalar önizleniyorsa)
      // `fetch` bir TypeError fırlatır — kullanıcıya bunu teknik detaya
      // boğmadan, açık bir yönlendirmeyle bildiriyoruz.
      showStatus(
        'Mesaj gönderilemedi. Backend sunucusunun çalıştığından emin olun (bkz. backend/README) veya doğrudan e-posta gönderin.',
        'error',
      );
    } finally {
      setLoading(false);
    }
  });

  function showFieldError(field, message) {
    field.classList.add('input--error', 'textarea--error');
    field.setAttribute('aria-invalid', 'true');
    const hint = document.createElement('p');
    hint.className = 'form-hint form-hint--error';
    hint.textContent = message;
    hint.id = `${field.id}-error`;
    field.setAttribute('aria-describedby', hint.id);
    field.insertAdjacentElement('afterend', hint);
  }

  function clearErrors() {
    form.querySelectorAll('.form-hint--error').forEach((el) => el.remove());
    [nameField, emailField, messageField].forEach((field) => {
      field.classList.remove('input--error', 'textarea--error');
      field.removeAttribute('aria-invalid');
    });
  }

  function showStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.hidden = false;
    statusEl.className = `form-hint ${type === 'error' ? 'form-hint--error' : 'form-hint--success'}`;
  }

  function setLoading(isLoading) {
    submitButton.classList.toggle('button--loading', isLoading);
    submitButton.disabled = isLoading;
    submitButton.setAttribute('aria-busy', String(isLoading));
  }
}
