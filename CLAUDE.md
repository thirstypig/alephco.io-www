# Aleph Marketing Site (alephco.io-www)

## Project Overview
- Marketing site for Aleph at **alephco.io**
- Static HTML/CSS/JS — no framework, no bundler; two generator steps run in CI (see Tech Stack)
- Repo: https://github.com/thirstypig/alephco.io-www
- Separate from the app repo (`alephco.io-app`) — the React/Express platform lives at app.alephco.io

## Tech Stack

Plain HTML + CSS + vanilla JS. **No framework, no bundler, no npm production dependencies** —
`package.json` exists for the local dev server (`npm run dev`, port 3060), the structural tests
(`npm test`), and TWO static-site generators that run in CI before upload: `build:learn`
(/learn pages from Supabase) and `build:blog` (blog posts from Markdown). Those are the only
permitted build steps, and both only EMIT static HTML before upload — the deployed artifact is
still plain files. All styles live in `css/style.css`; all behavior in `js/main.js`. Keep it that
way: do not add a bundler or a framework, and do not introduce a step the site needs at RUNTIME.

## Pages

`ls *.html features/ for/ compare/ blog/` for the inventory. Two are not obvious from filename:
`confirm.html` and `unsubscribe.html` are the email-list double-opt-in surfaces
(`/confirm?token=` and `/unsubscribe?token=`) — minimal chrome, `noindex`, and **button-triggered
POSTs** to `app.alephco.io/api/subscribe/*` so email scanners can't fire them by prefetching a link.

Blog style + schedule conventions: `docs/blog-writing-guide.md`.

## Blog System

**New posts are Markdown. `npm run build:blog` generates everything else.**

- Source: `blog/posts/<slug>.md` — frontmatter (`title`, `description`, `date`, optional
  `slug`, `keywords`, `read`, `draft`) plus Markdown body.
- Generator: `scripts/build-blog.mjs`. Emits `blog/<slug>.html`, rewrites the card list in
  `blog.html` between `<!-- BLOG_CARDS:START -->` / `:END`, and rewrites the `/blog/` half
  of `sitemap.xml`. Runs in CI after `build:learn` (both write the sitemap).
- Template: `blog/_template.html` — **derived from a real post**, so nav/footer/theme are
  byte-identical to the hand-written ones and cannot drift.

⚠️ **`draft: true` means the post is not built at all** — no HTML, no card, no sitemap
entry. To READ one before publishing, `npm run preview:blog` renders drafts into
`blog/_preview/`, which is **gitignored** and never deployed (the deploy uploads the whole
repo, so a tracked preview dir would ship unfinished posts live). Use it for anything whose regulatory claims are unverified. Session 99 published the
wrong Maine PFAS law to this site, SEO-indexed; blog and help are the two surfaces with no
citation guard.

⚠️ **A future-dated post IS built and IS listed, but is kept OUT of the sitemap until its
date.** The auto-release script only dims the index card — the page itself is live at its
URL, so the sitemap is the only thing holding it back from search.

⚠️ **The 12 pre-existing posts are NOT migrated and must stay hand-written HTML.** They
rank; regenerating them risks changing metadata on working pages. The generator READS them
so the index and sitemap stay complete.

📌 `PUBLISHER` in the generator is one constant on purpose. It is currently
`"Aleph Compliance, Inc."`, which also appears in 12 posts plus index/about/contact/blog/
status — while the app footer and Stripe both say `Pasadena Works, LLC d/b/a Aleph Co.`
**That discrepancy is unresolved and is a legal question, not an engineering one.**

- Blog index: `blog.html` — cards with `data-publish="YYYY-MM-DD"` attributes
- Auto-release: inline `<script>` on blog.html checks current date, dims future posts,
  removes links, shows "Coming [weekday]" label
- Schedule: posts release on Mondays. The 25-post schedule to Feb 2027 is in the app repo,
  `todos/539-pending-p3-seo-and-blogging-expansion-plan.md`.

## Navigation Structure
- **Top nav**: Logo (links to `/`, serves as home button) + 3 links (How It Works, Industries, Pricing) + theme toggle + Log In CTA
- **Footer**: 5-column CSS grid (`.footer-grid`) — Brand + tagline, Product, Resources, Company, Legal — with copyright bar (`.footer-bottom`)
- **Mobile**: hamburger menu at 768px breakpoint; footer collapses to 2-col then 1-col
- **Path convention**: Root pages use `how-it-works.html`; subdirectory pages use `../how-it-works.html`
- All 30 pages (excluding 404) share identical nav and footer structure

