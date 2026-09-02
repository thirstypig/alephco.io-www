/*
 * GA4 initialisation for alephco.io — ONE file, referenced by every page.
 *
 * ⚠️ THE HOST CHECK IS LOAD-BEARING, and this is the second repo to need it.
 *
 * The app repo (app.alephco.io) had the identical defect: `gtag('config', …)` ran
 * unconditionally, so the dev server and the Playwright suite reported as real visitors.
 * Measured in GA4 for 2026-08-03 → 2026-08-30: 5,109 of 5,210 active users came from
 * `localhost` — 98% — with 37,299 pageviews on `/login` alone. Real marketing traffic in
 * the same window was 96 users. Fixed there in session 110; this repo was left exposed and
 * is fixed here in session 111.
 *
 * `npm run dev` serves this site on localhost:3060, so every local preview of the marketing
 * site was being counted too.
 *
 * ALLOWLIST, not a blocklist. A new environment — a branch deploy, a preview URL,
 * thirstypig.github.io — stays silent until someone deliberately adds it here. Excluding
 * only "localhost" is what let `alephco-staging.up.railway.app` through in the app repo.
 *
 * ⚠️ It also declines to LOAD the Google tag at all off-allowlist, rather than loading it
 * and muting `gtag`. Muting alone still fetches from googletagmanager.com on every local
 * page view, which is a third-party request a reader of this file would not expect.
 *
 * Guarded by tests/validate-structure.mjs → "analytics is centralised and host-guarded",
 * which asserts no page re-inlines a `gtag('config', …)` call.
 */
(function () {
  var MEASUREMENT_ID = "G-B3X5H4KJ11";
  var ANALYTICS_HOSTS = ["alephco.io", "www.alephco.io"];

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("js", new Date());

  if (ANALYTICS_HOSTS.indexOf(window.location.hostname) === -1) {
    // Replace the global with a no-op so any future inline `gtag('event', …)` on a page
    // is inert too — guarding only the `config` call is what left SPA route tracking live
    // in the app repo and produced the 37,299 /login pageviews.
    window.gtag = function () {};
    return;
  }

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID;
  document.head.appendChild(s);

  gtag("config", MEASUREMENT_ID);
})();
