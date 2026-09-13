import { createHash } from 'node:crypto';
import { db } from '../db/connection.js';
import { sendError } from './response.js';
import { getSupabaseProfile, getSupabaseUser, supabaseConfigured } from '../services/supabase.js';

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function normalizeRole(value) {
  return String(value ?? '').trim().toLowerCase();
}

function getAdminEmailOverride(email) {
  const overrideList = (process.env.ADMIN_EMAILS || '').split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  return overrideList.includes(String(email || '').trim().toLowerCase()) ? 'admin' : null;
}

function getCookieToken(req) {
  const cookies = req.get('cookie')?.split(';').map((value) => value.trim()) ?? [];
  const accessCookie = cookies.find((value) => value.startsWith('md_access_token='));
  return accessCookie ? decodeURIComponent(accessCookie.slice('md_access_token='.length)) : '';
}

export async function requireAuthenticatedUser(req, res, next) {
  const authorization = req.get('authorization') ?? '';
  const [scheme, bearerToken] = authorization.split(' ');
  const token = scheme === 'Bearer' ? bearerToken : getCookieToken(req);

  if (!token || token.length < 20) {
    return sendError(res, 401, 'AUTH_REQUIRED', 'Cevap göndermek için giriş yapmalısınız.');
  }
  req.authToken = token;

  if (process.env.AUTH_PROVIDER === 'supabase') {
    if (!supabaseConfigured) {
      return sendError(res, 503, 'AUTH_NOT_CONFIGURED', 'Supabase kimlik doğrulaması yapılandırılmamış.');
    }
    const supabaseUser = await getSupabaseUser(token);
    if (!supabaseUser) return sendError(res, 401, 'INVALID_SESSION', 'Supabase oturumu geçersiz veya süresi dolmuş.');

    const supabaseProfile = await getSupabaseProfile(supabaseUser.id, token);

    let localUser = db.prepare('SELECT id, email, auth_user_id, role, display_name FROM users WHERE auth_user_id = ?').get(supabaseUser.id);
    if (!localUser) {
      localUser = db.prepare('SELECT id, email, auth_user_id, role, display_name FROM users WHERE email = ?').get(supabaseUser.email);
      if (localUser) {
        db.prepare('UPDATE users SET auth_user_id = ? WHERE id = ?').run(supabaseUser.id, localUser.id);
      } else {
        const result = db.prepare('INSERT INTO users (email, auth_user_id, display_name) VALUES (?, ?, ?)').run(supabaseUser.email, supabaseUser.id, supabaseUser.user_metadata?.display_name || 'Matematikçi');
        localUser = db.prepare('SELECT id, email, auth_user_id, role, display_name FROM users WHERE id = ?').get(Number(result.lastInsertRowid));
      }
    }

    const resolvedRole = normalizeRole(
      getAdminEmailOverride(supabaseUser.email)
      || supabaseProfile?.role
      || localUser?.role
      || 'student'
    );
    const resolvedDisplayName = supabaseProfile?.display_name ?? localUser?.display_name ?? supabaseUser.user_metadata?.display_name ?? 'Matematikçi';

    if (localUser) {
      const syncRole = resolvedRole === 'admin' ? 'admin' : normalizeRole(supabaseProfile?.role ?? localUser.role ?? 'student');
      db.prepare('UPDATE users SET role = ?, display_name = ?, auth_user_id = ? WHERE id = ?').run(
        syncRole,
        resolvedDisplayName,
        supabaseUser.id,
        localUser.id,
      );
    }

    req.user = {
      ...(localUser ?? {}),
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: resolvedRole,
      display_name: resolvedDisplayName,
      auth_user_id: supabaseUser.id,
    };
    return next();
  }

  const session = db.prepare(`
    SELECT u.id, u.email, u.role
    FROM auth_sessions AS s
    JOIN users AS u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > datetime('now')
  `).get(hashToken(token));

  if (!session) {
    return sendError(res, 401, 'INVALID_SESSION', 'Oturum geçersiz veya süresi dolmuş.');
  }

  req.user = session;
  next();
}

export function requireAdmin(req, res, next) {
  const userRole = normalizeRole(req.user?.role);
  if (userRole !== 'admin') {
    return sendError(res, 403, 'ADMIN_REQUIRED', 'Bu işlem için yönetici yetkisi gerekir.');
  }
  next();
}