// Geçici keşif: bankacilik-ilanlari sayfasinda ilan verisi nereden geliyor?
(async () => {
  const url = 'https://www.vakifbank.com.tr/tr/bankamiz/hakkimizda/insan-kaynaklari/kariyer/bankacilik-ilanlari';
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const t = await r.text();

  // 1) script src listesi
  console.log('--- SCRIPTS ---');
  const reScript = /<script[^>]*src="([^"]+)"[^>]*>/gi;
  let m;
  while ((m = reScript.exec(t))) console.log(m[1]);

  // 2) fetch/ajax/api iceren inline kodlar
  console.log('--- API IPUCLARI ---');
  const reApi = /(?:fetch\(|url\s*:|ajax|api\/|handler|\.ashx|\.json)[^\n]{0,140}/gi;
  [...new Set(t.match(reApi) || [])].slice(0, 25).forEach(s => console.log(s.trim().replace(/\s+/g, ' ')));

  // 3) "basvuru" veya "son " gibi ilan duyuru metinleri
  console.log('--- ILAN METNI ORNEKLERI ---');
  const reText = />([^<>]{0,200}(?:ba?vur|ilan|tarihinde|son )[^\n]{0,200})</gi;
  [...new Set(t.match(reText) || [])].slice(0, 15).forEach(s => console.log(s.replace(/\s+/g, ' ').trim()));
})();
