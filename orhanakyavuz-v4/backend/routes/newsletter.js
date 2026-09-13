// backend/routes/newsletter.js
import { Router } from 'express';
import { db } from '../db/connection.js';
import { sendSuccess, sendError } from '../middleware/response.js';
import { validateNewsletterPayload, rateLimit } from '../middleware/validation.js';
import { sendNewsletterWelcome, mailerConfigured } from '../services/mailer.js';

export const newsletterRouter = Router();

const newsletterRateLimit = rateLimit({ windowMs: 60_000, max: 5 });

newsletterRouter.post('/', newsletterRateLimit, async (req, res) => {
  const { valid, errors, clean } = validateNewsletterPayload(req.body);

  if (!valid) {
    return sendError(res, 422, 'VALIDATION_ERROR', JSON.stringify(errors));
  }

  const existing = db.prepare('SELECT id FROM newsletter_subscribers WHERE email = ?').get(clean.email);
  if (existing) {
    // Zaten kayıtlıysa hata değil, aynı başarı sonucu döner (idempotent davranış)
    return sendSuccess(res, { alreadySubscribed: true }, 200);
  }

  const stmt = db.prepare('INSERT INTO newsletter_subscribers (email) VALUES (?)');
  const result = stmt.run(clean.email);

  let emailSent = false;
  try {
    const mailResult = await sendNewsletterWelcome(clean.email);
    emailSent = mailResult.sent;
  } catch (mailError) {
    console.error('[newsletter] Hoş geldin e-postası gönderilemedi:', mailError.message);
  }

  sendSuccess(res, {
    id: Number(result.lastInsertRowid),
    subscribed: true,
    emailNotificationSent: emailSent,
    mailerConfigured,
  }, 201);
});
