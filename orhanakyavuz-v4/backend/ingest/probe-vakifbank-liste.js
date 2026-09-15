// Geçici keşif scripti: bankacilik-ilanlari sayfasindaki ilan linklerini ayiklar.
(async () => {
  const url = 'https://www.vakifbank.com.tr/tr/bankamiz/hakkimizda/insan-kaynaklari/kariyer/bankacilik-ilanlari';
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const t = await r.text();
  console.log('STATUS', r.status, 'LEN', t.length);

  // "ilan" iceren <a> tagleri
  const re = /<a[^>]*href="([^"]*)"[^>]*>([^<]{0,150})<\/a>/gi;
  let m, n = 0;
  while ((m = re.exec(t)) && n < 60) {
    const label = m[2].trim();
    if (/ilan|mdur|Müdür|Yardımcı|yardimci|teftis|Teftiş|kariyer/i.test(label)) {
      console.log(m[1], '|', label);
      n++;
    }
  }

  console.log('--- tarih benzeri metinler ---');
  const reDate = /(0[1-9]|[12]\d|3[01])[.\/](0[1-9]|1[0-2])[.\/](20\d{2})/g;
  console.log([...new Set(t.match(reDate) || [])].slice(0, 20));

  console.log('--- kutu/kart class ornekleri ---');
  const reBox = /class="([^"]*(ilan|card|position|job|list)[^"]*)"/gi;
  console.log([...new Set((t.match(reBox) || []).map(s => s))].slice(0, 25));
})();
