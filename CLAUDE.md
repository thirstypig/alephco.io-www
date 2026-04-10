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
- `package.json` exists but only for local dev (`python3 -m http.server 3060`)
- No npm production dependencies, no bundler

## Pages
| File | Purpose |
|---|---|
| `index.html` | Homepage — hero, problem/solution, module overview, email signup, status |
| `how-it-works.html` | Step-by-step platform walkthrough |
| `pricing.html` | Pricing tiers (Starter/Growth/Pro) + compliance FAQ accordion |
| `about.html` | Company and founder info |
| `blog.html` | Blog index with auto-release system |
| `contact.html` | Contact form (Formspree integration) |
| `404.html` | Custom 404 page |

## Blog System
- Blog index: `blog.html` — cards with `data-publish="YYYY-MM-DD"` attributes
- Blog posts: `blog/*.html` — individual post pages (currently: `why-i-built-aleph.html`)
- Auto-release: inline `<script>` on blog.html checks current date, dims future posts, removes links, shows "Coming [weekday]" label
- Schedule: posts release on Mondays
- Future posts are listed in HTML but hidden client-side until their publish date

## Features
- **Email signup** — localStorage-based (ready for API integration)
- **Live status indicator** — pings `app.alephco.io/api/health`, shows green/amber/red dot
- **Theme toggle** — light/dark, persisted in localStorage as `aleph-theme`
- **Dark mode** — CSS supports both `prefers-color-scheme: dark` and `data-theme="dark"` attribute
- **Mobile nav** — hamburger menu at 768px breakpoint
- **FAQ accordion** — `.faq-q` / `.faq-a` pattern on pricing page

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
