// backend/routes/newsletter.js
import { Router } from 'express';
import { supabaseAdmin } from '../services/supabase.js';
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

  const { data: existing } = await supabaseAdmin
    .from('newsletter_subscribers')
    .select('id')
    .eq('email', clean.email)
    .maybeSingle();

  if (existing) {
    // Zaten kayıtlıysa hata değil, aynı başarı sonucu döner (idempotent davranış)
    return sendSuccess(res, { alreadySubscribed: true }, 200);
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('newsletter_subscribers')
    .insert({ email: clean.email })
    .select('id')
    .single();

  if (insertError) {
    console.error('[newsletter] Supabase insert hatası:', insertError.message);
    return sendError(res, 500, 'DB_ERROR', 'Abonelik kaydedilemedi.');
  }

  let emailSent = false;
  try {
    const mailResult = await sendNewsletterWelcome(clean.email);
    emailSent = mailResult.sent;
  } catch (mailError) {
    console.error('[newsletter] Hoş geldin e-postası gönderilemedi:', mailError.message);
  }

  sendSuccess(res, {
    id: inserted.id,
    subscribed: true,
    emailNotificationSent: emailSent,
    mailerConfigured,
  }, 201);
});
