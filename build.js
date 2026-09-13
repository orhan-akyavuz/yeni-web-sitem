// build/build.js
// ----------------------------------------------------------------------
// orhanakyavuz.com — Üretim (production) derleme betiği.
//
// Sprint 9 (Production Readiness) § 2.4-2.5'te strateji olarak
// tanımlanmıştı: "main.css içindeki @import zinciri yalnızca geliştirme
// ortamı içindir, production build adımında tüm dosyalar tek bir dosyada
// birleştirilip minify edilir". Bu betik o stratejiyi gerçek koda döker.
//
// Çalıştırma: npm run build
// Çıktı:      dist/  (kaynak dosyalara dokunulmaz — geliştirme ortamı
//             assets/css/main.css ve assets/js/main.js'i olduğu gibi
//             kullanmaya devam eder)
// ----------------------------------------------------------------------
import { build } from 'esbuild';
import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Betik doğrudan orhanakyavuz-v4 içinden çalıştırıldıysa ROOT orasıdır,
// kök dizinden çalıştırıldıysa 'orhanakyavuz-v4' klasörüdür.
const isInsideV4 = existsSync(path.join(__dirname, 'assets')) && existsSync(path.join(__dirname, 'index.html'));
const ROOT = isInsideV4 ? __dirname : path.resolve(__dirname, 'orhanakyavuz-v4');
const DIST = path.join(ROOT, 'dist');

async function main() {
  console.log('orhanakyavuz.com — production build başlıyor...\n');

  await fs.rm(DIST, { recursive: true, force: true });
  await fs.mkdir(DIST, { recursive: true });

  const cssResult = await buildCss();
  const jsResult = await buildJs();
  const htmlCount = await copyAndRewriteHtml(cssResult.hash, jsResult.hash);
  await copyStaticAssets();

  // Vercel veya diğer araçların kök dizindeki 'dist' veya 'public' klasörlerini bulabilmesi için kopyala
  if (!isInsideV4) {
    const rootDist = path.resolve(__dirname, 'dist');
    const rootPublic = path.resolve(__dirname, 'public');
    await fs.rm(rootDist, { recursive: true, force: true });
    await fs.cp(DIST, rootDist, { recursive: true });
    await fs.rm(rootPublic, { recursive: true, force: true });
    await fs.cp(DIST, rootPublic, { recursive: true });
  }

  // orhanakyavuz-v4 içindeki 'public' klasörünü de dist ile senkronize et
  const localPublic = path.join(ROOT, 'public');
  await fs.rm(localPublic, { recursive: true, force: true });
  await fs.cp(DIST, localPublic, { recursive: true });

  console.log('\n--- Özet ---');
  console.log(`CSS:  assets/css/main.css → dist/assets/css/main.${cssResult.hash}.min.css  (${formatBytes(cssResult.size)})`);
  console.log(`JS:   assets/js/main.js (+ ${jsResult.moduleCount} modül) → dist/assets/js/main.${jsResult.hash}.min.js  (${formatBytes(jsResult.size)})`);
  console.log(`HTML: ${htmlCount} sayfa kopyalandı, kaynak yolları hash'li dosyalara yeniden yazıldı`);
  console.log('\nBuild tamamlandı → dist/ ve public/ hazır!');
}

// ------------------------------------------------------------------------
// CSS: main.css'teki @import zincirini tek dosyada birleştirir + minify eder
// ------------------------------------------------------------------------
async function buildCss() {
  const entry = path.join(ROOT, 'assets/css/main.css');
  const outDir = path.join(DIST, 'assets/css');
  await fs.mkdir(outDir, { recursive: true });

  // esbuild CSS bundling: @import zincirini native olarak çözer
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    minify: true,
    write: false,
    loader: { '.css': 'css' },
  });

  const css = result.outputFiles[0].text;
  const hash = shortHash(css);
  const outPath = path.join(outDir, `main.${hash}.min.css`);
  await fs.writeFile(outPath, css);

  return { hash, size: Buffer.byteLength(css) };
}

