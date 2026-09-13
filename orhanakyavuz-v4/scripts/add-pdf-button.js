const fs = require('fs');
const path = require('path');
const blogDir = path.join(process.cwd(), 'blog');
const dirs = fs.readdirSync(blogDir).filter(name => fs.statSync(path.join(blogDir, name)).isDirectory());
for (const name of dirs) {
  const file = path.join(blogDir, name, 'index.html');
  if (!fs.existsSync(file)) continue;
  let text = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (!text.includes('id="pdf-content"')) {
    const before = '<div class="prose">';
    const after = '<div id="pdf-content" class="pdf-template prose">';
    if (text.includes(before)) {
      text = text.replace(before, after);
      changed = true;
    }
  }

  if (!text.includes('id="download-pdf-btn"')) {
    const needle = '<div class="article-header__tags">';
    const idx = text.indexOf(needle);
    if (idx !== -1) {
      const closeMarker = '</div>\n      </header>';
      const afterIdx = text.indexOf(closeMarker, idx);
      if (afterIdx !== -1) {
        const insert = '        <div class="article-header__pdf">\n          <button id="download-pdf-btn" class="pdf-btn" type="button">\n            📄 Makaleyi PDF Olarak İndir\n          </button>\n        </div>\n';
        text = text.slice(0, afterIdx) + insert + text.slice(afterIdx);
        changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, text, 'utf8');
    console.log('Updated', file);
  } else {
    console.log('No change', file);
  }
}
