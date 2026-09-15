// backend/ingest/db.js
// ----------------------------------------------------------------------
// Supabase servis-katmanı erişimi (yalnızca backend'de, service role).
// Mevcut projedeki supabase istemci kurulumunu yeniden kullanmak istersek
// aynı ortam değişkenlerini okur.
// ----------------------------------------------------------------------
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

let client = null;

export function getSupabaseAdmin() {
  if (!client) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error(
        'Supabase yapılandırması eksik: SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env).'
      );
    }
    client = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}
