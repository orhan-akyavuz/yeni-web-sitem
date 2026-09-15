// Geçici keşif scripti: VakıfBank bankacilik-ilanlari sayfasındaki ilan linklerini test eder.
(async () => {
  const url = 'https://www.vakifbank.com.tr/tr/bankamiz/hakkimizda/insan-kaynaklari/kariyer/bankacilik-ilanlari';
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const t = await r.text();
  console.log('STATUS', r.status, 'LEN', t.length);

  const jobs = [...t.matchAll(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]{5,120}?)<\/a>/g)]
    .map(m => m[1] + ' | ' + m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(l => /ilan|basvuru|pozisyon/i.test(l));

  console.log([...new Set(jobs)].slice(0, 40).join('\n'));
})();
