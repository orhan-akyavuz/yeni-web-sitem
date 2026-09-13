// backend/routes/contact.js
import { Router } from 'express';
import { db } from '../db/connection.js';
import { sendSuccess, sendError } from '../middleware/response.js';
import { validateContactPayload, rateLimit } from '../middleware/validation.js';
import { sendContactNotification, mailerConfigured } from '../services/mailer.js';

export const contactRouter = Router();

const contactRateLimit = rateLimit({ windowMs: 60_000, max: 5 });

contactRouter.post('/', contactRateLimit, async (req, res) => {
  const { valid, errors, clean } = validateContactPayload(req.body);

  if (!valid) {
    return sendError(res, 422, 'VALIDATION_ERROR', JSON.stringify(errors));
  }

  const stmt = db.prepare('INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)');
  const result = stmt.run(clean.name, clean.email, clean.message);

  // Mesaj HER ZAMAN veritabanına yazılır (yukarıda) — e-posta bildirimi
  // yalnızca .env'de gerçek SMTP bilgileri varsa GERÇEKTEN gönderilir.
  // Gönderim başarısız olsa bile (ör. SMTP sunucusu geçici olarak
  // erişilemez), kullanıcıya iletişim mesajının alındığını söylemeye
  // devam ederiz — veri zaten güvende, yalnızca bildirim gecikmiş olabilir.
  let emailSent = false;
  try {
    const result = await sendContactNotification(clean);
    emailSent = result.sent;
  } catch (mailError) {
    console.error('[contact] E-posta bildirimi gönderilemedi:', mailError.message);
  }

  sendSuccess(res, {
    id: Number(result.lastInsertRowid),
    received: true,
    emailNotificationSent: emailSent,
    mailerConfigured,
  }, 201);
});