## Features
- **Email signup** — double opt-in via `app.alephco.io/api/subscribe` (`handleSignup` in `main.js`). The homepage "Stay in the loop" form (bottom of `index.html`) has a hidden honeypot; on submit it POSTs the email, the visitor gets a confirmation email, and only confirmed addresses count. Confirm/unsubscribe happen on `/confirm` + `/unsubscribe`. No email is stored in the browser. Backend + `subscribers` table live in the app repo.
- **Live status indicator** — pings `app.alephco.io/api/health`, shows green/amber/red dot
- **Theme toggle** — light/dark, persisted in localStorage as `aleph-theme`
- **Dark mode** — CSS supports both `prefers-color-scheme: dark` and `data-theme="dark"` attribute
- **Mobile nav** — hamburger menu at 768px breakpoint
- **FAQ accordion** — `.faq-q` / `.faq-a` pattern on pricing page
- **GA4** — `G-B3X5H4KJ11`, initialised by **`js/analytics.js` only**. Every page loads that one
  file; no page inlines a `gtag()` call any more.

  ⚠️ **It is behind a hostname ALLOWLIST (`alephco.io`, `www.alephco.io`) and that guard is
  load-bearing.** Until session 111 all 38 pages inlined their own snippet and called
  `gtag('config', …)` unconditionally, so `npm run dev` on localhost:3060 counted every local
  preview as a real visitor. The app repo had the identical defect and it was not theoretical:
  GA4 for 2026-08-03 → 2026-08-30 showed **5,109 of 5,210 "active users" coming from localhost**
  — 98% noise — against 96 real marketing visitors. That one was fixed in app-session 110; this
  repo stayed exposed a session longer because nobody checked the sibling.

  **Allowlist, never a blocklist.** Excluding only "localhost" is what let a staging host through
  in the app repo. A new environment — a branch deploy, a preview URL, `thirstypig.github.io` —
  stays silent until someone adds it deliberately. Off-allowlist the file also declines to LOAD
  the Google tag at all, rather than loading it and muting `gtag`.

  `npm test` asserts this in both directions: no page may inline `gtag('config', …)` or load
  googletagmanager directly, at least 30 pages must still reference the loader (so deleting
  analytics outright is not a green result), and it **executes `analytics.js` against a fake
  window** for a live host and four off-allowlist hosts rather than grepping it.

## Deployment
- GitHub Pages via `.github/workflows/deploy.yml` (actions/deploy-pages)
- Triggers on push to `main` or manual workflow_dispatch
- CNAME file: `www.alephco.io`
- Build step: `npm ci && npm run build:learn` runs in CI to regenerate `/learn/*` static pages from Supabase before upload
- **Required GitHub repository secrets:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` (anon key only — never service role). Without these, the build step fails and the deploy is blocked.
- The rest of the repo (hand-written `.html` files) is uploaded as-is

## DNS Records (Squarespace)
- `alephco.io` → GitHub Pages (A records: 185.199.108-111.153)
- `www.alephco.io` → GitHub Pages (CNAME)
- `app.alephco.io` → Railway (CNAME)

## Design System (CSS Custom Properties)
**Colors:**
- Primary: `--teal-600: #0F6E56` (light), `--primary: #34d399` (dark)
- Accent: `--amber-500: #BA7517`
- Backgrounds: `--bg: #ffffff`, `--bg-subtle: #f9fafb`, `--bg-muted: #f3f4f6`
- Foreground: `--fg: #111827`, `--fg-muted: #6b7280`, `--fg-subtle: #9ca3af`

**Module colors:** FSVP=teal, CPSIA=amber, Prop 65=red, PFAS=blue

**Layout:** `--max-w: 1120px`, `--nav-h: 64px`

**Typography:** System font stack (`-apple-system, BlinkMacSystemFont, ...`), no web fonts

**Spacing:** `.section` = 5rem padding, `.section-sm` = 3.5rem, utility classes `.mt-1` through `.mt-4`

**Radius:** `--radius: 8px`, `--radius-lg: 12px`

## Important Notes
- "Log In" and "Get Started" link to `app.alephco.io/login` and `/register`
- `main.js` rewrites these to `localhost:4060` when running on localhost
- Local dev: `npm run dev` (serves on port 3060)
- **Pricing page buttons are LIVE (session 86)** — all four cards link out, three to
  `app.alephco.io/register` and Enterprise to `contact.html`. They were previously disabled
  `<span>`s with `pointer-events:none`. Real cards are charged from the app, so **any claim on
  `pricing.html` is now a commitment**: opening them exposed three that the product does not
  keep (Pro described as "unlimited products" — it is 500; a $2.99/SKU overage model deleted in
  app-session 85; and a 14-day free trial that does not exist). All corrected. Check a new claim
  against `alephco.io-app/shared/plan-entitlements.ts` before publishing it.
- ⚠️ **The billing-period toggle selects by `[data-billing]`, not by grid class.** It used to
  read `.grid-3[data-billing]` and guard with `if (!grid) return`, so adding the Enterprise card
  (`grid-3` → `grid-4`) would have silently disabled the whole Annual/Monthly switch — prices
  frozen, no console error. Do not reintroduce a class-coupled selector.
- Blog posts auto-release based on client-side date check (not server-side)
- Copyright year: 2026
- CNAME file must not be deleted — it configures the GitHub Pages custom domain

## Testing
- `npm test` — runs `tests/validate-structure.mjs` (structural checks across all pages).
  ⚠️ This suite is currently RED with **22 pre-existing failures** (`terms.html` /
  `privacy.html` missing footer structure). Compare the COUNT before and after a change
  rather than expecting green.
- `npm run test:blog` — runs `tests/validate-blog-build.mjs`: behavioural tests for the
  blog generator, executed against a throwaway fixture tree via `BLOG_ROOT`. Kept separate
  from `npm test` deliberately, so a green new suite is not buried under a red old one.
- Validates: nav consistency (no "Home" link, exactly 3 nav links), footer structure (grid, 4 columns, brand, bottom bar, column headings), internal link integrity (all `href` resolve to real files), CSS class presence
- Zero dependencies — Node built-ins only
