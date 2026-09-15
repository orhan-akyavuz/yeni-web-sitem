// backend/ingest/fetchWithTimeout.js
// ----------------------------------------------------------------------
// Güvenli fetch yardımcıları: timeout, retry, basit rate limit ve SSRF
// koruması. Yalnızca admin tarafından tanımlanmış kaynaklar kullanılır;
// kullanıcıdan gelen URL asla buradan fetch edilmez.
// ----------------------------------------------------------------------
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 1_000;
const DEFAULT_MIN_HOST_INTERVAL_MS = 500;

/** Aynı anda en fazla MAX_CONCURRENT fetch; basit rate limit için sayaç. */
const MAX_CONCURRENT = 3;
let inFlight = 0;
const queue = [];
const lastRequestByHost = new Map();

function acquire() {
  if (inFlight < MAX_CONCURRENT) {
    inFlight += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => queue.push(resolve));
}

function release() {
  inFlight -= 1;
  const next = queue.shift();
  if (next) {
    inFlight += 1;
    next();
  }
}

/**
 * SSRF koruması: yalnızca http/https, hostname IP'ye çözümlendiğinde
 * private/loopback/link-local aralıklarına düşmüyorsa izin ver.
 */
export function assertSafeUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Geçersiz URL: ${rawUrl}`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`İzin verilmeyen protokol: ${url.protocol}`);
  }
  const host = url.hostname;
  if (isIP(host)) {
    assertNotPrivateIp(host);
  } else {
    // fetch öncesi DNS kontrolü (DNS rebinding'a karşı ilk savunma)
    return lookup(host, { all: true }).then((addresses) => {
      for (const { address } of addresses) assertNotPrivateIp(address);
      return url;
    });
  }
  return Promise.resolve(url);
}

function assertNotPrivateIp(ip) {
  if (ip.startsWith('::ffff:')) return assertNotPrivateIp(ip.slice(7));
  if (ip === '::' || ip === '::1' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) {
    throw new Error(`SSRF koruması: private/loopback adres engellendi (${ip})`);
  }
  if (isIP(ip) === 6) return;
  const parts = ip.split('.').map(Number);
  const isPrivate =
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168) ||
    parts[0] === 127 ||
    parts[0] === 169 && parts[1] === 254 ||
    parts[0] === 0;
  if (isPrivate) {
    throw new Error(`SSRF koruması: private/loopback adres engellendi (${ip})`);
  }
}

async function waitForHostSlot(rawUrl, minIntervalMs) {
  const host = new URL(rawUrl).host;
  const now = Date.now();
  const waitMs = Math.max(0, (lastRequestByHost.get(host) || 0) + minIntervalMs - now);
  if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
  lastRequestByHost.set(host, Date.now());
}

/**
 * Timeout + retry destekli güvenli fetch.
 * @param {string} rawUrl
 * @param {{timeoutMs?: number, retries?: number, retryDelayMs?: number, minHostIntervalMs?: number, redirectCount?: number, headers?: Object}} opts
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(rawUrl, opts = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    minHostIntervalMs = DEFAULT_MIN_HOST_INTERVAL_MS,
    redirectCount = 0,
    headers = {},
  } = opts;

  await assertSafeUrl(rawUrl);

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    await acquire();
    let redirectedUrl = null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      await waitForHostSlot(rawUrl, minHostIntervalMs);
      const res = await fetch(rawUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': 'orhanakyavuz-ingest/1.0', ...headers },
      });
      // Redirect targets must pass the same allow-list and DNS checks. We do
      // not follow them implicitly because that would bypass SSRF controls.
      if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
        redirectedUrl = new URL(res.headers.get('location'), rawUrl).toString();
        await assertSafeUrl(redirectedUrl);
      }
      if (redirectedUrl) {
        // The recursive request starts only after this request releases its
        // concurrency slot in finally.
      } else if (!res.ok && attempt < retries && res.status >= 500) {
        lastError = new Error(`HTTP ${res.status} from ${rawUrl}`);
      } else if (!res.ok) {
        throw new Error(`HTTP ${res.status} from ${rawUrl}`);
      } else {
        return res;
      }
    } catch (err) {
      lastError = err;
    } finally {
      clearTimeout(timer);
      release();
    }
    if (redirectedUrl) {
      if (redirectCount >= 3) throw new Error(`Too many redirects from ${rawUrl}`);
      return fetchWithTimeout(redirectedUrl, { ...opts, retries: 0, redirectCount: redirectCount + 1 });
    }
    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, retryDelayMs * (attempt + 1)));
    }
  }
  throw lastError || new Error(`fetch başarısız: ${rawUrl}`);
}
