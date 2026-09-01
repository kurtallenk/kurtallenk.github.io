/**
 * ============================================================
 * PORTFOLIO VISITOR TRACKER
 * ============================================================
 */

(function () {

    'use strict';

    // =========================================================
    // CONFIGURATION
    // =========================================================

    const ANALYTICS_URL =
        'https://script.google.com/macros/s/AKfycbwXJZxD23OB_f8GUi7iGfXsizRpS4OL7gtj35GFejw6BPcvFFFDXOJRcruElRlj0rw/exec';

    const VISITOR_STORAGE_KEY = 'portfolio_visitor_id';
    const OWNER_TOKEN_STORAGE_KEY = 'portfolio_owner_token';
    const SESSION_STORAGE_KEY = 'portfolio_session_id';
    const SESSION_STARTED_KEY = 'portfolio_session_started';

    const HEARTBEAT_INTERVAL_MS = 20000;
    const IP_LOOKUP_TIMEOUT_MS = 2500;

    let cachedIp = null;
    let heartbeatTimer = null;

    // =========================================================
    // IDS
    // =========================================================

    function generateId() {
        if (window.crypto && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return 'id-' + Date.now().toString(36) + '-' +
            Math.random().toString(36).substring(2, 12) + '-' +
            Math.random().toString(36).substring(2, 12);
    }

    function getVisitorId() {
        try {
            let id = localStorage.getItem(VISITOR_STORAGE_KEY);
            if (!id) {
                id = generateId();
                localStorage.setItem(VISITOR_STORAGE_KEY, id);
            }
            return id;
        } catch (error) {
            return generateId();
        }
    }

    /**
     * Returns { id, isNew }. Session lives in sessionStorage, so
     * it survives page navigations within the same tab but not
     * across tabs or after the tab closes - this is the standard
     * definition of a "session" in web analytics.
     */
    function getSession() {
        try {
            let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
            if (!id) {
                id = generateId();
                sessionStorage.setItem(SESSION_STORAGE_KEY, id);
                sessionStorage.setItem(SESSION_STARTED_KEY, '1');
                return { id: id, isNew: true };
            }
            return { id: id, isNew: false };
        } catch (error) {
            return { id: generateId(), isNew: true };
        }
    }

    function getOwnerToken() {
        try {
            return localStorage.getItem(OWNER_TOKEN_STORAGE_KEY) || '';
        } catch (error) {
            return '';
        }
    }

    // =========================================================
    // SELF-REPORTED PUBLIC IP
    // =========================================================
    // Apps Script cannot read the caller's IP server-side, so
    // the browser looks up its own public IP via a free, keyless
    // service and reports it. GeoIP enrichment still happens
    // entirely server-side in Code.gs.

    function fetchOwnIp() {

        if (cachedIp) {
            return Promise.resolve(cachedIp);
        }

        return new Promise(function (resolve) {

            const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
            const timeoutId = setTimeout(function () {
                if (controller) { controller.abort(); }
                resolve('');
            }, IP_LOOKUP_TIMEOUT_MS);

            fetch('https://api.ipify.org?format=json', {
                signal: controller ? controller.signal : undefined,
                cache: 'no-store'
            })
                .then(function (response) { return response.json(); })
                .then(function (data) {
                    clearTimeout(timeoutId);
                    cachedIp = (data && data.ip) ? data.ip : '';
                    resolve(cachedIp);
                })
                .catch(function () {
                    clearTimeout(timeoutId);
                    resolve('');
                });

        });

    }

    // =========================================================
    // DEVICE / BROWSER DETECTION
    // =========================================================

    function detectDeviceType() {
        const ua = navigator.userAgent || '';
        const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (/iPad|Tablet(?!.*Mobile)/i.test(ua) || (hasTouch && Math.min(window.innerWidth, window.innerHeight) >= 600)) {
            return 'Tablet';
        }
        if (/Mobi|Android.*Mobile|iPhone|iPod/i.test(ua)) {
            return 'Mobile';
        }
        return 'Desktop';
    }

    function detectOS() {
        const ua = navigator.userAgent || '';
        if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
        if (/Windows NT/.test(ua)) return 'Windows';
        if (/Mac OS X/.test(ua)) return 'macOS';
        if (/Android/.test(ua)) return 'Android';
        if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
        if (/CrOS/.test(ua)) return 'ChromeOS';
        if (/Linux/.test(ua)) return 'Linux';
        return 'Unknown';
    }

    function detectBrowser() {
        const ua = navigator.userAgent || '';
        if (/Edg\//.test(ua)) return 'Edge';
        if (/OPR\//.test(ua) || /Opera/.test(ua)) return 'Opera';
        if (/Firefox\//.test(ua)) return 'Firefox';
        if (/CriOS\//.test(ua)) return 'Chrome (iOS)';
        if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
        if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
        return 'Unknown';
    }

    // =========================================================
    // UTM / REFERRER
    // =========================================================

    function getUtmParams() {
        try {
            const params = new URLSearchParams(window.location.search);
            return {
                utm_source: params.get('utm_source') || '',
                utm_medium: params.get('utm_medium') || '',
                utm_campaign: params.get('utm_campaign') || '',
                utm_term: params.get('utm_term') || '',
                utm_content: params.get('utm_content') || ''
            };
        } catch (error) {
            return { utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '' };
        }
    }

    // =========================================================
    // SEND
    // =========================================================

    function send(eventType, extra) {

        try {

            const visitorId = getVisitorId();
            if (!visitorId) { return; }

            fetchOwnIp().then(function (ip) {

                try {

                    const url = new URL(ANALYTICS_URL);
                    const session = getSession();
                    const utm = getUtmParams();

                    url.searchParams.set('type', 'track');
                    url.searchParams.set('event', eventType);
                    url.searchParams.set('visitor', visitorId);
                    url.searchParams.set('session', session.id);
                    url.searchParams.set('page', window.location.pathname + window.location.hash);
                    url.searchParams.set('referrer', document.referrer || '');
                    url.searchParams.set('ip', ip || '');
                    url.searchParams.set('device', detectDeviceType());
                    url.searchParams.set('os', detectOS());
                    url.searchParams.set('browser', detectBrowser());
                    url.searchParams.set('screen', screen.width + 'x' + screen.height);
                    url.searchParams.set('viewport', window.innerWidth + 'x' + window.innerHeight);
                    url.searchParams.set('dpr', String(window.devicePixelRatio || 1));
                    url.searchParams.set('touch', (('ontouchstart' in window) || navigator.maxTouchPoints > 0) ? '1' : '0');
                    url.searchParams.set('lang', navigator.language || '');
                    try {
                        url.searchParams.set('tz', Intl.DateTimeFormat().resolvedOptions().timeZone || '');
                    } catch (e) { /* Intl not available */ }
                    url.searchParams.set('scheme', (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light');

                    Object.keys(utm).forEach(function (key) {
                        if (utm[key]) { url.searchParams.set(key, utm[key]); }
                    });

                    const ownerToken = getOwnerToken();
                    if (ownerToken) { url.searchParams.set('ownerToken', ownerToken); }

                    if (extra) {
                        Object.keys(extra).forEach(function (key) {
                            url.searchParams.set(key, extra[key]);
                        });
                    }

                    fetch(url.toString(), {
                        method: 'GET',
                        mode: 'no-cors',
                        cache: 'no-store',
                        keepalive: true
                    }).catch(function () {  });

                } catch (innerError) {  }

            });

        } catch (error) {  }

    }

    // =========================================================
    // PUBLIC EVENT API
    // =========================================================

    window.portfolioTrack = function (eventName, metadata) {
        try {
            send('event', {
                eventName: String(eventName || 'unknown').substring(0, 60),
                meta: metadata ? JSON.stringify(metadata).substring(0, 500) : ''
            });
        } catch (error) {  }
    };

    // =========================================================
    // HEARTBEAT (drives session duration + real-time dashboard)
    // =========================================================

    function startHeartbeat() {
        stopHeartbeat();
        heartbeatTimer = setInterval(function () {
            if (!document.hidden) {
                send('ping');
            }
        }, HEARTBEAT_INTERVAL_MS);
    }

    function stopHeartbeat() {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }
    }

    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            send('ping');
        }
    });

    // =========================================================
    // START
    // =========================================================

    function start() {
        const session = getSession();
        send(session.isNew ? 'start' : 'pageview');
        startHeartbeat();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }

})();
