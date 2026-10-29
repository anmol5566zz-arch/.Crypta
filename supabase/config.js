/**
 * Crypta — Supabase Configuration
 * =================================
 * 1. Project URL: Live connected project endpoint.
 * 2. Publishable Key: Safe to include in client-side code (governed by Row Level Security).
 * 3. Secret Key: Stored in .env for server-side environments only.
 */

const SUPABASE_URL = 'https://qhteppkaxntsqzpybdst.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_WPaHgGqZs97zA6YmhqgiLg_v_2weO1q';

window.CryptaConfig = Object.freeze({
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
});
