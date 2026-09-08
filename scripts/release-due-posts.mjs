/**
 * Flip `draft: true` -> `draft: false` for every post whose publish date has ARRIVED.
 *
 * Run: node scripts/release-due-posts.mjs [--check]
 * Zero dependencies — Node built-ins only.
 *
 * ─── Why this exists ───────────────────────────────────────────────────────────
 *
 * The 25-post schedule (todo 539) runs weekly to Feb 2027. Publishing was a MANUAL flag
 * flip per post, which put 24 manual acts inside a cadence that has already failed once —
 * 12 posts shipped Apr–Jun 2026, then eleven weeks of silence.
 *
 * ⚠️ AND THE OBVIOUS SHORTCUT IS WRONG. Flipping all 25 to `draft: false` up front does
 * NOT schedule them: `build-blog.mjs` builds a future-dated post and serves it live at its
 * URL, withholding only the sitemap entry and the index-card link. So every future post
 * would be publicly readable today. `draft: true` is the only state that builds nothing.
 *
 * Hence this: posts stay `draft: true` until their date arrives, and a scheduled workflow
 * runs this script to release whatever is due.
 *
 * ─── What it deliberately does NOT do ──────────────────────────────────────────
 *
 * It does not judge the post. `build-blog.mjs`'s publish gate is the guard that refuses an
 * uncited regulatory claim, and it runs AFTER this script in the same workflow. If a post
 * is not fit to publish, the build fails and nothing is committed. Do not duplicate that
 * check here — one gate, in one place.
 */
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
// BLOG_ROOT points the script at a throwaway fixture tree, matching build-blog.mjs.
const ROOT = process.env.BLOG_ROOT
  ? resolve(process.env.BLOG_ROOT)
  : resolve(__dirname, "..");
const POSTS_DIR = join(ROOT, "blog", "posts");

const checkOnly = process.argv.includes("--check");

/**
 * "Today" in the site's own terms. RELEASE_TODAY lets a test pin the clock; without it a
 * test would pass or fail depending on the day it ran, which is the kind of test that goes
 * red on a Tuesday and gets deleted.
 */
const today = process.env.RELEASE_TODAY || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) {
  console.error(`[release] RELEASE_TODAY must be YYYY-MM-DD, got "${today}"`);
  process.exit(1);
}

const files = readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md")).sort();
const released = [];
const pending = [];

for (const file of files) {
  const path = join(POSTS_DIR, file);
  const src = readFileSync(path, "utf-8");
  const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) continue;

  const body = fm[1];
  const isDraft = /^draft:\s*true\s*$/im.test(body);
  if (!isDraft) continue;

  const dateLine = body.match(/^date:\s*(\d{4}-\d{2}-\d{2})\s*$/m);
  if (!dateLine) {
    // A draft with no usable date is not releasable, and silently skipping it is how a post
    // sits unpublished forever. Say so.
    console.warn(`[release] SKIPPED ${file} — draft with no valid \`date:\``);
    continue;
  }

  const date = dateLine[1];
  // String compare is safe and correct for ISO dates, and avoids a timezone class of bug:
  // `new Date("2026-09-14")` is UTC midnight, which is the 13th in Los Angeles.
  if (date > today) {
    pending.push({ file, date });
    continue;
  }

  released.push({ file, date });
  if (!checkOnly) {
    // Replace only within the frontmatter block, so the word "draft: true" appearing in a
    // post's BODY (entirely plausible in a post about publishing) is never rewritten.
    const nextFm = body.replace(/^draft:\s*true\s*$/im, "draft: false");
    writeFileSync(path, src.replace(fm[1], nextFm), "utf-8");
  }
}

for (const p of released) {
  console.log(`  ${checkOnly ? "would release" : "released"}  ${p.file}  (${p.date})`);
}

if (released.length === 0) {
  console.log(`[release] nothing due as of ${today}. ${pending.length} scheduled.`);
} else {
  console.log(
    `[release] ${released.length} post(s) ${checkOnly ? "due" : "released"} as of ${today}; ` +
      `${pending.length} still scheduled.`,
  );
}

// The workflow reads this to decide whether there is anything to commit.
if (process.env.GITHUB_OUTPUT) {
  const fs = await import("fs");
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `released=${released.length}\n`);
}
