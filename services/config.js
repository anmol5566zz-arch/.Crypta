/**
 * Crypta - Supabase Configuration
 * 
 * 1. Project URL: Live connected project endpoint.
 * 2. Publishable Key: Safe for browser client-side code (governed by Row Level Security).
 * 3. Secret Key: Stored in .env for server-side environments only.
 */

const DEFAULT_SUPABASE_URL = 'https://qhteppkaxntsqzpybdst.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_WPaHgGqZs97zA6YmhqgiLg_v_2weO1q';

const CryptaConfig = {
    getSupabaseUrl() {
        return localStorage.getItem('crypta_supabase_url') || DEFAULT_SUPABASE_URL;
    },
    getSupabaseAnonKey() {
        return localStorage.getItem('crypta_supabase_anon_key') || DEFAULT_SUPABASE_ANON_KEY;
    },
    setCredentials(url, anonKey) {
        if (url) localStorage.setItem('crypta_supabase_url', url.trim());
        if (anonKey) localStorage.setItem('crypta_supabase_anon_key', anonKey.trim());
    },
    clearCredentials() {
        localStorage.removeItem('crypta_supabase_url');
        localStorage.removeItem('crypta_supabase_anon_key');
    },
    isConfigured() {
        const url = this.getSupabaseUrl();
        const key = this.getSupabaseAnonKey();
        return (
            Boolean(url) &&
            !url.includes('YOUR_PROJECT_ID') &&
            Boolean(key) &&
            !key.includes('YOUR_SUPABASE_ANON_KEY')
        );
    }
};

if (typeof window !== 'undefined') {
    window.CryptaConfig = CryptaConfig;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptaConfig;
}
