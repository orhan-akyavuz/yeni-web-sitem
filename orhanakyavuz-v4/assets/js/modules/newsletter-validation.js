/**
 * modules/newsletter-validation.js
 * ----------------------------------------------------------------------
 * GÖREV: `.newsletter__form`u (Abone Ol bölümü) doğrular ve gerçek
 * backend'e (`backend/routes/newsletter.js` — POST /api/newsletter)
 * gönderir. Hata/başarı mesajları Sprint 5 `components/forms.css`
 * içindeki `.form-hint`, `.form-hint--error`, `.form-hint--success`
 * sınıflarıyla gösterilir.
 * ----------------------------------------------------------------------
 */
import { API_BASE_URL } from './api-config.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initNewsletterValidation() {
  const form = document.querySelector('.newsletter__form');
  if (!form) return;

  const input = form.querySelector('.newsletter__input');
  const submitButton = form.querySelector('button[type="submit"]');
  if (!input || !submitButton) return;

  const hint = createHintElement();
  input.insertAdjacentElement('afterend', hint);
  input.setAttribute('aria-describedby', hint.id);

  // Kullanıcı yazmaya başlayınca önceki hata durumunu temizle (rahatsız etmeyen UX)
  input.addEventListener('input', () => clearHint(input, hint));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = input.value.trim();

    if (!email) {
      showHint(input, hint, 'E-posta adresinizi girin.', 'error');
      input.focus();
      return;
    }

    if (!EMAIL_PATTERN.test(email) || !input.checkValidity()) {
      showHint(input, hint, 'Lütfen geçerli bir e-posta adresi girin.', 'error');
      input.focus();
      return;
    }

    setLoading(submitButton, true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message ?? 'İstek başarısız oldu.');
      }

      const message = payload.data?.alreadySubscribed
        ? 'Bu e-posta zaten abone listesinde.'
        : 'Teşekkürler! Abonelik talebiniz alındı.';
      showHint(input, hint, message, 'success');
      form.reset();
    } catch (error) {
      showHint(input, hint, 'Bağlantı kurulamadı. Backend sunucusunun çalıştığından emin olun.', 'error');
    } finally {
      setLoading(submitButton, false);
    }
  });
}

function createHintElement() {
  const hint = document.createElement('p');
  hint.id = `newsletter-hint-${crypto.randomUUID().slice(0, 8)}`;
  // Koyu zemin (Abone Ol bölümü) üzerinde okunabilirlik: .newsletter__form
  // içindeki .form-hint'e özel renk kuralı layout/sections.css'te tanımlı.
  hint.className = 'form-hint';
  hint.setAttribute('role', 'status');
  hint.setAttribute('aria-live', 'polite');
  hint.hidden = true;
  return hint;
}

function showHint(input, hint, message, type) {
  hint.textContent = message;
  hint.hidden = false;
  hint.classList.toggle('form-hint--error', type === 'error');
  hint.classList.toggle('form-hint--success', type === 'success');
  input.classList.toggle('input--error', type === 'error');
  input.classList.toggle('input--success', type === 'success');
  input.setAttribute('aria-invalid', String(type === 'error'));
}

function clearHint(input, hint) {
  hint.hidden = true;
  hint.classList.remove('form-hint--error', 'form-hint--success');
  input.classList.remove('input--error', 'input--success');
  input.removeAttribute('aria-invalid');
}

function setLoading(button, isLoading) {
  button.classList.toggle('button--loading', isLoading);
  button.disabled = isLoading;
  button.setAttribute('aria-busy', String(isLoading));
}
