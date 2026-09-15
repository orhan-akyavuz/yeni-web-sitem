// backend/server.js
// ----------------------------------------------------------------------
// orhanakyavuz.com API sunucusu.
// Çalıştırma: cd backend && npm install && npm run seed && npm start
// ----------------------------------------------------------------------
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import express from 'express';
import { articlesRouter } from './routes/articles.js';
import { categoriesRouter } from './routes/categories.js';
import { tagsRouter } from './routes/tags.js';
import { searchRouter } from './routes/search.js';
import { contactRouter } from './routes/contact.js';
import { newsletterRouter } from './routes/newsletter.js';
import { statsRouter } from './routes/stats.js';
import { submissionsRouter } from './routes/submissions.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { adminWeeklyProblemsRouter } from './routes/adminWeeklyProblems.js';
import { aiRouter } from './routes/ai.js';
import { authRouter } from './routes/auth.js';
import { levelAnalysisRouter } from './routes/levelAnalysis.js';
import { adminLevelAnalysisRouter } from './routes/adminLevelAnalysis.js';
import { currentInfoRouter } from './routes/currentInfo.js';
import { adminCurrentInfoRouter } from './routes/adminCurrentInfo.js';
import { startIngestScheduler } from './ingest/index.js';
import { errorHandler, sendError } from './middleware/response.js';

const app = express();
const PORT = process.env.PORT || 4000;
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://*.supabase.co"],
    },
  },
}));
// ------------------------------------------------------------------------
// CORS — frontend (statik site) farklı bir origin'den (örn. Live Server
// veya start-server.sh ile 8000 portundan) API'ye istek atacağı için
// gereklidir. Üretimde ALLOWED_ORIGIN ortam değişkeniyle sınırlandırılır.
// ------------------------------------------------------------------------
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
app.use((req, res, next) => {
  const requestOrigin = req.get('origin');
  const isLocalDevelopmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin || '');
  const originAllowed = ALLOWED_ORIGIN === '*'
    ? isLocalDevelopmentOrigin
    : ALLOWED_ORIGIN.split(',').map((origin) => origin.trim()).includes(requestOrigin);
  if (originAllowed) res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return originAllowed ? res.sendStatus(204) : res.sendStatus(403);
  next();
});

app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
});

app.use('/api/articles', articlesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/search', searchRouter);
app.use('/api/contact', contactRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/stats', statsRouter);
app.use('/api/weekly-problems', submissionsRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/admin/weekly-problems', adminWeeklyProblemsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/auth', authRouter);
app.use('/api/level-analysis/uploads', express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '8mb' }));
app.use('/api/level-analysis', levelAnalysisRouter);
app.use('/api/admin/level-analysis', adminLevelAnalysisRouter);
app.use('/api/current-info', currentInfoRouter);
app.use('/api/admin/current-info', adminCurrentInfoRouter);

// Tanımsız API rotaları için tutarlı 404 zarfı
app.use('/api', (req, res) => sendError(res, 404, 'NOT_FOUND', 'İstenen API uç noktası bulunamadı.'));

app.use(errorHandler);

startIngestScheduler();

app.listen(PORT, () => {
  console.log(`orhanakyavuz API http://localhost:${PORT} adresinde çalışıyor.`);
});
