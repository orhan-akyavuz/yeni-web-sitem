import assert from 'node:assert/strict';
import test from 'node:test';
import { computeDedupHash, normalizeItem, validateItem } from './normalizer.js';
import { parseRssItems } from './adapters/rss.js';

test('RSS entries are mapped to the common item format', () => {
  const items = parseRssItems(`<?xml version="1.0"?><rss><channel><item>
    <title><![CDATA[Resmî duyuru]]></title><link>https://example.gov.tr/duyuru/1</link>
    <guid>notice-1</guid><description>Özet</description><pubDate>2026-09-15</pubDate>
  </item></channel></rss>`, 'example-kurum', 'kamu');
  assert.equal(items.length, 1);
  const item = validateItem(normalizeItem(items[0], 'example-kurum'));
  assert.equal(item.sourceName, 'example-kurum');
  assert.equal(item.externalId, 'notice-1');
  assert.equal(item.officialUrl, 'https://example.gov.tr/duyuru/1');
});

test('same external identifier produces the same dedup hash', () => {
  const first = normalizeItem({ sourceName: 'example', externalId: 'a-1', title: 'Bir duyuru', officialUrl: 'https://example.gov.tr/a', category: 'kamu' });
  const second = normalizeItem({ sourceName: 'example', externalId: 'a-1', title: 'Başlık değişti', officialUrl: 'https://example.gov.tr/b', category: 'kamu' });
  assert.equal(computeDedupHash(first), computeDedupHash(second));
});

test('invalid official URLs are rejected before persistence', () => {
  const item = normalizeItem({ sourceName: 'example', title: 'Geçerli başlık', officialUrl: 'file:///etc/passwd', category: 'kamu' });
  assert.throws(() => validateItem(item), /officialUrl/);
});
