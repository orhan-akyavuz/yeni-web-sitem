import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.join(__dirname, '..', 'orhanakyavuz-v4');
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, `http://localhost`).pathname);
    let fsPath = path.join(rootDir, urlPath);
    // prevent path traversal
    if (!fsPath.startsWith(rootDir)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    let stat;
    try {
      stat = await fs.stat(fsPath);
    } catch (e) {
      // try adding index.html if path is directory or missing
      if (!path.extname(fsPath)) {
        const tryIndex = path.join(fsPath, 'index.html');
        try {
          stat = await fs.stat(tryIndex);
          fsPath = tryIndex;
        } catch (e2) {
          // not found
        }
      }
    }

    if (!stat) {
      // fallback to root index.html for HTML routes
      const indexFile = path.join(rootDir, 'index.html');
      try {
        const data = await fs.readFile(indexFile);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
        return;
      } catch (e) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
    }

    if (stat.isDirectory()) {
      const indexFile = path.join(fsPath, 'index.html');
      const data = await fs.readFile(indexFile);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
      return;
    }

    const ext = path.extname(fsPath).toLowerCase();
    const type = mime[ext] || 'application/octet-stream';
    const data = await fs.readFile(fsPath);
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch (err) {
    res.writeHead(500);
    res.end('Server error');
    console.error(err);
  }
});

server.listen(port, () => {
  console.log(`Static server for orhanakyavuz-v4 running at http://localhost:${port}/`);
});
