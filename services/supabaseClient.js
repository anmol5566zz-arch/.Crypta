/**
 * Crypta - Supabase Client Initializer
 *
 * Safe client instantiation that handles missing CDN, unconfigured credentials,
 * and exposes a single consistent `window.CryptaSupabase` instance.
 */

(function() {
    let clientInstance = null;

    function getSupabaseClient() {
        if (clientInstance) return clientInstance;

        if (typeof window === 'undefined') return null;

        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            console.warn('[Crypta] Supabase JS SDK not loaded yet. Make sure to include @supabase/supabase-js script tag.');
            return null;
        }

        const config = window.CryptaConfig;
        if (!config || !config.isConfigured()) {
            console.info('[Crypta] Supabase credentials not set or placeholder detected in services/config.js.');
            return null;
        }

        try {
            clientInstance = window.supabase.createClient(
                config.getSupabaseUrl(),
                config.getSupabaseAnonKey(),
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true
                    }
                }
            );
            return clientInstance;
        } catch (err) {
            console.error('[Crypta] Failed to initialize Supabase client:', err);
            return null;
        }
    }

    window.CryptaSupabase = {
        getClient() {
            return getSupabaseClient();
        },
        resetClient() {
            clientInstance = null;
            return getSupabaseClient();
        },
        isReady() {
            return !!getSupabaseClient();
        }
    };
})();

