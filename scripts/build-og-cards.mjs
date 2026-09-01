/**
 * Generate a branded social-share card (og:image) per blog post.
 *
 * WHY THIS EXISTS (session 110). Every post shared ONE image:
 *
 *   $ grep -h 'property="og:image"' blog/*.html | sort | uniq -c
 *     13   <meta property="og:image" content=".../img/og-default.png">
 *
 * So every LinkedIn, Slack and Twitter preview of every Aleph post looked identical. That
 * is not a decoration problem, it is a DISTRIBUTION problem: the share card is most of what
 * decides whether a link gets clicked, and 12 posts were competing with one picture.
 *
 * ─── Why cards and not photography ──────────────────────────────────────────
 *
 * Compliance stock photography is uniformly terrible, and generic AI imagery reads as
 * filler — which actively costs credibility for a product whose entire pitch is rigor.
 * A typographic card in the brand palette is cheap, consistent, unmistakably ours, and
 * carries the one thing that actually earns the click: the headline.
 *
 * ─── Why the PNGs are COMMITTED, not built in CI ────────────────────────────
 *
 * ⚠️ Rendering needs `rsvg-convert` (librsvg). The marketing site's whole premise is a
 * zero-dependency static deploy — CLAUDE.md: "no framework, no bundler". Requiring a system
 * package in the deploy job to render an image that changes only when a title changes would
 * trade a real constraint for no benefit. So: run this locally, commit the PNGs, and CI
 * stays untouched.
 *
 * Usage:
 *   node scripts/build-og-cards.mjs             # only posts missing a card
 *   node scripts/build-og-cards.mjs --force     # re-render everything
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const BLOG_DIR = path.join(ROOT, 'blog');
const OUT_DIR = path.join(ROOT, 'img', 'blog');

/** Manifest palette. Keep in step with the app's design system. */
const NAVY = '#1f3a5f';
const CREAM = '#f3eee2';
const TOMATO = '#c43a2e';

const WIDTH = 1200;
const HEIGHT = 630; // the OG spec ratio every platform crops to

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Wrap a headline onto lines that fit the card.
 *
 * ⚠️ Character-count wrapping, not real text measurement — rsvg has no layout API we can
 * query here. The limit is deliberately conservative so a wide title (all caps, many W's)
 * still fits rather than overflowing the card edge, which no test would catch and which
 * would only ever be seen by someone looking at a share preview.
 */
function wrap(text, maxChars = 26, maxLines = 4) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (candidate.length > maxChars && line) {
      lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[\s.,;:]+$/, '')}…`;
    return kept;
  }
  return lines;
}

function cardSvg({ title, kicker }) {
  const lines = wrap(title);
  // Larger type for short headlines, smaller for long ones, so the card stays balanced.
  const size = lines.length <= 2 ? 76 : lines.length === 3 ? 64 : 54;
  const lineHeight = Math.round(size * 1.22);
  const blockHeight = lines.length * lineHeight;
  const startY = Math.round((HEIGHT - blockHeight) / 2) + size - 8;

  const tspans = lines
    .map((l, i) => `<tspan x="80" y="${startY + i * lineHeight}">${esc(l)}</tspan>`)
    .join('\n      ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${NAVY}"/>
  <rect x="0" y="0" width="16" height="${HEIGHT}" fill="${TOMATO}"/>
  <text x="80" y="96" fill="${CREAM}" font-family="Helvetica, Arial, sans-serif"
        font-size="30" font-weight="700" letter-spacing="7" opacity="0.85">ALEPH</text>
  <text fill="${CREAM}" font-family="Helvetica, Arial, sans-serif"
        font-size="${size}" font-weight="700">
      ${tspans}
  </text>
  <rect x="80" y="${HEIGHT - 92}" width="72" height="6" fill="${TOMATO}"/>
  <text x="80" y="${HEIGHT - 48}" fill="${CREAM}" font-family="Helvetica, Arial, sans-serif"
        font-size="26" opacity="0.75">${esc(kicker)}</text>
</svg>`;
}

/** Frontmatter title + kicker for a Markdown post. */
async function fromMarkdown(file) {
  const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const get = (k) => m[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim().replace(/^["']|["']$/g, '');
  const title = get('title');
  if (!title) return null;
  return { slug: get('slug') || file.replace(/\.md$/, ''), title, kicker: 'alephco.io' };
}

/** Title for a legacy hand-written post, read back out of its own <title>. */
async function fromHtml(file) {
  const html = await fs.readFile(path.join(BLOG_DIR, file), 'utf8');
  const raw = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (!raw) return null;
  // Strip the " | Aleph"-style suffix; the card already says ALEPH.
  const title = raw.split(/\s+[|—]\s+/)[0].trim();
  return { slug: file.replace(/\.html$/, ''), title, kicker: 'alephco.io' };
}

async function main() {
  const force = process.argv.includes('--force');
  await fs.mkdir(OUT_DIR, { recursive: true });

  const mdFiles = await fs.readdir(POSTS_DIR).catch(() => []);
  const htmlFiles = (await fs.readdir(BLOG_DIR)).filter((f) => f.endsWith('.html') && !f.startsWith('_'));

  const posts = [
    ...(await Promise.all(mdFiles.filter((f) => f.endsWith('.md')).map(fromMarkdown))),
    ...(await Promise.all(htmlFiles.map(fromHtml))),
  ].filter(Boolean);

  // A Markdown post and its generated HTML are the same post — keep one.
  const seen = new Set();
  const unique = posts.filter((p) => (seen.has(p.slug) ? false : seen.add(p.slug)));

  if (unique.length === 0) throw new Error('no posts found — refusing to run against nothing');

  let made = 0, skipped = 0;
  for (const post of unique) {
    const png = path.join(OUT_DIR, `${post.slug}.png`);
    if (!force && await fs.access(png).then(() => true).catch(() => false)) {
      skipped += 1;
      continue;
    }
    const svg = path.join(OUT_DIR, `${post.slug}.svg`);
    await fs.writeFile(svg, cardSvg(post), 'utf8');
    await run('rsvg-convert', ['-w', String(WIDTH), '-h', String(HEIGHT), '-o', png, svg]);
    await fs.unlink(svg); // the SVG is an intermediate, not an artifact
    made += 1;
    console.log(`  card  img/blog/${post.slug}.png   ${post.title.slice(0, 58)}`);
  }

  console.log(`\n[og-cards] ${made} generated, ${skipped} already present (use --force to redo).`);
  console.log('[og-cards] PNGs are COMMITTED — CI does not render them.');
}

main().catch((err) => {
  console.error('[og-cards] FAILED:', err.message);
  process.exit(1);
});
