// backend/middleware/validation.js
// ----------------------------------------------------------------------
// Harici bir validasyon kütüphanesi (joi/zod vb.) eklemeden, bu projenin
// ihtiyaç duyduğu iki form (iletişim, bülten) için yeterli, elle yazılmış
// doğrulama kuralları.
// ----------------------------------------------------------------------

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactPayload(body) {
  const errors = {};
  const name = (body?.name ?? '').toString().trim();
  const email = (body?.email ?? '').toString().trim();
  const message = (body?.message ?? '').toString().trim();

  if (!name) errors.name = 'Ad Soyad zorunludur.';
  else if (name.length > 120) errors.name = 'Ad Soyad çok uzun.';

  if (!email) errors.email = 'E-posta zorunludur.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Geçerli bir e-posta adresi girin.';

  if (!message) errors.message = 'Mesaj zorunludur.';
  else if (message.length < 10) errors.message = 'Mesaj en az 10 karakter olmalı.';
  else if (message.length > 5000) errors.message = 'Mesaj çok uzun (maks. 5000 karakter).';

  return { valid: Object.keys(errors).length === 0, errors, clean: { name, email, message } };
}

export function validateNewsletterPayload(body) {
  const errors = {};
  const email = (body?.email ?? '').toString().trim().toLowerCase();

  if (!email) errors.email = 'E-posta zorunludur.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Geçerli bir e-posta adresi girin.';

  return { valid: Object.keys(errors).length === 0, errors, clean: { email } };
}

export function validateSubmissionPayload(body) {
  const errors = {};
  const answer = (body?.answer ?? '').toString().trim();
  const solution = body?.solution == null ? '' : body.solution.toString().trim();

  if (!answer) errors.answer = 'Cevap zorunludur.';
  else if (answer.length > 2000) errors.answer = 'Cevap çok uzun.';
  if (solution.length > 10000) errors.solution = 'Çözüm açıklaması çok uzun.';

  return { valid: Object.keys(errors).length === 0, errors, clean: { answer, solution } };
}

export function validateWeeklyProblemPayload(body) {
  const errors = {};
  const clean = {
    slug: (body?.slug ?? '').toString().trim().toLowerCase(),
    title: (body?.title ?? '').toString().trim(),
    problemContent: (body?.problemContent ?? '').toString().trim(),
    solutionContent: (body?.solutionContent ?? '').toString().trim(),
    topic: (body?.topic ?? '').toString().trim(),
    gradeLevel: (body?.gradeLevel ?? '').toString().trim(),
    difficulty: (body?.difficulty ?? '').toString().trim(),
    answerKey: (body?.answerKey ?? '').toString().trim(),
    publishedAt: (body?.publishedAt ?? '').toString().trim(),
    endsAt: (body?.endsAt ?? '').toString().trim(),
    status: (body?.status ?? 'draft').toString().trim(),
  };

  for (const [key, label] of [['slug', 'Slug'], ['title', 'Başlık'], ['problemContent', 'Problem metni'], ['topic', 'Konu'], ['gradeLevel', 'Seviye'], ['answerKey', 'Cevap anahtarı'], ['publishedAt', 'Yayın tarihi'], ['endsAt', 'Bitiş tarihi']]) {
    if (!clean[key]) errors[key] = `${label} zorunludur.`;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(clean.slug)) errors.slug = 'Slug yalnızca küçük harf, rakam ve tire içerebilir.';
  if (!['easy', 'medium', 'hard'].includes(clean.difficulty)) errors.difficulty = 'Geçersiz zorluk.';
  if (!['draft', 'published', 'archived'].includes(clean.status)) errors.status = 'Geçersiz durum.';
  if (clean.title.length > 180) errors.title = 'Başlık çok uzun.';
  if (clean.problemContent.length > 50000) errors.problemContent = 'Problem metni çok uzun.';
  if (clean.solutionContent.length > 50000) errors.solutionContent = 'Çözüm metni çok uzun.';

  return { valid: Object.keys(errors).length === 0, errors, clean };
}

export function validateCurrentUpdatePayload(body) {
  const errors = {};
  const clean = {
    sourceId: Number(body?.sourceId),
    title: (body?.title ?? '').toString().trim(),
    summary: (body?.summary ?? '').toString().trim(),
    originalUrl: (body?.originalUrl ?? '').toString().trim(),
    category: (body?.category ?? '').toString().trim().toLowerCase(),
    publishDate: (body?.publishDate ?? new Date().toISOString()).toString().trim(),
    status: (body?.status ?? 'published').toString().trim().toLowerCase(),
    isFeatured: Boolean(body?.isFeatured),
    externalId: (body?.externalId ?? '').toString().trim() || null,
  };

  if (!Number.isSafeInteger(clean.sourceId) || clean.sourceId < 1) {
    errors.sourceId = 'Geçerli bir resmî kaynak seçilmelidir.';
  }
  if (!clean.title) {
    errors.title = 'Başlık zorunludur.';
  } else if (clean.title.length > 250) {
    errors.title = 'Başlık çok uzun (en fazla 250 karakter).';
  }

  if (!clean.originalUrl) {
    errors.originalUrl = 'Resmî içerik adresi (URL) zorunludur.';
  } else {
    try {
      const parsedUrl = new URL(clean.originalUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        errors.originalUrl = 'Resmî içerik adresi http veya https protokolüyle başlamalıdır.';
      }
    } catch {
      errors.originalUrl = 'Lütfen geçerli bir internet adresi (URL) girin.';
    }
  }

  const validCategories = ['banka', 'kamu', 'ags', 'kpss', 'ales', 'dgs', 'egitim', 'diger'];
  if (!clean.category) {
    errors.category = 'Kategori zorunludur.';
  } else if (!validCategories.includes(clean.category)) {
    errors.category = `Geçersiz kategori. İzin verilenler: ${validCategories.join(', ')}`;
  }

  const validStatuses = ['draft', 'published', 'archived'];
  if (!validStatuses.includes(clean.status)) {
    errors.status = `Geçersiz durum. İzin verilenler: ${validStatuses.join(', ')}`;
  }

  if (clean.publishDate && isNaN(Date.parse(clean.publishDate))) {
    errors.publishDate = 'Geçersiz yayın tarihi.';
  }

  return { valid: Object.keys(errors).length === 0, errors, clean };
}

/**
 * Çok basit, bağımlılıksız bir "sabit pencere" rate limiter.
 * IP başına dakikada `max` istekle sınırlar — üretimde Redis tabanlı bir
 * çözüme yükseltilebilir, ama tek sunuculu küçük bir kişisel site için
 * bellek içi bir Map yeterlidir.
 */
export function rateLimit({ windowMs = 60_000, max = 5 } = {}) {
  const hits = new Map();

  return (req, res, next) => {
    const key = req.ip ?? 'unknown';
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      hits.set(key, { windowStart: now, count: 1 });
      return next();
    }

    if (entry.count >= max) {
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMITED', message: 'Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar deneyin.' },
      });
    }

    entry.count += 1;
    next();
  };
}
