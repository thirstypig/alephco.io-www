/**
 * Build blog posts from Markdown, and regenerate the blog index + sitemap entries.
 *
 * WHY THIS EXISTS (session 110). Publishing one post used to be THREE hand-edits:
 *
 *   1. `blog/<slug>.html`  — 59 lines of head boilerplate before <body>: title, meta
 *                            description, canonical, OG, Twitter, and Article JSON-LD
 *   2. `blog.html`         — a hand-maintained card in the index
 *   3. `sitemap.xml`       — a hand-maintained <url> entry
 *
 * Across the 25 posts scheduled to Feb 2027 that is 75 hand-edits, 25 of them a 59-line
 * SEO block copied from a neighbouring post. That is exactly how a post ships carrying the
 * PREVIOUS post's canonical URL — which silently de-indexes it, with nothing erroring and
 * nothing visible on the page. Hand-copied metadata is the failure mode you cannot see.
 *
 * This mirrors `build-learn-pages.mjs`, which already does the same job for the 22 /learn
 * articles and produces one of the site's top landing pages. Same repo, same proven shape.
 *
 * ─── Design notes ───────────────────────────────────────────────────────────
 *
 * ⚠️ The template is DERIVED FROM A REAL POST (`blog/_template.html`), so the nav, footer,
 * theme toggle and stylesheet links are byte-identical to the hand-written posts. A
 * separately-authored template would drift the moment the site chrome changed, and the
 * drift would only show on new posts.
 *
 * ⚠️ Legacy HTML posts are NOT migrated. The 12 existing posts rank; regenerating them
 * risks changing content or metadata on pages that are working. They are still READ, so
 * the index and sitemap stay complete — new posts are Markdown, old posts stay as they
 * are, and one generator owns the index.
 *
 * ⚠️ PUBLISHER is a single constant on purpose. It is currently "Aleph Compliance, Inc.",
 * which appears in 12 posts plus index/about/contact/blog/status — while the app footer
 * and Stripe both say "Pasadena Works, LLC d/b/a Aleph Co.". That discrepancy is a legal
 * question, not an engineering one, and is NOT resolved here. Fixing it should mean
 * changing this one line, not 25 copies.
 *
 * Usage:
 *   node scripts/build-blog.mjs            # build
 *   node scripts/build-blog.mjs --check    # verify only; non-zero exit if out of date
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

// BLOG_ROOT lets the test suite point the whole generator at a throwaway fixture tree.
// Without it the only way to exercise this script is against the REAL blog.html and
// sitemap.xml — which it rewrites in place, so a test run would be indistinguishable from
// a bad build. Defaults to the repo root, so normal use is unchanged.
const ROOT = process.env.BLOG_ROOT
  ? path.resolve(process.env.BLOG_ROOT)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const POSTS_DIR = path.join(ROOT, 'blog', 'posts');
const BLOG_DIR = path.join(ROOT, 'blog');
const TEMPLATE = path.join(ROOT, 'blog', '_template.html');
/** Gitignored. Drafts rendered here for reading only — never deployed. */
const PREVIEW_DIR = path.join(ROOT, 'blog', '_preview');
const INDEX = path.join(ROOT, 'blog.html');
const SITEMAP = path.join(ROOT, 'sitemap.xml');

const SITE_URL = (process.env.SITE_URL || 'https://www.alephco.io').replace(/\/$/, '');
/** See the note above — one place, deliberately. */
const PUBLISHER = 'Aleph Compliance, Inc.';
/** Average adult reading speed for prose, used for the "N min read" label. */
const WORDS_PER_MINUTE = 225;

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Minimal YAML frontmatter: `key: value` and `key: [a, b]`. No nesting needed here. */
function parseFrontmatter(raw, file) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error(`${file}: missing --- frontmatter block`);
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const i = line.indexOf(':');
    if (i < 0) throw new Error(`${file}: cannot parse frontmatter line: ${line}`);
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (val.startsWith('[')) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    }
    meta[key] = val;
  }
  return { meta, body: m[2] };
}

