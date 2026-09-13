const h = require('http'), f = require('fs'), p = require('path');
const ROOT = p.join(__dirname, 'dist');
h.createServer((q, s) => {
  let u = decodeURIComponent(q.url.split('?')[0]);
  if (u.endsWith('/')) u += 'index.html';
  let file = p.join(ROOT, u);
  if (!f.existsSync(file) || f.statSync(file).isDirectory()) {
    file = p.join(ROOT, u.replace(/\/$/, ''), 'index.html');
    if (!f.existsSync(file)) { file = p.join(ROOT, '404.html'); s.statusCode = 404; }
  }
  f.readFile(file, (e, d) => {
    if (e) { s.statusCode = 500; return s.end(); }
    const ext = p.extname(file);
    const m = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.json': 'application/json', '.woff2': 'font/woff2' };
    s.setHeader('Content-Type', m[ext] || 'application/octet-stream');
    s.end(d);
  });
}).listen(4173, () => console.log('up'));
