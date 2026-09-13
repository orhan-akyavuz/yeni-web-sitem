import { Router } from 'express';
import { db } from '../db/connection.js';
import { sendSuccess, sendError } from '../middleware/response.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { supabase, supabaseClientForToken } from '../services/supabase.js';

export const leaderboardRouter = Router();

leaderboardRouter.get('/', async (_req, res) => {
  if (process.env.AUTH_PROVIDER === 'supabase' && supabase) {
    const { data, error } = await supabase.rpc('get_weekly_leaderboard');
    if (error) return sendError(res, 503, 'DATABASE_FUNCTION_MISSING', 'Leaderboard RPC henüz Supabase projesinde uygulanmamış.');
    const leaders = (data ?? []).map((leader, index) => ({ ...leader, rank: index + 1 }));
    return sendSuccess(res, { leaders });
  }

  const leaders = db.prepare(`
    SELECT u.display_name AS name, COALESCE(SUM(se.points), 0) AS score,
      COUNT(DISTINCT se.submission_id) AS solved_count
    FROM users AS u
    JOIN score_events AS se ON se.user_id = u.id
    GROUP BY u.id, u.display_name
    ORDER BY score DESC, solved_count DESC, u.id ASC
    LIMIT 10
  `).all().map((leader, index) => ({ ...leader, rank: index + 1 }));

  sendSuccess(res, { leaders });
});

leaderboardRouter.get('/me', requireAuthenticatedUser, async (req, res) => {
  if (process.env.AUTH_PROVIDER === 'supabase') {
    const client = supabaseClientForToken(req.authToken);
    const [scores, streak, badges] = await Promise.all([
      client.from('score_events').select('points').eq('user_id', req.user.auth_user_id || req.user.id),
      client.from('streaks').select('current_streak, longest_streak').eq('user_id', req.user.auth_user_id || req.user.id).maybeSingle(),
      client.from('user_badges').select('earned_at, badges(code, name, description, icon)').eq('user_id', req.user.auth_user_id || req.user.id),
    ]);
    const score = (scores.data ?? []).reduce((total, event) => total + event.points, 0);
    return sendSuccess(res, { score, streak: streak.data ?? { current_streak: 0, longest_streak: 0 }, badges: (badges.data ?? []).map((item) => ({ ...item.badges, earned_at: item.earned_at })) });
  }

  const streak = db.prepare('SELECT current_streak, longest_streak FROM streaks WHERE user_id = ?').get(req.user.id) ?? { current_streak: 0, longest_streak: 0 };
  const score = db.prepare('SELECT COALESCE(SUM(points), 0) AS total FROM score_events WHERE user_id = ?').get(req.user.id).total;
  const badges = db.prepare(`
    SELECT b.code, b.name, b.description, b.icon, ub.earned_at
    FROM user_badges AS ub JOIN badges AS b ON b.id = ub.badge_id
    WHERE ub.user_id = ? ORDER BY ub.earned_at DESC
  `).all(req.user.id);
  sendSuccess(res, { score, streak, badges });
});