const REQUIRED = ['title', 'description', 'date'];

function validate(meta, file) {
  for (const k of REQUIRED) {
    if (!meta[k]) throw new Error(`${file}: frontmatter is missing required "${k}"`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) {
    throw new Error(`${file}: date must be YYYY-MM-DD, got "${meta.date}"`);
  }
  // Google truncates around these lengths. A warning, not a failure — a long title is a
  // judgement call, an unparseable date is not.
  if (meta.title.length > 60) console.warn(`  ! ${file}: title is ${meta.title.length} chars (>60 truncates in results)`);
  if (meta.description.length > 160) console.warn(`  ! ${file}: description is ${meta.description.length} chars (>160 truncates)`);
}

const prettyDate = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  });

const readingTime = (md) =>
  `${Math.max(1, Math.round(md.trim().split(/\s+/).length / WORDS_PER_MINUTE))} min read`;

/** Metadata for a legacy hand-written post, read back out of its own tags. */
async function readLegacyPost(file) {
  const html = await fs.readFile(path.join(BLOG_DIR, file), 'utf8');
  const pick = (re) => html.match(re)?.[1];
  const title = pick(/<title>([^<]*)<\/title>/);
  const description = pick(/<meta name="description" content="([^"]*)"/);
  const date = pick(/"datePublished":\s*"(\d{4}-\d{2}-\d{2})"/);
  if (!title || !date) return null;
  return { slug: file.replace(/\.html$/, ''), title, description: description || '', date, legacy: true };
}

