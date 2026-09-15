// VakifBank kariyer kaynaklarini kesfetmek icin gecici test scripti
// Kullanim: node scripts/probe-vakifbank-kaynak.js
const targets = [
  'https://www.vakifbank.com.tr/tr-tr/kariyer',
  'https://www.vakifbank.com.tr/tr-tr/kariyer',
  'https://www.vakifbank.com.tr/tr/bankamiz/hakkimizda/insan-kaynaklari/kariyer',
  'https://kariyer.vakifbank.com.tr/tr-tr/kariyer',
];

const urlRe = /https?:\/\/[^"'\s<>\\]+/gi;

for (const target of targets) {
  try {
    const res = await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await res.text();
    const urls = [...new Set((text.match(urlRe) || []))].filter((u) =>
      /api|ilan|job|position|feed|rss|json|kariyer/i.test(u)
    );
    console.log('---', target, 'status:', res.status, 'len:', text.length);
    if (urls.length) console.log(urls.slice(0, 30).join('\n'));
    else console.log('(ilgili link bulunamadi, ilk 300 karakter:)', text.slice(0, 300).replace(/\s+/g, ' '));
  } catch (err) {
    console.log('---', target, 'HATA:', err.message);
  }
}