// ------------------------------------------------------------------------
// JS: main.js minify edilir + hash'li isimle çıkarılır. Modül dosyaları
// AYRI AYRI minify edilir (aynı dosya adlarıyla, `assets/js/modules/`
// altında) — TEK dosyada birleştirilemezler, çünkü main.js bunları
// `await import(path)` ile ÇALIŞMA ZAMANI DEĞİŞKENİ üzerinden yükler
// (Sprint 6 tasarımı: MODULES dizisi + döngü — bkz. main.js üstündeki
// yorum). esbuild, statik string literal olmayan dinamik import
// hedeflerini derleme zamanında çözemez; bu, bilinçli bir mimari
// esneklik/performans dengesidir (Sprint 6: her modül no-op güvenli ve
// paralel yükleniyor). Modül dosya adları DEĞİŞTİRİLMEZ — main.js
// içindeki import yolları bu sayede hiçbir yeniden yazmaya gerek kalmadan
// çalışmaya devam eder.
// ------------------------------------------------------------------------
async function buildJs() {
  const entry = path.join(ROOT, 'assets/js/main.js');
  const outDir = path.join(DIST, 'assets/js');
  await fs.mkdir(outDir, { recursive: true });

  const result = await build({
    entryPoints: [entry],
    bundle: false,
    minify: true,
    write: false,
    target: ['es2022'],
  });

  const js = result.outputFiles[0].text;
  const hash = shortHash(js);
  await fs.writeFile(path.join(outDir, `main.${hash}.min.js`), js);

  const moduleDir = path.join(ROOT, 'assets/js/modules');
  const moduleFiles = await fs.readdir(moduleDir);
  const outModuleDir = path.join(outDir, 'modules');
  await fs.mkdir(outModuleDir, { recursive: true });

  let totalModuleSize = 0;
  for (const file of moduleFiles) {
    const modResult = await build({
      entryPoints: [path.join(moduleDir, file)],
      bundle: false,
      minify: true,
      write: false,
      target: ['es2022'],
    });
    const minified = modResult.outputFiles[0].text;
    totalModuleSize += Buffer.byteLength(minified);
    await fs.writeFile(path.join(outModuleDir, file), minified);
  }

  return {
    hash,
    size: Buffer.byteLength(js) + totalModuleSize,
    moduleCount: moduleFiles.length,
  };
}

// ------------------------------------------------------------------------
// HTML: her sayfayı dist/'e kopyalar, kaynak CSS/JS yollarını hash'li
// üretim dosyalarına yeniden yazar (cache-busting — Sprint 9 §2.7)
// ------------------------------------------------------------------------
async function copyAndRewriteHtml(cssHash, jsHash) {
  const htmlFiles = await walk(ROOT, (p) => p.endsWith('.html') && !p.includes(`${path.sep}dist${path.sep}`) && !p.includes('node_modules'));

  // Load component snippets from orhanakyavuz-v4/components
  const componentsDir = path.join(ROOT, 'components');
  const components = Object.create(null);
  try {
    const compFiles = await fs.readdir(componentsDir);
    for (const f of compFiles) {
      const full = path.join(componentsDir, f);
      const stat = await fs.stat(full);
      if (stat.isFile()) {
        components[f] = await fs.readFile(full, 'utf8');
      }
    }
  } catch (e) {
    // components dir may not exist; continue without includes
  }

  const headerIncludeRegex = /<!--\s*INCLUDE HEADER(?::\s*([^\s]+))?\s*-->/g;
  const footerIncludeRegex = /<!--\s*INCLUDE FOOTER(?::\s*([^\s]+))?\s*-->/g;

  for (const file of htmlFiles) {
    const relative = path.relative(ROOT, file);
    const outPath = path.join(DIST, relative);
    await fs.mkdir(path.dirname(outPath), { recursive: true });

    let content = await fs.readFile(file, 'utf8');

    // Replace include markers with component content (fallback to header.html / footer.html)
    content = content.replace(headerIncludeRegex, (_, name) => {
      const fn = (name && name.trim()) || 'header.html';
      return components[fn] ?? components['header.html'] ?? '';
    });
    content = content.replace(footerIncludeRegex, (_, name) => {
      const fn = (name && name.trim()) || 'footer.html';
      return components[fn] ?? components['footer.html'] ?? '';
    });

    // Update asset paths to hashed outputs
    content = content
      .replace('/assets/css/main.css', `/assets/css/main.${cssHash}.min.css`)
      .replace(
        '<script src="/assets/js/main.js" defer></script>',
        `<script src="/assets/js/main.${jsHash}.min.js" defer></script>`,
      );

    await fs.writeFile(outPath, content);
  }

  return htmlFiles.length;
}

// ------------------------------------------------------------------------
// İkonlar, görseller, favicon, manifest, sitemap, robots — olduğu gibi kopyalanır
// ------------------------------------------------------------------------
async function copyStaticAssets() {
  const toCopy = ['assets/icons', 'assets/images', 'favicon.ico', 'site.webmanifest', 'sitemap.xml', 'robots.txt'];
  for (const item of toCopy) {
    const src = path.join(ROOT, item);
    if (!existsSync(src)) continue;
    const dest = path.join(DIST, item);
    await fs.cp(src, dest, { recursive: true });
  }
}

// ------------------------------------------------------------------------
// Yardımcılar
// ------------------------------------------------------------------------
async function walk(dir, predicate) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'public' || entry.name === '.git' || entry.name === 'backend') continue;
    if (entry.isDirectory()) {
      results.push(...(await walk(full, predicate)));
    } else if (predicate(full)) {
      results.push(full);
    }
  }
  return results;
}

function shortHash(content) {
  // Basit, bağımlılıksız bir içerik hash'i (cache-busting için yeterli,
  // kriptografik güvenlik gerektirmez — yalnızca içerik değişince dosya
  // adının değişmesini sağlar)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) - hash + content.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}

function formatBytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

main().catch((error) => {
  console.error('Build başarısız:', error);
  process.exit(1);
});
