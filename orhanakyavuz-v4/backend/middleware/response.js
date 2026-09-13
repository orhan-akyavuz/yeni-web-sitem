// backend/middleware/response.js
// ----------------------------------------------------------------------
// Tüm endpoint'lerin AYNI response zarfını kullanmasını sağlar:
//   Başarı:  { "success": true,  "data": ... }
//   Hata:    { "success": false, "error": { "code": "...", "message": "..." } }
// ----------------------------------------------------------------------

export function sendSuccess(res, data, status = 200) {
  res.status(status).json({ success: true, data });
}

export function sendError(res, status, code, message) {
  res.status(status).json({ success: false, error: { code, message } });
}

/** 404 için ortak yardımcı */
export function notFound(res, resource) {
  sendError(res, 404, 'NOT_FOUND', `${resource} bulunamadı.`);
}

/** Beklenmeyen hataları yakalayan Express hata middleware'i */
export function errorHandler(err, req, res, _next) {
  console.error('[API HATASI]', err);
  sendError(res, 500, 'INTERNAL_ERROR', 'Sunucu tarafında beklenmeyen bir hata oluştu.');
}
