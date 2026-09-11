/**
 * Behavioural tests for scripts/release-due-posts.mjs.
 *
 * This script publishes to a LIVE PUBLIC SITE with no human in the loop, on a schedule.
 * The interesting failures are all silent — releasing a post early, releasing nothing
 * forever, or rewriting the wrong line — so each test drives the REAL script against a
 * throwaway fixture tree via BLOG_ROOT, with the clock pinned via RELEASE_TODAY.
 *
 * Run: node tests/validate-release-due-posts.mjs
 * Zero dependencies — Node built-ins only.
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "fs";
import { spawnSync } from "child_process";
import { tmpdir } from "os";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = join(REPO, "scripts", "release-due-posts.mjs");

let passed = 0;
let failed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    failures.push(`${name}: ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function fixture(posts) {
  const root = mkdtempSync(join(tmpdir(), "release-"));
  mkdirSync(join(root, "blog", "posts"), { recursive: true });
  for (const p of posts) {
    const fm = [
      "---",
      `title: "${p.title || p.slug}"`,
      `description: "d"`,
      `date: ${p.date}`,
      ...(p.draft === undefined ? ["draft: true"] : p.draft ? ["draft: true"] : ["draft: false"]),
      "---",
      "",
      p.body || "Body text.",
      "",
    ].join("\n");
    writeFileSync(join(root, "blog", "posts", `${p.slug}.md`), fm, "utf-8");
  }
  return root;
}

/**
 * Returns stdout AND stderr combined, and throws on a non-zero exit.
 *
 * ⚠️ The warning for a dateless draft goes to `console.warn` — stderr — and an earlier
 * version of this harness read stdout only, so the test "expected a SKIPPED warning" failed
 * against a script that was emitting it correctly. A harness that cannot see the output it
 * asserts on reports a bug in the wrong place.
 */
function run(root, today, args = []) {
  const res = spawnSync("node", [SCRIPT, ...args], {
    env: { ...process.env, BLOG_ROOT: root, RELEASE_TODAY: today },
    encoding: "utf-8",
  });
  const out = `${res.stdout || ""}${res.stderr || ""}`;
  if (res.status !== 0) {
    const err = new Error(`exit ${res.status}`);
    err.output = out;
    throw err;
  }
  return out;
}

const read = (root, slug) =>
  readFileSync(join(root, "blog", "posts", `${slug}.md`), "utf-8");
const isDraft = (root, slug) => /^draft:\s*true\s*$/im.test(read(root, slug));

console.log("\nRelease due posts — behavioural checks\n");

check("releases a post whose date is TODAY", () => {
  const root = fixture([{ slug: "today", date: "2026-09-14" }]);
  run(root, "2026-09-14");
  assert(!isDraft(root, "today"), "a post dated today should have been released");
  rmSync(root, { recursive: true, force: true });
});

check("does NOT release a future post — the whole point", () => {
  const root = fixture([{ slug: "later", date: "2027-02-22" }]);
  run(root, "2026-09-14");
  assert(isDraft(root, "later"), "a future-dated post must stay draft");
  rmSync(root, { recursive: true, force: true });
});

check("releases a BACKLOG when runs were missed, not just the newest", () => {
  const root = fixture([
    { slug: "wk1", date: "2026-09-14" },
    { slug: "wk2", date: "2026-09-21" },
    { slug: "wk3", date: "2026-09-28" },
    { slug: "future", date: "2026-12-01" },
  ]);
  run(root, "2026-09-28");
  assert(!isDraft(root, "wk1"), "missed week 1 should be caught up");
  assert(!isDraft(root, "wk2"), "missed week 2 should be caught up");
  assert(!isDraft(root, "wk3"), "week 3 should release");
  assert(isDraft(root, "future"), "the future post must stay draft");
  rmSync(root, { recursive: true, force: true });
});

check("--check writes NOTHING", () => {
  const root = fixture([{ slug: "today", date: "2026-09-14" }]);
  const before = read(root, "today");
  run(root, "2026-09-14", ["--check"]);
  assert(read(root, "today") === before, "--check must not modify the file");
  rmSync(root, { recursive: true, force: true });
});

