// backend/services/mailer.js
// ----------------------------------------------------------------------
// GERÇEK e-posta gönderim servisi — nodemailer ile herhangi bir SMTP
// sağlayıcısına (Gmail, Resend, Mailgun, kendi sunucunuz) bağlanır.
//
// Bu bir "sahte" servis değildir: `.env` dosyasına gerçek SMTP bilgileri
// girildiği an, iletişim formu ve bülten aboneliği GERÇEKTEN e-posta
// gönderir. Ortam değişkenleri boşsa (bu proje ortamında olduğu gibi —
// gerçek bir SMTP hesabı verilmedi), servis bunu açıkça loglar ve
// gönderim adımını atlar; form gönderimi yine de veritabanına yazılmaya
// devam eder (bkz. routes/contact.js, routes/newsletter.js) — kullanıcı
// asla "işlem başarısız" görmez, veri kaybolmaz.
// ----------------------------------------------------------------------
import nodemailer from 'nodemailer';

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  CONTACT_TO_EMAIL,
} = process.env;

const isConfigured = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
} else {
  console.warn(
    '[mailer] SMTP ortam değişkenleri (.env) tanımlı değil — e-posta gönderimi ' +
    'DEVRE DIŞI. Form gönderimleri yine de veritabanına kaydediliyor. ' +
    'Etkinleştirmek için backend/.env.example dosyasına bakın.',
  );
}

/**
 * İletişim formu gönderildiğinde site sahibine bildirim e-postası yollar.
 * SMTP yapılandırılmamışsa sessizce no-op olur (hata fırlatmaz).
 */
export async function sendContactNotification({ name, email, message }) {
  if (!transporter || !CONTACT_TO_EMAIL) return { sent: false, reason: 'not_configured' };

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: CONTACT_TO_EMAIL,
    replyTo: email,
    subject: `[orhanakyavuz.com] Yeni iletişim formu mesajı — ${name}`,
    text: `Gönderen: ${name} <${email}>\n\n${message}`,
    html: `
      <p><strong>Gönderen:</strong> ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    `,
  });

  return { sent: true };
}

/** Bülten aboneliği onay e-postası gönderir. */
export async function sendNewsletterWelcome(email) {
  if (!transporter) return { sent: false, reason: 'not_configured' };

  await transporter.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: email,
    subject: 'orhanakyavuz.com bültenine hoş geldiniz',
    text: 'Aboneliğiniz alındı. Yeni yazılar yayınlandıkça haberdar olacaksınız.',
    html: '<p>Aboneliğiniz alındı. Yeni yazılar yayınlandıkça haberdar olacaksınız.</p>',
  });

  return { sent: true };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const mailerConfigured = isConfigured;
