// Tek seferlik VakıfBank kariyer sayfası sondaj scripti (silinebilir)
const URL = 'https://www.vakifbank.com.tr/tr/bankamiz/hakkimizda/insan-kaynaklari/kariyer/bankacilik-ilanlari';

fetch(URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then((r) => r.text())
  .then((t) => {
    const links = [...t.matchAll(/href="([^"]*(?:kariyer|ilan|basvur|job|apply)[^"]*)"/gi)].map((m) => m[1]);
    console.log('--- LINKLER ---');
    console.log([...new Set(links)].join('\n'));

    console.log('--- KARİYER İÇEREN SCRIPTLER ---');
    const scripts = [...t.matchAll(/src="([^"]+)"/gi)].map((m) => m[1])
      .filter((s) => s.toLowerCase().includes('kariyer') || s.toLowerCase().includes('career') || s.toLowerCase().includes('job'));
    console.log([...new Set(scripts)].join('\n') || '(yok)');

    console.log('--- ILAN KARTLARI (a/başlık yapıları) ---');
    const cards = [...t.matchAll(/<a[^>]+href="([^"]*ilan[^"]*)"[^>]*>([\s\S]*?)<\/a>/gi)].slice(0, 30);
    cards.forEach((m) => console.log('LINK:', m[1], '| TEXT:', m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120)));
    console.log('--- OPENPOSITION / AJAX İZLERİ ---');
    t.split('\n').filter((l) => /openposition|ajax|api|fetch\(/i.test(l)).slice(0, 15).forEach((l) => console.log(l.trim().slice(0, 300)));
  });
