const AUTH_API_BASE = (window.__API_BASE__ !== undefined)
  ? window.__API_BASE__
  : (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '');

export function initAuth() {
  const page = document.querySelector('[data-auth-page]');
  if (!page) return;
  const status = page.querySelector('[data-auth-status]');
  const tabs = page.querySelectorAll('[data-auth-tab]');
  const forms = page.querySelectorAll('[data-auth-form]');

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const mode = tab.dataset.authTab;
      for (const item of tabs) {
        const active = item === tab;
        item.classList.toggle('auth-tabs__tab--active', active);
        item.setAttribute('aria-selected', String(active));
      }
      for (const form of forms) form.hidden = form.dataset.authForm !== mode;
      status.textContent = '';
      delete status.dataset.state;
    });
  }

  for (const form of forms) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const mode = form.dataset.authForm;
      const payload = Object.fromEntries(new FormData(form).entries());
      status.textContent = 'İşlemin tamamlanıyor...';
      delete status.dataset.state;
      try {
        const response = await fetch(`${AUTH_API_BASE}/api/auth/${mode}`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || 'İşlem tamamlanamadı.');
        status.textContent = result.data.requiresEmailConfirmation
          ? 'Hesabın oluşturuldu. E-postandaki doğrulama bağlantısını kullan.'
          : 'Giriş başarılı. Haftanın Problemine yönlendiriliyorsun.';
        if (!result.data.requiresEmailConfirmation) window.setTimeout(() => { window.location.href = '/haftanin-problemi/'; }, 500);
      } catch (error) {
        status.textContent = error.message;
        status.dataset.state = 'error';
      }
    });
  }
}