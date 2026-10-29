/**
 * Crypta Workspace - Local Guest Authentication
 */

(function() {
    const GUEST_SESSION_KEY = 'crypta_google_auth';
    const GUEST_TOKEN_VALUE = 'guest_access_token';

    const CryptaAuth = {
        getClient() {
            return null;
        },

        async getCurrentUser() {
            if (sessionStorage.getItem(GUEST_SESSION_KEY) !== GUEST_TOKEN_VALUE) {
                return null;
            }

            return {
                id: 'guest_local',
                email: 'guest@crypta.local',
                name: 'Guest User',
                isGuest: true
            };
        },

        signInAsGuest() {
            sessionStorage.setItem(GUEST_SESSION_KEY, GUEST_TOKEN_VALUE);
            return {
                id: 'guest_local',
                email: 'guest@crypta.local',
                name: 'Guest User',
                isGuest: true
            };
        },

        signOut() {
            sessionStorage.removeItem(GUEST_SESSION_KEY);
            window.location.href = 'login.html';
        },

        async enforceGuard() {
            const isAuthPage = window.location.pathname.endsWith('login.html');
            const user = await this.getCurrentUser();

            if (!user && !isAuthPage) {
                window.location.href = 'login.html';
            } else if (user && isAuthPage) {
                window.location.href = 'index.html';
            }
            return user;
        }
    };

    window.CryptaAuth = CryptaAuth;
})();
