# Aleph Marketing Site (alephco.io-www)

## CHARTER — read this first

**You are the Content agent for Aleph.** You own this repo — blog, marketing pages, SEO,
`/learn`. Boundaries first, because tasks change and these do not.

### Boundaries

- 🔴 **Never edit `alephco.io-app`.** If something needs an app change, write it up and hand
  it back rather than crossing the boundary. Reading that repo for verification is fine and
  is often required (see below).
- 🔴 **Never push to `main`.** Branch → PR → James merges. The `main` push is what deploys.
- 🔴 **Never flip a `draft` flag by hand.** See the Blog System section — publishing is
  automated, and a future-dated post set to `draft: false` goes live at its URL immediately.

### Before publishing anything

- **Every regulatory claim needs a primary source in `sources:`**, and the build throws
  without one. Quote the statute or the agency's own page, never recall. Session 99 published
  the **wrong Maine PFAS law** to this site, SEO-indexed, and it stayed. Blog and help content
  are the two surfaces with no citation guard other than this one.
- **Never claim an Aleph feature you have not verified exists and is reachable.** Check
  `shared/plan-entitlements.ts` and the actual UI in the app repo. Session 103 found **nine
  false product claims** live here; session 108 found the homepage advertising
  "send supplier questionnaires with one click" for a feature no customer could reach since
  2026-07-10.
- **`pricing.html` claims are commitments** — the buttons are live and real cards get charged.
- ⚠️ **A reachable primary source can still be stale.** Prefer the eCFR versioner API and the
  agency's own page over aggregators; several are hard-blocked by bot protection.

### Current board

