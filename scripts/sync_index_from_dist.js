import fs from 'node:fs';
import path from 'node:path';

const distPath = path.join(process.cwd(), 'orhanakyavuz-v4', 'dist', 'index.html');
const destPath = path.join(process.cwd(), 'orhanakyavuz-v4', 'index.html');
let content = fs.readFileSync(distPath, 'utf8');

// Replace header block with include marker
content = content.replace(/<header[\s\S]*?<\/header>/, '<!-- INCLUDE HEADER -->');
// Replace footer block with include marker
content = content.replace(/<footer[\s\S]*?<\/footer>/, '<!-- INCLUDE FOOTER -->');
// Replace Son Yazılar list with dynamic ul (match the first occurrence of article-card-grid ul)
content = content.replace(/<ul class="article-card-grid" role="list">[\s\S]*?<\/ul>/, '<ul class="article-card-grid" role="list" data-dynamic-articles="latest" data-limit="3"></ul>');

fs.writeFileSync(destPath, content, 'utf8');
console.log('index.html synced from dist with include markers.');
