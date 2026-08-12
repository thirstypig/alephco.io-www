# Aleph Marketing Site (alephco.io-www)

## Project Overview
- Marketing site for Aleph at **alephco.io**
- Static HTML/CSS/JS — no framework, no build step
- Repo: https://github.com/thirstypig/alephco.io-www
- Separate from the app repo (`alephco.io-app`) — the React/Express platform lives at app.alephco.io

## Tech Stack

Plain HTML + CSS + vanilla JS. **No framework, no bundler, no npm production dependencies** —
`package.json` exists only for the local dev server (`npm run dev`, port 3060) and the structural
tests (`npm test`). All styles live in `css/style.css`; all behavior in `js/main.js`. Keep it that
way — adding a build step breaks the GitHub Pages deploy assumption below.

## Pages

`ls *.html features/ for/ compare/ blog/` for the inventory. Two are not obvious from filename:
`confirm.html` and `unsubscribe.html` are the email-list double-opt-in surfaces
(`/confirm?token=` and `/unsubscribe?token=`) — minimal chrome, `noindex`, and **button-triggered
POSTs** to `app.alephco.io/api/subscribe/*` so email scanners can't fire them by prefetching a link.

Blog style + schedule conventions: `docs/blog-writing-guide.md`.

## Blog System
- Blog index: `blog.html` — cards with `data-publish="YYYY-MM-DD"` attributes
- Blog posts: `blog/*.html` — 12 individual post pages
- Auto-release: inline `<script>` on blog.html checks current date, dims future posts, removes links, shows "Coming [weekday]" label
- Schedule: posts release on Mondays
- Future posts are listed in HTML but hidden client-side until their publish date

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
- **GA4** — `G-B3X5H4KJ11` tracking on all pages

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
- `npm test` — runs `tests/validate-structure.mjs` (1,158 structural checks across 30 pages)
- Validates: nav consistency (no "Home" link, exactly 3 nav links), footer structure (grid, 4 columns, brand, bottom bar, column headings), internal link integrity (all `href` resolve to real files), CSS class presence
- Zero dependencies — Node built-ins only
