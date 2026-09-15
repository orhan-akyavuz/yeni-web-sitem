// VakifBank kariyer sayfasindaki JS kaynaklarini ve API ipuclarini arar.
const targets = [
  'https://kariyer.vakifbank.com.tr/tr-tr',
  'https://apigw.vakifbank.com.tr/vibi/bot/js/widget/cbot-vakifbank-generator.min.js',
];

(async () => {
  for (const u of targets) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const t = await r.text();
      console.log('---', u, r.status, 'len', t.length);
      const m = t.match(/https?:\/\/[^"'<> ]+/g) || [];
      const hits = m.filter((x) => /kariyer|job|ilan|api|rss|feed/i.test(x));
      console.log(hits.slice(0, 30).join('\n'));
    } catch (e) {
      console.log('ERR', u, e.message);
    }
  }
})();
