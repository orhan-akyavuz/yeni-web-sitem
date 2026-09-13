// Blog yazı sayfalarına Article (BlogPosting) JSON-LD ekler.
// Kullanım: node scripts/add-article-jsonld.mjs
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const blogDir = join(process.cwd(), 'blog');
const BASE = 'https://orhanakyavuz.com';

const decode = (s) => s
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

const match = (html, re) => { const m = html.match(re); return m ? m[1].trim() : null; };

for (const slug of readdirSync(blogDir)) {
  const file = join(blogDir, slug, 'index.html');
  if (!existsSync(file)) continue;
  let html = readFileSync(file, 'utf8');
  if (html.includes('"@type": "BlogPosting"')) {
    console.log('atlandı (zaten var):', slug);
    continue;
  }

  const title = decode(match(html, /<title>([^<]*)<\/title>/) || slug);
  const description = decode(match(html, /<meta\s+name="description"\s+content="([^"]*)"/) || '');
  const url = `${BASE}/blog/${slug}/`;
  const date = match(html, /<time\s+datetime="(\d{4}-\d{2}-\d{2})"/) || new Date().toISOString().slice(0, 10);

  const jsonld = `  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": ${JSON.stringify(title)},
    "description": ${JSON.stringify(description)},
    "url": "${url}",
    "mainEntityOfPage": { "@type": "WebPage", "@id": "${url}" },
    "image": "${BASE}/assets/images/og/og-cover.jpg",
    "datePublished": "${date}",
    "dateModified": "${date}",
    "inLanguage": "tr-TR",
    "author": {
      "@type": "Person",
      "name": "Orhan Akyavuz",
      "url": "${BASE}/"
    },
    "publisher": {
      "@type": "Person",
      "name": "Orhan Akyavuz",
      "url": "${BASE}/"
    }
  }
  </script>
</head>`;

  html = html.replace('</head>', jsonld);
  writeFileSync(file, html, 'utf8');
  console.log('eklendi:', slug);
}
console.log('Bitti.');
