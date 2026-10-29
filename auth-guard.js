(function() {
    const sessionKey = 'crypta_google_auth';
    const guestToken = 'guest_access_token';
    const isAuthPage = window.location.pathname.endsWith('login.html');
    const hasValidSession = sessionStorage.getItem(sessionKey) === guestToken;

    if (!hasValidSession) {
        if (!isAuthPage) {
            window.location.href = 'login.html';
        }
    } else {
        if (isAuthPage) {
            window.location.href = 'index.html';
        }
    }
})();
