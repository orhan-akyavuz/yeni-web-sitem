import { Router } from 'express';
import { sendSuccess, sendError } from '../middleware/response.js';
import { requireAuthenticatedUser } from '../middleware/auth.js';
import { authCookieOptions, supabase, supabaseConfigured } from '../services/supabase.js';

export const authRouter = Router();

function requireSupabase(res) {
  if (process.env.AUTH_PROVIDER !== 'supabase' || !supabaseConfigured || !supabase) {
    sendError(res, 503, 'AUTH_NOT_CONFIGURED', 'Supabase kimlik doğrulaması etkin değil.');
    return false;
  }
  return true;
}

function setSessionCookie(res, accessToken) {
  res.setHeader('Set-Cookie', `md_access_token=${encodeURIComponent(accessToken)}; ${authCookieOptions(60 * 60 * 24 * 7)}`);
}

authRouter.post('/signup', async (req, res) => {
  if (!requireSupabase(res)) return;
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!email || password.length < 8) return sendError(res, 422, 'VALIDATION_ERROR', 'Geçerli e-posta ve en az 8 karakterli şifre gerekir.');
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: req.body?.displayName || 'Matematikçi' } } });
  if (error) return sendError(res, 422, 'SIGNUP_FAILED', error.message);
  if (data.session?.access_token) setSessionCookie(res, data.session.access_token);
  sendSuccess(res, { user: data.user ? { id: data.user.id, email: data.user.email } : null, requiresEmailConfirmation: !data.session }, 201);
});

authRouter.post('/signin', async (req, res) => {
  if (!requireSupabase(res)) return;
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  if (!email || !password) return sendError(res, 422, 'VALIDATION_ERROR', 'E-posta ve şifre zorunludur.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) return sendError(res, 401, 'SIGNIN_FAILED', error?.message || 'Giriş yapılamadı.');
  setSessionCookie(res, data.session.access_token);
  sendSuccess(res, { user: { id: data.user.id, email: data.user.email } });
});

authRouter.get('/me', requireAuthenticatedUser, (req, res) => {
  sendSuccess(res, { user: req.user });
});

authRouter.post('/signout', (_req, res) => {
  res.setHeader('Set-Cookie', `md_access_token=; ${authCookieOptions(0)}`);
  sendSuccess(res, { signedOut: true });
});