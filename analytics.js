/*
 Backup visit + engagement counters. All counters use
 countapi.mileshilliard.com, a free no-signup, no-key counting API,
 so there's nothing to configure or maintain. Each counter's current
 value is readable at any time by opening its endpoint URL directly,
 e.g. https://countapi.mileshilliard.com/api/v1/get/fn-portfolio-visits

 Counter keys used (see stats.html for a combined local view):
 - fn-portfolio-visits           one per session
 - fn-portfolio-long-visits      one per session, only if it passes 30s
 - fn-portfolio-renders-clicked  one per lightbox open (see script.js)
 - fn-portfolio-umami-ok         one per visit, if window.umami loaded
 - fn-portfolio-umami-failed     one per visit, if window.umami never loaded
 */
(function () {
    const BASE = 'https://countapi.mileshilliard.com/api/v1';
    const VISIT_KEY = 'fn-portfolio-visits';
    const LONG_VISIT_KEY = 'fn-portfolio-long-visits';
    const UMAMI_OK_KEY = 'fn-portfolio-umami-ok';
    const UMAMI_FAILED_KEY = 'fn-portfolio-umami-failed';
    const SESSION_FLAG = 'fn_visit_logged';

    const hit = (key) => fetch(`${BASE}/hit/${key}`, { keepalive: true }).catch(() => { /* best-effort */ });

    /* Count once per browser session (not per page load) so refreshing
       or navigating back and forth doesn't inflate the number. */
    let alreadyLogged = false;
    try {
        alreadyLogged = !!sessionStorage.getItem(SESSION_FLAG);
    } catch (e) {
        // Some privacy modes throw on sessionStorage access — treat as
        // not-yet-logged and skip the dedupe write below too.
    }

    if (!alreadyLogged) {
        hit(VISIT_KEY).then(() => {
            try { sessionStorage.setItem(SESSION_FLAG, '1'); } catch (e) { /* ignore */ }
        });
    }

    /* Umami's script tag uses defer, so give it a moment to load before
       checking whether it actually landed. Fires every visit, regardless
       of the dedupe above, since this answers a different question
       (did tracking work this time) rather than counting unique visits. */
    setTimeout(() => {
        hit(window.umami ? UMAMI_OK_KEY : UMAMI_FAILED_KEY);
    }, 3000);

    /* Fires once per session if the visit passes 30s, giving a rough
       engaged-vs-bounced split (long-visits / visits) without needing
       to store or accumulate actual durations. */
    setTimeout(() => {
        if (!alreadyLogged) hit(LONG_VISIT_KEY);
    }, 30000);
})();