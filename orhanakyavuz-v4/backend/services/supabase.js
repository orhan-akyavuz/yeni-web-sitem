import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey && !url.includes('your-project'));
export const supabase = supabaseConfigured ? createClient(url, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
}) : null;

export async function getSupabaseUser(token) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) return null;
  return data.user;
}

export async function getSupabaseProfile(userId, token = null) {
  if (!supabase) return null;
  const client = token ? createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  }) : supabase;
  const { data, error } = await client.from('profiles').select('id, display_name, role').eq('id', userId).maybeSingle();
  return error ? null : data;
}

export function authCookieOptions(maxAge) {
  return `HttpOnly; Path=/; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure; ' : ''}Max-Age=${maxAge}`;
}

export function supabaseClientForToken(token) {
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// service_role anahtarı RLS'i bypass eder — yalnızca sunucu tarafında
// kullanılır, tarayıcıya asla gönderilmez. contact/newsletter gibi
// login gerektirmeyen public-write işlemleri için gerekli.
export const supabaseAdmin = (url && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;