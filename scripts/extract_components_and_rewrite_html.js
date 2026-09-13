import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.join(process.cwd(), 'orhanakyavuz-v4');
const COMPONENTS = path.join(ROOT, 'components');

function walk(dir) {
  const results = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', 'dist', '.git', 'backend', 'components'].includes(name)) continue;
      results.push(...walk(full));
    } else if (name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function shortHash(content) {
  const h = crypto.createHash('sha1').update(content).digest('hex');
  return h.slice(0, 8);
}

async function main() {
  fs.mkdirSync(COMPONENTS, { recursive: true });
  const files = walk(ROOT);
  const headerMap = new Map();
  const footerMap = new Map();

  // collect variants
  for (const file of files) {
    const txt = fs.readFileSync(file, 'utf8');
    const hmatch = txt.match(/<header class="site-header"[\s\S]*?<\/header>/);
    const fmatch = txt.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
    if (!hmatch || !fmatch) continue;
    const header = hmatch[0];
    const footer = fmatch[0];
    const hh = shortHash(header);
    const fh = shortHash(footer);
    if (!headerMap.has(hh)) headerMap.set(hh, { content: header, files: [] });
    headerMap.get(hh).files.push(file);
    if (!footerMap.has(fh)) footerMap.set(fh, { content: footer, files: [] });
    footerMap.get(fh).files.push(file);
  }

  // write component files
  for (const [hh, obj] of headerMap) {
    const name = `header-${hh}.html`;
    const p = path.join(COMPONENTS, name);
    fs.writeFileSync(p, obj.content, 'utf8');
  }
  for (const [fh, obj] of footerMap) {
    const name = `footer-${fh}.html`;
    const p = path.join(COMPONENTS, name);
    fs.writeFileSync(p, obj.content, 'utf8');
  }

  // choose default (most common)
  const mostCommonHeader = [...headerMap.entries()].sort((a,b)=>b[1].files.length - a[1].files.length)[0][0];
  const mostCommonFooter = [...footerMap.entries()].sort((a,b)=>b[1].files.length - a[1].files.length)[0][0];
  fs.writeFileSync(path.join(COMPONENTS, 'header.html'), headerMap.get(mostCommonHeader).content, 'utf8');
  fs.writeFileSync(path.join(COMPONENTS, 'footer.html'), footerMap.get(mostCommonFooter).content, 'utf8');

  console.log('Wrote components:', fs.readdirSync(COMPONENTS));

  // now rewrite HTML files: replace header/footer blocks with include markers
  for (const file of files) {
    let txt = fs.readFileSync(file, 'utf8');
    const hmatch = txt.match(/<header class="site-header"[\s\S]*?<\/header>/);
    const fmatch = txt.match(/<footer class="site-footer"[\s\S]*?<\/footer>/);
    if (!hmatch || !fmatch) continue;
    const header = hmatch[0];
    const footer = fmatch[0];
    const hh = shortHash(header);
    const fh = shortHash(footer);
    const headerFile = (hh === mostCommonHeader) ? 'header.html' : `header-${hh}.html`;
    const footerFile = (fh === mostCommonFooter) ? 'footer.html' : `footer-${fh}.html`;
    txt = txt.replace(header, `<!-- INCLUDE HEADER: ${headerFile} -->`);
    txt = txt.replace(footer, `<!-- INCLUDE FOOTER: ${footerFile} -->`);
    fs.writeFileSync(file, txt, 'utf8');
  }

  console.log('Rewrote HTML files with include markers.');
}

main();