- **539** — the weekly schedule, now 31 posts, interleaved, to 2027-04-05 (#33). Post 1
  shipped 2026-09-07; the rest release automatically. ⚠️ 539's own §4 table is the older
  25-post clustered schedule — `blog/schedule.json` and each post's `date:` are current.
- **539 §6 measurement** — readings live in `docs/seo-measurement-log.md` (append-only; §6
  itself is in the app repo and is read-only from here). Baseline confirmed 2026-09-11:
  **11 organic sessions/month**, so §6's "beat 86 in a month" target is ~8× the run rate.
  ⚠️ Always filter GA4 to `hostName = www.alephco.io`, and report sessions WITH users — one
  returning visitor was 9 of September's 22 organic sessions.
- **566** — counsel copy review. The brief is
  `docs/marketing/document-readiness-counsel-review-brief.md` in the app repo (**read-only**).
  ⚠️ Nothing in its section 3 may be published until section 4 is answered.

### Verifying your work

`npm run dev` (port **3060**), `npm test`, and `npm run check:blog` before every PR. Load the
page and look at it — the structure suite cannot see a layout that is broken but present.

---

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
- ⚠️ **`sources:` is REQUIRED to publish.** A post with `draft: false` must carry
  `sources: [https://…]` — at least one absolute https primary source — and must contain
  no placeholder marker (`PLACEHOLDER`, `TODO`, `TKTK`, `XXX`, `[TBD]`, `NOT PUBLISHABLE`)
  in body or frontmatter. The build THROWS otherwise. `draft: true` guards an unfinished
  post leaking; it guarded nothing at the moment someone deliberately published, which is
  exactly when an unverified regulatory claim goes out. Drafting is unaffected.
  `npm run check:blog` lists every draft and what still blocks it.
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

### 🔴 Publishing is AUTOMATED — never flip a `draft` flag by hand

`.github/workflows/publish-scheduled-posts.yml` runs **Mondays 13:00 UTC**. It installs
(`npm ci`), then calls `scripts/release-due-posts.mjs`, which flips `draft: true` → `false`
for every post whose date has ARRIVED. Then it builds (the publish gate runs), **stages**,
runs `npm test`, commits, and **explicitly dispatches `deploy.yml`**.

🔴 **Two of those steps are ordering constraints, not conveniences, and session 117 found
both by rehearsing a release that had never actually happened.** Guarded by
`tests/validate-release-due-posts.mjs`, which was red against the old workflow for each:
- **`npm ci` before the build.** `build-blog.mjs` imports `marked`, a devDependency. The
  workflow installed nothing, so the first real release would have died at the build step.
- **`git add -A` before `npm test`.** `validate-structure.mjs` inventories from
  `git ls-files`, which cannot see the HTML the build just wrote — the suite failed with
  "listed in the inventory but is not a tracked file". Post 1 hit this same error in CI.
  Staging first also means the suite judges exactly the tree that gets committed.

⚠️ **Do not "schedule" posts by setting them all to `draft: false`.** A future-dated post
with `draft: false` is BUILT and is LIVE AT ITS URL — only the sitemap entry and the index
card link are withheld. `draft: true` is the only state that builds nothing at all. This is
the trap the automation exists to avoid; setting the flags by hand walks straight back into
it.

📌 It releases everything **due**, not "this Monday's post", so a missed or delayed run
catches up rather than dropping a post forever.

🔴 **The deploy dispatch step is load-bearing and its absence is silent.** A push made with
`GITHUB_TOKEN` does not trigger other workflows, so without it the post lands on `main`,
looks published in every way, and never reaches the site — a green workflow and an unchanged
website. Do not remove it as redundant.

To rehearse: **Actions → Publish scheduled posts → Run workflow.** It is a no-op unless
something is due.

⚠️ **A no-op run proves almost nothing, and it looks identical to a real one.** Everything
after the release script is `if: released != '0'`, so a run with nothing due skips the
build, the staging, the suite, the commit and the deploy dispatch — five of the six steps
that can fail. The 2026-09-08 rehearsal was green for exactly that reason while two defects
sat in the path. `npm ci` is deliberately unconditional so at least the install is exercised
on every run.

To rehearse the **release path** instead, drive it locally against a throwaway worktree with
the clock pinned — this is what found both defects, four days before they would have fired:

```bash
git worktree add --detach /tmp/rehearsal HEAD && cd /tmp/rehearsal
npm ci
RELEASE_TODAY=2026-09-14 node scripts/release-due-posts.mjs   # the next Monday
npm run build:blog && git add -A && npm test                   # the workflow's own order
git diff --cached --stat                                       # what the bot would commit
```

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
- Triggers on push to `main`, on pull_request (tests only, no deploy), or workflow_dispatch
- ⚠️ **`deploy` needs the `test` job.** A red suite blocks publication. Until session 116
  nothing in CI ran `npm test` at all — the suite's only consumer was a human typing it,
  which is why it could sit 22-red indefinitely. Free minutes: this repo is public.
- CNAME file: `www.alephco.io`
- Build step: `npm ci && npm run build:learn` runs in CI to regenerate `/learn/*` static pages from Supabase before upload
- **Required GitHub repository secrets:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` (anon key only — never service role). Without these, the build step fails and the deploy is blocked.
- The rest of the repo (hand-written `.html` files) is uploaded as-is

## DNS Records (Cloudflare — NOT Squarespace)

⚠️ **DNS was delegated to Cloudflare on 2026-08-25. Squarespace is the registrar only, and
its DNS editor silently does nothing.** A DMARC record added there in session 115 never
resolved. Run `dig NS alephco.io` before giving anyone DNS instructions.
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
- `npm test` — runs BOTH `tests/validate-structure.mjs` (structural checks across all
  pages) and `tests/validate-blog-build.mjs` (behavioural tests for the blog generator,
  run against a throwaway fixture tree via `BLOG_ROOT`). **Expect green.**
  ⚠️ This suite used to be permanently RED with 22 pre-existing failures, and this file
  used to tell you to compare the count rather than expect green. Both are fixed
  (session 116): `privacy.html`/`terms.html` are redirect stubs and are now judged as
  such. **An accepted-red gate has no signal** — the next real regression arrived as
  "23 of 1418" and nobody read the difference. If you see a failure, it is a failure.
- `npm run check:blog` — runs the generator against the REAL `blog/posts/` without
  writing anything. CI runs this too, so a pull request that publishes an uncited post
  fails at review rather than at deploy.
- Validates: nav consistency (no "Home" link, exactly 3 nav links), footer structure (grid, 4 columns, brand, bottom bar, column headings), internal link integrity (all `href` resolve to real files), CSS class presence
- Zero dependencies — Node built-ins only
