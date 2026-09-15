// Geçici test dosyası — VakıfBank HTML analiz (sonra silinecek)
(async () => {
  const h = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
    'Accept': 'text/html',
    'Referer': 'https://www.vakifbank.com.tr/'
  };
  const r = await fetch('https://www.vakifbank.com.tr/Templates/Default/assets/js/endpoints.js', { headers: h });
  const t = await r.text();
  console.log('STATUS', r.status, 'LEN', t.length);
  // baseEndpoint.js: ilan listesi API'si burada olabilir
  const r3 = await fetch('https://www.vakifbank.com.tr/Templates/Default/Assets/js/baseEndpoint.js', { headers: h });
  console.log('BASE ENDPOINT STATUS', r3.status);
  console.log((await r3.text()).slice(0, 3000));
  // Kariyer ana sayfası
  // Gercek kariyer sayfasi (kucuk harf yolu)
  const r2 = await fetch('https://www.vakifbank.com.tr/tr-tr/kariyer', { headers: h, redirect: 'follow' });
  const h2 = await r2.text();
  console.log('PAGE STATUS', r2.status, 'LEN', h2.length, 'URL', r2.url);
  const links = [...h2.matchAll(/href="([^"]*(?:kariyer|is-|ilan|basvuru)[^"]*)"/gi)].map(m => m[1]);
  console.log('LINKS:', [...new Set(links)].slice(0, 40).join('\n'));
  // Olasi API denemeleri
  for (const t of ['https://kariyer.vakifbank.com.tr/', 'https://www.vakifbank.com.tr/api/is-ilanlari']) {
    try {
      const rr = await fetch(t, { headers: h, redirect: 'follow' });
      console.log('\nTRY', t, '->', rr.status, (await rr.text()).slice(0, 300).replace(/\s+/g, ' '));
    } catch (e) { console.log('\nTRY', t, '-> HATA', e.message); }
  }
})();
