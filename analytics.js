/*
 Backup visit + engagement counters. All counters use
 countapi.mileshilliard.com, a free no-signup, no-key counting API,
 so there's nothing to configure or maintain. Each counter's current
 value is readable at any time by opening its endpoint URL directly,
 e.g. https://countapi.mileshilliard.com/api/v1/get/fn-portfolio-visits

 Counter keys used (see stats.html for a combined local view):

 Traffic
 - fn-portfolio-visits           one per session
 - fn-portfolio-long-visits      one per session, only if it passes 30s
 - fn-portfolio-umami-ok         one per visit, if window.umami loaded
 - fn-portfolio-umami-failed     one per visit, if window.umami never loaded

 Events (mirrors of the Umami events, so the local stats page can show
 a breakdown without needing Umami's API or an API key)
 - fn-portfolio-renders-clicked  one per lightbox open      (View Project)
 - fn-portfolio-ev-swap-card     one per gallery-card swap  (Swap Variant)
 - fn-portfolio-ev-swap-lightbox one per lightbox swap      (Swap Variant)
 - fn-portfolio-ev-copy-discord  one per Discord tag copy   (Copy Discord Tag)
 - fn-portfolio-ev-link-click    one per social link click  (Link Click)
 - fn-portfolio-ev-engaged-10s   one per visit past 10s     (Engaged Visitor)

 Adding a new event: pick a key, bump the counter list in stats.html,
 and call fnTrackEvent(key, umamiName, umamiData) from script.js.
 */
(function () {
    const BASE = 'https://countapi.mileshilliard.com/api/v1';
    const VISIT_KEY = 'fn-portfolio-visits';
    const LONG_VISIT_KEY = 'fn-portfolio-long-visits';
    const UMAMI_OK_KEY = 'fn-portfolio-umami-ok';
    const UMAMI_FAILED_KEY = 'fn-portfolio-umami-failed';
    const SESSION_FLAG = 'fn_visit_logged';

    const hit = (key) => fetch(`${BASE}/hit/${key}`, { keepalive: true }).catch(() => { /* best-effort */ });

    /* Single call site for "something happened": bumps the matching
       countapi counter and, when Umami actually loaded, sends the same
       event to Umami. script.js calls this instead of umami.track
       directly, so the local stats page and Umami stay in sync. */
    window.fnTrackEvent = function (counterKey, umamiName, umamiData) {
        if (counterKey) hit(counterKey);
        if (umamiName && window.umami) {
            window.umami.track(umamiName, umamiData);
        }
    };

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