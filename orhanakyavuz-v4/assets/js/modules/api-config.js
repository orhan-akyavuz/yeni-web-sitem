/**
 * modules/api-config.js
 * ----------------------------------------------------------------------
 * Backend API'nin taban adresi. Site şu an statik dosyalar olarak
 * (Sprint 4-14) servis ediliyor, backend ise ayrı bir Node/Express
 * sürecinde (`backend/`, varsayılan port 4000) çalışıyor — bu yüzden
 * tek bir ortak sabit üzerinden yönetiliyor.
 *
 * Üretimde (API ile frontend aynı domain'de, ör. `/api/...` proxy'siyle
 * yayınlandığında) bu değer boş string'e çekilebilir; yerel geliştirmede
 * `http://localhost:4000` kullanılır.
 * ----------------------------------------------------------------------
 */
export const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:4000'
    : 'https://orhanakyavuz-api.onrender.com';
