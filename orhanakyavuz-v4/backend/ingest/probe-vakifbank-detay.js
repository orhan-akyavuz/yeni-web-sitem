// Geçici keşif scripti: Mufettis Yardimcisi pozisyon sayfasindaki ilan metnini/tarih bilgisini inceler.
(async () => {
  const url = 'https://www.vakifbank.com.tr/tr/bankamiz/hakkimizda/insan-kaynaklari/kariyer/bankacilik-pozisyonlari/mufettis-yardimcisi';
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const t = await r.text();
  console.log('STATUS', r.status, 'LEN', t.length);

  // "ilan", "başvuru", tarih gibi anahtar kelimelerin geçtiği satırları bul
  const lines = t.split('\n').map(l => l.trim()).filter(l =>
    /ilan|başvuru|basvuru|son .arih|tarih|20\d/.test(l) && l.length < 300
  );
  console.log([...new Set(lines)].slice(0, 40).join('\n---\n'));
})();
