/**
 * modules/faq-accordion.js
 * ----------------------------------------------------------------------
 * BAĞLAM: Sprint 3/4'teki 11 bölümlük ana sayfa mimarisinde bir "SSS"
 * bölümü YOK. Bu modül yine de isteniyor çünkü ileride (Hakkımda sayfası,
 * bir hizmet/danışmanlık sayfası vb.) eklenmesi olası. Bu yüzden jenerik,
 * bağımsız ve kendiliğinden no-op olacak şekilde yazıldı: eşleşen markup
 * bulunmazsa hiçbir şey yapmadan çıkar — main.js'nin hangi sayfada
 * olduğunu bilmesine gerek kalmaz.
 *
 * BEKLENEN MARKUP (ileride eklenecek HTML için referans):
 * ```html
 * <div class="accordion" data-accordion>
 *   <div class="accordion__item">
 *     <h3>
 *       <button class="accordion__trigger" aria-expanded="false" aria-controls="faq-1" id="faq-1-trigger">
 *         Soru metni
 *       </button>
 *     </h3>
 *     <div class="accordion__panel" id="faq-1" role="region" aria-labelledby="faq-1-trigger" hidden>
 *       <p>Cevap metni…</p>
 *     </div>
 *   </div>
 * </div>
 * ```
 *
 * DAVRANIŞ: Tek seferde yalnızca bir panel açık kalır (klasik SSS
 * davranışı). Yükseklik animasyonu `scrollHeight` ölçülüp `0 → gerçek
 * yükseklik → auto` üç adımlı geçişle yapılır (klasik, taşma riski
 * olmayan accordion tekniği). `prefers-reduced-motion` tercihinde
 * animasyon atlanır, panel anında açılır/kapanır.
 * ----------------------------------------------------------------------
 */

export function initFaqAccordion() {
  const accordions = document.querySelectorAll('[data-accordion]');
  if (!accordions.length) return; // Ana sayfada şu an eşleşen markup yok — sessizce çık

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  accordions.forEach((accordion) => {
    const triggers = accordion.querySelectorAll('.accordion__trigger');

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', () => {
        const panel = document.getElementById(trigger.getAttribute('aria-controls'));
        if (!panel) return;

        const isOpen = trigger.getAttribute('aria-expanded') === 'true';

        // Tek panel kuralı: açılmadan önce kardeşleri kapat
        if (!isOpen) {
          triggers.forEach((otherTrigger) => {
            if (otherTrigger !== trigger) {
              closePanel(otherTrigger, prefersReducedMotion);
            }
          });
        }

        isOpen ? closePanel(trigger, prefersReducedMotion) : openPanel(trigger, prefersReducedMotion);
      });
    });
  });
}

function openPanel(trigger, prefersReducedMotion) {
  const panel = document.getElementById(trigger.getAttribute('aria-controls'));
  if (!panel) return;

  trigger.setAttribute('aria-expanded', 'true');
  panel.removeAttribute('hidden');

  if (prefersReducedMotion) return;

  const targetHeight = panel.scrollHeight;
  panel.style.overflow = 'hidden';
  panel.style.height = '0px';
  panel.style.transition = 'height 250ms ease-out';

  requestAnimationFrame(() => {
    panel.style.height = `${targetHeight}px`;
  });

  panel.addEventListener(
    'transitionend',
    () => {
      panel.style.height = 'auto'; // içerik değişse bile taşma olmasın
    },
    { once: true },
  );
}

function closePanel(trigger, prefersReducedMotion) {
  const panel = document.getElementById(trigger.getAttribute('aria-controls'));
  if (!panel) return;

  trigger.setAttribute('aria-expanded', 'false');

  if (prefersReducedMotion) {
    panel.setAttribute('hidden', '');
    return;
  }

  const currentHeight = panel.scrollHeight;
  panel.style.height = `${currentHeight}px`; // 'auto'dan animasyon başlatılamaz, önce sabit değere geç
  panel.style.overflow = 'hidden';
  panel.style.transition = 'height 200ms ease-out'; // kapanış açılıştan hızlı — Sprint 2 §12 kuralı

  requestAnimationFrame(() => {
    panel.style.height = '0px';
  });

  panel.addEventListener(
    'transitionend',
    () => {
      panel.setAttribute('hidden', '');
    },
    { once: true },
  );
}
