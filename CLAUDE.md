# Aleph Marketing Site (alephco.io-www)

## Project Overview
- Marketing site for Aleph at **alephco.io**
- Static HTML/CSS/JS — no framework, no build step
- Repo: https://github.com/thirstypig/alephco.io-www
- Separate from the app repo (`alephco.io-app`) — the React/Express platform lives at app.alephco.io

## Tech Stack
- Plain HTML + CSS + vanilla JavaScript
- `css/style.css` — all styles, CSS custom properties for theming
- `js/main.js` — nav toggle, theme toggle, FAQ accordion, contact form, email signup, live status check
- `package.json` — local dev server (`npm run dev` on port 3060) + structural tests (`npm test`)
- No npm production dependencies, no bundler

## Pages (32 HTML files)

### Root Pages (11)
| File | Purpose |
|---|---|
| `index.html` | Homepage — hero, problem/solution, module overview, email signup, status |
| `how-it-works.html` | Step-by-step platform walkthrough |
| `industries.html` | Target industries — 3 active (Food & Beverage, Children's Products, Consumer Goods) + 5 coming soon |
| `pricing.html` | Pricing tiers (Starter/Growth/Pro) + compliance FAQ accordion |
| `about.html` | Company and founder info |
| `blog.html` | Blog index with auto-release system (11 posts) |
| `contact.html` | Contact form (Formspree integration) |
| `status.html` | System status with 90-day uptime bars |
| `terms.html` | Terms of Service |
| `privacy.html` | Privacy Policy |
| `404.html` | Custom 404 page |

### Feature Pages (`features/`, 4)
| File | Purpose |
|---|---|
| `features/cpsia-cpc-generator.html` | CPSIA & CPC certificate generation landing |
| `features/prop-65-labels.html` | Prop 65 warning label generation landing |
| `features/pfas-tracking.html` | PFAS disclosure tracking landing |
| `features/fsvp-management.html` | FSVP audit management landing |

### Audience Pages (`for/`, 3)
| File | Purpose |
|---|---|
| `for/food-importers.html` | Food & beverage importer landing |
| `for/toy-importers.html` | Children's product importer landing |
| `for/amazon-sellers.html` | Amazon/marketplace seller landing |

### Comparison Pages (`compare/`, 2)
| File | Purpose |
|---|---|
| `compare/assent-compliance.html` | Aleph vs Assent Compliance |
| `compare/registrar-corp.html` | Aleph vs Registrar Corp |

### Blog Posts (`blog/`, 12)
See `docs/blog-writing-guide.md` for schedule and style conventions.

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
- **Email signup** — localStorage-based (ready for API integration)
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
- No build step — entire repo is uploaded as-is

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
- Pricing page buttons are "Coming Soon" — disabled with inline `pointer-events:none`
- Blog posts auto-release based on client-side date check (not server-side)
- Copyright year: 2026
- CNAME file must not be deleted — it configures the GitHub Pages custom domain

## Testing
- `npm test` — runs `tests/validate-structure.mjs` (1,158 structural checks across 30 pages)
- Validates: nav consistency (no "Home" link, exactly 3 nav links), footer structure (grid, 4 columns, brand, bottom bar, column headings), internal link integrity (all `href` resolve to real files), CSS class presence
- Zero dependencies — Node built-ins only
