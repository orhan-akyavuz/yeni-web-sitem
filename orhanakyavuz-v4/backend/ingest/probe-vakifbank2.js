// Adım 2 sondajı: pozisyon detay sayfası yapısını incele
const URL = 'https://www.vakifbank.com.tr/tr/bankamiz/hakkimizda/insan-kaynaklari/kariyer/bankacilik-pozisyonlari/mufettis-yardimcisi';

fetch(URL, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then((r) => r.text())
  .then((t) => {
    console.log('--- SAYFA BAŞLIĞI ---');
    const title = t.match(/<title>(.*?)<\/title>/is);
    console.log(title ? title[1].trim() : '(yok)');

    console.log('--- H1/H2 ---');
    [...t.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)].slice(0, 10).forEach((m) =>
      console.log(m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120))
    );

    console.log('--- BAŞVURU / TARİH İZLERİ ---');
    t.split('\n').filter((l) => /başvuru|basvuru|son tarih|tarih|date/i.test(l)).slice(0, 15).forEach((l) =>
      console.log(l.trim().replace(/\s+/g, ' ').slice(0, 250))
    );

    console.log('--- İÇERİK PARAGRAFLARI (ilk 10) ---');
    [...t.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].slice(0, 10).forEach((m) =>
      console.log('P:', m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150))
    );
  })
  .catch((e) => console.error('HATA:', e.message));