check("leaves an already-published post alone", () => {
  const root = fixture([{ slug: "live", date: "2026-09-01", draft: false }]);
  const before = read(root, "live");
  run(root, "2026-09-14");
  assert(read(root, "live") === before, "a published post must not be rewritten");
  rmSync(root, { recursive: true, force: true });
});

check("does NOT rewrite the words 'draft: true' in a post's BODY", () => {
  // Entirely plausible in a post about publishing — and a body rewrite would be invisible.
  const root = fixture([
    { slug: "meta", date: "2027-01-01", body: "Set `draft: true` to hide a post.\ndraft: true" },
  ]);
  run(root, "2026-09-14");
  const src = read(root, "meta");
  assert(src.includes("Set `draft: true` to hide"), "prose must be untouched");
  assert(/^draft:\s*true\s*$/im.test(src.split("---")[1]), "frontmatter must stay draft");
  rmSync(root, { recursive: true, force: true });
});

check("warns rather than silently skipping a draft with no date", () => {
  const root = mkdtempSync(join(tmpdir(), "release-"));
  mkdirSync(join(root, "blog", "posts"), { recursive: true });
  writeFileSync(
    join(root, "blog", "posts", "nodate.md"),
    '---\ntitle: "X"\ndraft: true\n---\n\nBody.\n',
    "utf-8",
  );
  const out = run(root, "2026-09-14");
  assert(/SKIPPED nodate\.md/.test(out), `expected a SKIPPED warning, got:\n${out}`);
  rmSync(root, { recursive: true, force: true });
});

check("rejects a malformed RELEASE_TODAY instead of guessing", () => {
  const root = fixture([{ slug: "today", date: "2026-09-14" }]);
  let threw = false;
  try {
    run(root, "last Monday");
  } catch {
    threw = true;
  }
  assert(threw, "a bad date must fail loudly, not fall back to now()");
  assert(isDraft(root, "today"), "nothing should be released on a bad date");
  rmSync(root, { recursive: true, force: true });
});

// ── The workflow, not the script ────────────────────────────────
//
// `validate-structure.mjs` builds its inventory from `git ls-files`, which does not see a
// file until it is staged. A released post's HTML is written by the build step, so if the
// suite runs BEFORE `git add`, the new page is "listed in the inventory but is not a
// tracked file" and every real release fails. It did, in a rehearsal of the first
// automated Monday (2026-09-14) — the only earlier run was a no-op, so nothing had ever
// exercised the path. Staging first also means the suite judges exactly what is committed.
check("publish workflow installs before building and stages before testing", () => {
  const yml = readFileSync(
    join(REPO, ".github", "workflows", "publish-scheduled-posts.yml"),
    "utf-8",
  );
  const lines = yml.split("\n").filter((l) => !l.trim().startsWith("#"));
  const install = lines.findIndex((l) => /run:\s*npm ci\b/.test(l));
  const build = lines.findIndex((l) => /run:\s*npm run build:blog\b/.test(l));
  const stage = lines.findIndex((l) => /\bgit add\b/.test(l));
  const suite = lines.findIndex((l) => /run:\s*npm test\b/.test(l));
  assert(build !== -1, "no `npm run build:blog` step found in the publish workflow");
  assert(stage !== -1, "no `git add` step found in the publish workflow");
  assert(suite !== -1, "no `npm test` step found in the publish workflow");
  // The same rehearsal's SECOND failure, which would have fired first: build-blog.mjs
  // imports `marked`, a devDependency, and the workflow never installed it. Invisible
  // until a post is actually due, because a no-op run skips the build entirely.
  assert(
    install !== -1 && install < build,
    "`npm ci` must run before `npm run build:blog` — the generator imports `marked`",
  );
  assert(
    stage < suite,
    "`npm test` runs before `git add` — git ls-files cannot see the new post, so the release fails",
  );
});

console.log(`\n${failed === 0 ? "✓" : "✗"} ${passed} passed, ${failed} failed\n`);
if (failed) {
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
