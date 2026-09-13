/**
 * modules/code-copy.js
 * ----------------------------------------------------------------------
 * GÖREV: Sprint 8 § 4.4 — `.code-block__copy` butonuna tıklanınca ilgili
 * kod bloğunun metnini panoya kopyalar, buton metnini geçici olarak
 * "Kopyalandı" yapar (2 saniye), sonra eski hâline döner.
 * ----------------------------------------------------------------------
 */

export function initCodeCopy() {
  const buttons = document.querySelectorAll('.code-block__copy');
  if (!buttons.length) return;

  buttons.forEach((button) => {
    const codeBlock = button.closest('.code-block');
    const codeEl = codeBlock?.querySelector('code');
    if (!codeEl) return;

    const label = button.querySelector('.code-block__copy-label');
    const originalText = label?.textContent ?? 'Kopyala';

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(codeEl.textContent ?? '');
        if (label) label.textContent = 'Kopyalandı ✓';
        button.setAttribute('aria-live', 'polite');
      } catch {
        if (label) label.textContent = 'Kopyalanamadı';
      } finally {
        setTimeout(() => {
          if (label) label.textContent = originalText;
        }, 2000);
      }
    });
  });
}
