// VakifBank kariyer sayfasindaki <script src> listeler.
fetch('https://kariyer.vakifbank.com.tr/tr-tr', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then((r) => r.text())
  .then((t) => {
    const srcs = t.match(/<script[^>]*src="([^"]+)"/gi) || [];
    srcs.forEach((s) => console.log(s));
    const inline = (t.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi) || []).filter((s) => s.length > 200);
    console.log('INLINE long scripts:', inline.length);
    inline.slice(0, 3).forEach((s) => console.log(s.slice(0, 800), '\n===='));
  });