async function main() {
  const check = process.argv.includes('--check');
  // ⚠️ Drafts are unviewable without this. `draft: true` correctly builds nothing, which
  // means the ONLY way to see a draft was to publish it — defeating the point of having a
  // draft state at all. --drafts renders them to blog/_preview/, which is gitignored and
  // never deployed, so previewing cannot leak an unfinished post.
  const withDrafts = process.argv.includes('--drafts');
  const template = await fs.readFile(TEMPLATE, 'utf8');

  await fs.mkdir(POSTS_DIR, { recursive: true });
  const mdFiles = (await fs.readdir(POSTS_DIR)).filter((f) => f.endsWith('.md')).sort();

  const generated = [];
  const drafts = [];
  for (const file of mdFiles) {
    const raw = await fs.readFile(path.join(POSTS_DIR, file), 'utf8');
    const { meta, body } = parseFrontmatter(raw, file);

    // ⚠️ DRAFTS ARE NEVER BUILT. Without this, dropping a half-written post into
    // blog/posts/ publishes it — and for regulatory content, publishing an unverified
    // claim is the failure this whole pipeline is supposed to make harder, not easier.
    // A draft is skipped entirely: no HTML, no index card, no sitemap entry.
    if (String(meta.draft).toLowerCase() === 'true' && !withDrafts) {
      drafts.push({
        file,
        slug: meta.slug || file.replace(/\.md$/, ''),
        title: meta.title || '(untitled)',
        date: meta.date || '(no date)',
      });
      continue;
    }

    validate(meta, file);

    const slug = meta.slug || file.replace(/\.md$/, '');
    const url = `${SITE_URL}/blog/${slug}.html`;
    const keywords = Array.isArray(meta.keywords) ? meta.keywords : [];
    // Per-post share card. `build-og-cards.mjs` writes img/blog/<slug>.png; the shared
    // og-default is the fallback only if a card has not been rendered yet. Every post
    // sharing one image was a distribution problem, not a cosmetic one.
    const image = meta.image
      ? `${SITE_URL}${meta.image.startsWith('/') ? '' : '/'}${meta.image}`
      : `${SITE_URL}/img/blog/${meta.slug || file.replace(/\.md$/, '')}.png`;

    const html = template
      .replaceAll('{{TITLE}}', escapeHtml(meta.title))
      .replaceAll('{{DESCRIPTION}}', escapeHtml(meta.description))
      .replaceAll('{{URL}}', url)
      .replaceAll('{{DATE}}', meta.date)
      .replaceAll('{{PUBLISHER}}', PUBLISHER)
      .replaceAll('{{KEYWORDS}}', JSON.stringify(keywords))
      .replaceAll('{{IMAGE}}', image)
      .replaceAll('{{BODY}}', marked.parse(body));

    const isDraft = String(meta.draft).toLowerCase() === 'true';
    const out = isDraft
      ? path.join(PREVIEW_DIR, `${slug}.html`)
      : path.join(BLOG_DIR, `${slug}.html`);
    if (!check) {
      if (isDraft) await fs.mkdir(PREVIEW_DIR, { recursive: true });
      await fs.writeFile(out, html, 'utf8');
    }
    if (isDraft) {
      drafts.push({ file, slug, title: meta.title, date: meta.date });
      console.log(`  preview  blog/_preview/${slug}.html   (DRAFT — not published)`);
      continue;
    }
    generated.push({
      slug, title: meta.title, description: meta.description, date: meta.date,
      read: meta.read || readingTime(body), legacy: false,
    });
    console.log(`  ${check ? 'would build' : 'built'}  blog/${slug}.html`);
  }

  // Legacy posts keep their place in the index. Anything regenerated above wins.
  const generatedSlugs = new Set(generated.map((p) => p.slug));
  const legacyFiles = (await fs.readdir(BLOG_DIR))
    .filter((f) => f.endsWith('.html') && !f.startsWith('_'))
    .filter((f) => !generatedSlugs.has(f.replace(/\.html$/, '')));

  const legacy = (await Promise.all(legacyFiles.map(readLegacyPost))).filter(Boolean);

  const posts = [...generated, ...legacy].sort((a, b) => b.date.localeCompare(a.date));

  if (drafts.length > 0) {
    console.log(`\n  ${drafts.length} draft(s) SKIPPED — set \`draft: false\` to publish:`);
    for (const d of drafts) console.log(`    · ${d.date}  ${d.title}  (${d.file})`);
  }

  // ⚠️ The guard is on SOURCES, not on publishable output. It exists so a broken glob
  // cannot silently wipe blog.html — but "every post is currently a draft" is a legitimate
  // state (a site mid-authoring), and throwing on it would block the drafts-only workflow
  // this generator is built around. Found by tests/validate-blog-build.mjs.
  if (mdFiles.length === 0 && legacy.length === 0) {
    throw new Error('no post sources found (no blog/posts/*.md, no blog/*.html) — refusing to write an empty index');
  }
  console.log(`\n  ${posts.length} posts (${generated.length} markdown, ${legacy.length} legacy html)`);

  // ── Index cards ────────────────────────────────────────────────────────────
  const cards = posts
    .map((p) => {
      const read = p.read || '6 min read';
      return `        <div class="blog-card" data-publish="${p.date}" data-slug="blog/${p.slug}.html" data-read="${read}">
          <div class="blog-meta">${prettyDate(p.date)} &middot; ${read}</div>
          <h3><a href="blog/${p.slug}.html">${escapeHtml(p.title)}</a></h3>
          <p class="blog-excerpt">${escapeHtml(p.description)}</p>
        </div>`;
    })
    .join('\n\n');

  const index = await fs.readFile(INDEX, 'utf8');
  const START = '<!-- BLOG_CARDS:START -->';
  const END = '<!-- BLOG_CARDS:END -->';
  if (!index.includes(START) || !index.includes(END)) {
    throw new Error(
      `blog.html has no ${START} / ${END} markers — add them around the card list so this ` +
        `script owns that block instead of guessing where it begins.`,
    );
  }
  const nextIndex =
    index.slice(0, index.indexOf(START) + START.length) + '\n' + cards + '\n        ' +
    index.slice(index.indexOf(END));

  // ── Sitemap ────────────────────────────────────────────────────────────────
  const sitemap = await fs.readFile(SITEMAP, 'utf8');
  const withoutBlog = sitemap.replace(/^.*<loc>[^<]*\/blog\/[^<]*<\/loc>.*\n/gm, '');
  // ⚠️ A post dated in the FUTURE is not in the sitemap. blog.html's auto-release script
  // dims and unlinks a future card, but the POST PAGE itself is still live at its URL —
  // "hidden" only ever meant the index card. Submitting an unreleased post to search
  // engines would publish it early through the back door, which is precisely the kind of
  // gap that only shows up once it has already happened.
  const today = new Date().toISOString().slice(0, 10);
  const released = posts.filter((p) => p.date <= today);
  const scheduled = posts.filter((p) => p.date > today);
  if (scheduled.length > 0) {
    console.log(`\n  ${scheduled.length} scheduled post(s) built but NOT in the sitemap until their date:`);
    for (const p of scheduled) console.log(`    · ${p.date}  ${p.title}`);
  }
  const blogUrls = released
    .map((p) => `  <url><loc>${SITE_URL}/blog/${p.slug}.html</loc><lastmod>${p.date}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`)
    .join('\n');
  const nextSitemap = withoutBlog.replace('</urlset>', `${blogUrls}\n</urlset>`);

  if (check) {
    const stale = [];
    if (nextIndex !== index) stale.push('blog.html');
    if (nextSitemap !== sitemap) stale.push('sitemap.xml');
    if (stale.length) {
      console.error(`\n[build-blog] OUT OF DATE: ${stale.join(', ')} — run: node scripts/build-blog.mjs`);
      process.exit(1);
    }
    console.log('\n[build-blog] up to date.');
    return;
  }

  // ── schedule.json — the admin blog calendar's data source ──────────────────
  //
  // ⚠️ This file was HAND-EDITED until session 110, which is the same drift the index and
  // sitemap had: /admin/blog reads it via server/routes/admin-blog.ts, so a stale file
  // makes the admin calendar quietly disagree with the site. It held 12 published and ZERO
  // planned while 25 posts were scheduled — so the schedule was, in practice, unviewable.
  //
  // `planned` vs `published` is decided by the DATE, not by a hand-set field: a post whose
  // date has arrived is published, because that is exactly what blog.html's auto-release
  // script decides too. One rule, two consumers.
  const schedule = {
    generated: new Date().toISOString().slice(0, 10),
    // ⚠️ DRAFTS ARE INCLUDED HERE and nowhere else. /admin/blog exists to show what is
    // COMING, and a pipeline you cannot see is not a pipeline. They are still not built,
    // not in blog.html, and not in the sitemap — this is a private admin view, fed by a
    // file that is public but unlinked.
    posts: [...posts, ...drafts.map((d) => ({ ...d, draft: true }))]
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((p) => ({
      slug: p.slug,
      title: p.title,
      status: p.date <= today ? 'published' : 'planned',
      ...(p.date <= today ? { publishedDate: p.date } : { targetDate: p.date }),
      image: `/img/blog/${p.slug}.png`,
      url: `${SITE_URL}/blog/${p.slug}.html`,
      ...(p.draft ? { draft: true } : {}),
    })),
  };
  await fs.writeFile(path.join(ROOT, 'blog', 'schedule.json'), JSON.stringify(schedule, null, 2) + '\n', 'utf8');

  await fs.writeFile(INDEX, nextIndex, 'utf8');
  await fs.writeFile(SITEMAP, nextSitemap, 'utf8');
  console.log(`  index   blog.html      (${posts.length} cards)`);
  console.log(`  sitemap sitemap.xml    (${released.length} blog urls; ${scheduled.length} scheduled, excluded)`);
  console.log(`  schedule blog/schedule.json (${schedule.posts.length} entries for /admin/blog; ${drafts.length} draft)`);
  console.log('\n[build-blog] done.');
}

main().catch((err) => {
  console.error('[build-blog] FAILED:', err.message);
  process.exit(1);
});
