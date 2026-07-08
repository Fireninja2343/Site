/*
 Minimal backup visit counter.
 */
(function () {
    const COUNTER_NAMESPACE = 'fireninja-portfolio';
    const COUNTER_NAME = 'visits';
    const SESSION_FLAG = 'fn_visit_logged';

    /* Count once per browser session (not per page load) so refreshing
       or navigating back and forth doesn't inflate the number. */
    try {
        if (sessionStorage.getItem(SESSION_FLAG)) return;
    } catch (e) {
        // Some privacy modes throw on sessionStorage access — skip the dedupe check.
    }

    const endpoint = `https://api.counterapi.dev/v1/${COUNTER_NAMESPACE}/up/${COUNTER_NAME}`;

    fetch(endpoint, { keepalive: true })
        .then(() => {
            try { sessionStorage.setItem(SESSION_FLAG, '1'); } catch (e) { /* ignore */ }
        })
        .catch(() => {
            // Best-effort only — this is a personal curiosity counter, not
            // something worth retrying, logging, or alerting on.
        });
})();