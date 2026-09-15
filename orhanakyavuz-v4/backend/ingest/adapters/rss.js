// backend/ingest/adapters/rss.js
// ----------------------------------------------------------------------
// Genel RSS adapter şablonu. Bağımlılık eklememek için basit regex/
// DOMParser yerine hafif tag parsing kullanılır (Node 18+ gömülü,
// XML için deneyimli olmadığından minimal extractor yazıldı).
// Gerçek kaynak eklenecekse yalnızca feedUrl ile örnek oluşturulur.
// ----------------------------------------------------------------------
import { fetchWithTimeout } from '../fetchWithTimeout.js';

/**
 * @param {string} sourceName  - content_sources.slug
 * @param {string} feedUrl     - admin tarafından tanımlanmış RSS adresi
 * @param {string} category    - varsayılan kategori
 */
export function createRssAdapter(sourceName, feedUrl, category = 'diger') {
  return {
    name: sourceName,
    sourceType: 'rss',

    async fetch() {
      const res = await fetchWithTimeout(feedUrl, { timeoutMs: 15_000 });
      const xml = await res.text();
      return parseRssItems(xml, sourceName, category);
    },
  };
}

/** Basit RSS/XML item çıkarıcı (title, link, description, pubDate). */
export function parseRssItems(xml, sourceName, category) {
  const items = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];

  for (const block of blocks) {
    const title = extractTag(block, 'title');
    const link = extractTag(block, 'link');
    if (!title || !link) continue;

    items.push({
      sourceName,
      externalId: extractTag(block, 'guid') || null,
      title,
      summary: extractTag(block, 'description') || '',
      officialUrl: link,
      category,
      publishedAt: extractTag(block, 'pubDate') || new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
    });
  }
  return items;
}

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!m) return null;
  return decodeEntities(m[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim());
}

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
