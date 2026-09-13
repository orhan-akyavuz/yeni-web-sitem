// backend/db/connection.js
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, 'orhanakyavuz.sqlite');

if (!existsSync(DB_PATH)) {
  throw new Error(
    'Veritabanı bulunamadı. Önce "npm run seed" komutunu çalıştırın (backend/ klasöründe).',
  );
}

export const db = new DatabaseSync(DB_PATH);

const userColumns = db.prepare('PRAGMA table_info(users)').all().map((column) => column.name);
if (!userColumns.includes('auth_user_id')) {
  db.exec('ALTER TABLE users ADD COLUMN auth_user_id TEXT');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id)');
}
