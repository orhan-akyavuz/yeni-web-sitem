// VakifBank kariyer sayfasini kesfetme testi (gecici dosya)
(async () => {
  const base = 'https://kariyer.vakifbank.com.tr/';
  const r = await fetch(base, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const t = await r.text();
  const hrefs = [...t.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  const interesting = hrefs.filter(h => /ilan|basvuru|pozisyon|acik|job|kariyer/i.test(h));
  console.log('--- LINKS ---');
  console.log([...new Set(interesting)].slice(0, 25).join('\n'));
  const scripts = [...t.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(m => m[1]);
  console.log('--- SCRIPTS ---');
  console.log(scripts.join('\n'));
  const api = [...t.matchAll(/(\/api\/[^"'\s]+)/g)].map(m => m[1]);
  console.log('--- API PATHS IN HTML ---');
  console.log([...new Set(api)].join('\n') || 'none');
})();
