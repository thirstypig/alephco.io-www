/**
 * Behavioural tests for scripts/build-blog.mjs.
 *
 * Run: node tests/validate-blog-build.mjs
 * Zero dependencies — Node built-ins only, matching tests/validate-structure.mjs.
 *
 * ─── Why these tests and not others ─────────────────────────────────────────
 *
 * This script REWRITES blog.html and sitemap.xml in place and emits schedule.json, which
 * /admin/blog reads. Every test below names a regression that would ship silently:
 *
 *   1. A draft leaking into the public site. `draft: true` exists so unverified regulatory
 *      claims cannot publish — session 99 put the WRONG Maine PFAS law on this site,
 *      SEO-indexed. If this breaks, that happens again and nothing errors.
 *   2. A future-dated post entering the sitemap. The auto-release script only dims the
 *      index CARD; the page is live at its URL, so the sitemap is the only thing keeping
 *      an unreleased post out of search.
 *   3. Regeneration dropping posts. The card block and the sitemap's blog entries are
 *      rewritten wholesale; losing one silently de-lists a ranking page.
 *   4. Losing the BLOG_CARDS markers. The generator must THROW rather than guess where its
 *      output starts — a generator that guesses eats hand-written content.
 *   5. A malformed date passing validation, producing a post with a broken published date.
 *
 * Each test runs the REAL script against a throwaway fixture tree via BLOG_ROOT. Nothing
 * is mocked: the boundary is the filesystem, and the filesystem is what is under test.
 */
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { tmpdir } from "os";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, "..");
const SCRIPT = join(REPO, "scripts", "build-blog.mjs");

let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
  } catch (err) {
    failures.push(`${name}\n      ${err.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const TODAY = new Date().toISOString().slice(0, 10);
const future = (days) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** A throwaway repo shaped like the real one, with only what the generator reads. */
function fixture({ posts = [], withMarkers = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), "blogbuild-"));
  mkdirSync(join(root, "blog", "posts"), { recursive: true });

  // Real template, so the test exercises the real substitutions.
  cpSync(join(REPO, "blog", "_template.html"), join(root, "blog", "_template.html"));

  const cards = withMarkers
    ? '<!-- BLOG_CARDS:START -->\n<!-- BLOG_CARDS:END -->\n'
    : "";
  writeFileSync(
    join(root, "blog.html"),
    `<html><body><div class="blog-list">\n${cards}</div></body></html>`,
  );
  writeFileSync(
    join(root, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset>\n  <url><loc>https://www.alephco.io/</loc></url>\n  <url><loc>https://www.alephco.io/learn/</loc></url>\n</urlset>\n`,
  );

  for (const p of posts) {
    // A published post needs a citation to clear assertPublishable, so that is the
    // DEFAULT here — otherwise every unrelated test would be asserting the publish gate
    // by accident, and a change to that gate would light up the whole file. Pass
    // `sources: []` to exercise the gate deliberately.
    const sources = p.sources === undefined ? ["https://www.ecfr.gov/current/title-21"] : p.sources;
    const fm = [
      `title: "${p.title}"`,
      `description: "${p.description ?? "A description long enough to be plausible."}"`,
      `date: ${p.date}`,
      `slug: ${p.slug}`,
      sources.length ? `sources: [${sources.join(", ")}]` : null,
      p.draft ? "draft: true" : null,
    ].filter(Boolean).join("\n");
    const body = p.body ?? "## Body\n\nWords.";
    writeFileSync(join(root, "blog", "posts", `${p.slug}.md`), `---\n${fm}\n---\n\n${body}\n`);
  }
  return root;
}

function build(root, args = []) {
  return execFileSync("node", [SCRIPT, ...args], {
    env: { ...process.env, BLOG_ROOT: root },
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const read = (root, f) => readFileSync(join(root, f), "utf8");
const cleanup = (root) => rmSync(root, { recursive: true, force: true });

console.log("Blog build — behavioural checks\n");

// ── 1. A draft must not reach the public site ────────────────────────────────
check("a draft produces NO html, NO index card and NO sitemap entry", () => {
  const root = fixture({
    posts: [
      { slug: "live-one", title: "Live One", date: "2026-01-05" },
      { slug: "secret-draft", title: "Secret Draft", date: "2026-01-06", draft: true },
    ],
  });
  try {
    build(root);
    assert(!existsSync(join(root, "blog", "secret-draft.html")), "draft was written to blog/");
    assert(!read(root, "blog.html").includes("secret-draft"), "draft appeared in blog.html");
    assert(!read(root, "sitemap.xml").includes("secret-draft"), "draft appeared in sitemap.xml");
    // ...and the non-draft alongside it still published, so this is not passing by
    // building nothing at all.
    assert(existsSync(join(root, "blog", "live-one.html")), "the non-draft did not build");
    assert(read(root, "blog.html").includes("live-one"), "the non-draft is missing from the index");
  } finally { cleanup(root); }
});

// ── 2. A draft IS visible to admin, and only there ───────────────────────────
check("a draft appears in schedule.json as planned, flagged, and nowhere public", () => {
  const root = fixture({ posts: [{ slug: "planned-post", title: "Planned Post", date: future(30), draft: true }] });
  try {
    build(root);
    const schedule = JSON.parse(read(root, "blog/schedule.json"));
    const entry = schedule.posts.find((p) => p.slug === "planned-post");
    assert(entry, "draft missing from schedule.json — /admin/blog would show an empty pipeline");
    assert(entry.status === "planned", `expected status planned, got ${entry.status}`);
    assert(entry.draft === true, "draft flag not set — admin cannot tell written from unwritten");
  } finally { cleanup(root); }
});

// ── 3. A future-dated post is built and listed, but kept OUT of the sitemap ──
check("a future-dated post is built and indexed but excluded from the sitemap", () => {
  const root = fixture({ posts: [{ slug: "next-month", title: "Next Month", date: future(30) }] });
  try {
    build(root);
    assert(existsSync(join(root, "blog", "next-month.html")), "scheduled post was not built");
    assert(read(root, "blog.html").includes("next-month"), "scheduled post missing from index");
    assert(
      !read(root, "sitemap.xml").includes("next-month"),
      "UNRELEASED POST IS IN THE SITEMAP — the page is live at its URL, so this publishes it early",
    );
  } finally { cleanup(root); }
});

check("a post dated today IS in the sitemap (the boundary is inclusive)", () => {
  const root = fixture({ posts: [{ slug: "out-today", title: "Out Today", date: TODAY }] });
  try {
    build(root);
    assert(read(root, "sitemap.xml").includes("out-today"), "today's post was withheld from the sitemap");
  } finally { cleanup(root); }
});

// ── 4. Regeneration must not lose posts or unrelated sitemap URLs ────────────
check("regeneration preserves every post and every non-blog sitemap url", () => {
  const root = fixture({
    posts: [
      { slug: "a-post", title: "A Post", date: "2026-01-01" },
      { slug: "b-post", title: "B Post", date: "2026-02-01" },
      { slug: "c-post", title: "C Post", date: "2026-03-01" },
    ],
  });
  try {
    build(root);
    const first = { index: read(root, "blog.html"), sitemap: read(root, "sitemap.xml") };
    build(root); // idempotence: a second run must not drift
    assert(read(root, "blog.html") === first.index, "second run changed blog.html — not idempotent");
    assert(read(root, "sitemap.xml") === first.sitemap, "second run changed sitemap.xml — not idempotent");
    for (const slug of ["a-post", "b-post", "c-post"]) {
      assert(first.index.includes(slug), `${slug} dropped from the index`);
      assert(first.sitemap.includes(slug), `${slug} dropped from the sitemap`);
    }
    assert(first.sitemap.includes("/learn/"), "a NON-BLOG sitemap url was destroyed");
    assert(first.sitemap.includes("<loc>https://www.alephco.io/</loc>"), "the homepage sitemap url was destroyed");
  } finally { cleanup(root); }
});

// ── 5. Missing markers must THROW, not guess ─────────────────────────────────
check("missing BLOG_CARDS markers fail loudly instead of guessing at boundaries", () => {
  const root = fixture({ posts: [{ slug: "x", title: "X", date: "2026-01-01" }], withMarkers: false });
  try {
    let threw = false;
    try { build(root); } catch { threw = true; }
    assert(threw, "generator did NOT fail — it would guess where its output begins and eat hand-written content");
  } finally { cleanup(root); }
});

// ── 6. Frontmatter validation ────────────────────────────────────────────────
check("a malformed date is rejected rather than silently published", () => {
  const root = fixture({ posts: [{ slug: "bad-date", title: "Bad Date", date: "March 3rd" }] });
  try {
    let threw = false;
    try { build(root); } catch { threw = true; }
    assert(threw, "a malformed date was accepted — the post would carry a broken published date");
  } finally { cleanup(root); }
});

check("the generated post carries its OWN canonical url, not a copied one", () => {
  // The regression this exists for: hand-copied SEO blocks meant a post could ship with the
  // PREVIOUS post's canonical, silently de-indexing it.
  const root = fixture({
    posts: [
      { slug: "first", title: "First", date: "2026-01-01" },
      { slug: "second", title: "Second", date: "2026-01-02" },
    ],
  });
  try {
    build(root);
    const html = read(root, "blog/second.html");
    assert(html.includes('rel="canonical" href="https://www.alephco.io/blog/second.html"'),
      "second post does not carry its own canonical");
    assert(!html.includes("/blog/first.html"), "second post references the FIRST post's url");
  } finally { cleanup(root); }
});

// ── 7. --check reports staleness rather than silently fixing it ──────────────
check("--check exits non-zero when the index is stale, and writes nothing", () => {
  const root = fixture({ posts: [{ slug: "unbuilt", title: "Unbuilt", date: "2026-01-01" }] });
  try {
    const before = read(root, "blog.html");
    let failed = false;
    try { build(root, ["--check"]); } catch { failed = true; }
    assert(failed, "--check passed against a stale index");
    assert(read(root, "blog.html") === before, "--check MODIFIED blog.html — it must only report");
  } finally { cleanup(root); }
});

// ── The empty-sources guard still guards ─────────────────────────────────────
check("NO sources at all still refuses to write an empty index", () => {
  // The drafts-only fix loosened this guard from "no publishable posts" to "no sources".
  // It must still catch the case it was written for: a broken glob finding nothing, which
  // would otherwise blank blog.html and the sitemap's blog entries in one run.
  const root = fixture({ posts: [] });
  try {
    const before = read(root, "blog.html");
    let threw = false;
    try { build(root); } catch { threw = true; }
    assert(threw, "generator accepted ZERO sources — a broken glob would wipe the index");
    assert(read(root, "blog.html") === before, "blog.html was modified despite the guard");
  } finally { cleanup(root); }
});

check("a drafts-ONLY site builds without throwing", () => {
  // The regression the fix above addressed: every post being a draft is legitimate, and
  // used to crash the build.
  const root = fixture({ posts: [{ slug: "only-draft", title: "Only Draft", date: "2026-01-01", draft: true }] });
  try {
    build(root);
    const schedule = JSON.parse(read(root, "blog/schedule.json"));
    assert(schedule.posts.length === 1, "the draft is missing from schedule.json");
    assert(!read(root, "sitemap.xml").includes("only-draft"), "a draft reached the sitemap");
  } finally { cleanup(root); }
});

// ── Positive control ─────────────────────────────────────────────────────────
check("POSITIVE CONTROL: the harness actually builds something", () => {
  // Without this, a fixture that silently failed to write posts would make several
  // "did not appear" assertions above pass for the wrong reason.
  const root = fixture({ posts: [{ slug: "control", title: "Control", date: "2026-01-01" }] });
  try {
    const out = build(root);
    assert(out.includes("control"), "generator reported no output for a valid post");
    assert(existsSync(join(root, "blog", "control.html")), "no html produced for a valid post");
  } finally { cleanup(root); }
});

// ── The publish gate for regulatory content (todo 539 §5, session 116) ───────
//
// `draft: true` stops an unfinished post leaking. It stops nothing at the moment someone
// deliberately publishes, which is when an unverified regulatory claim actually goes out.
// These five run the gate in BOTH directions, because a gate that refuses everything and
// a gate that refuses nothing both look "green" from one side.
//
// ⚠️ Reachability matters more than usual here: every post in blog/posts/ is currently a
// draft, so this guard NEVER fires against the real repo. Without a test that publishes
// something, it is dead code that everyone believes is protecting them.

function refusal(root, args = []) {
  try {
    build(root, args);
    return null;
  } catch (err) {
    return String(err.stderr || err.message);
  }
}

check("REFUSES to publish a post with no sources", () => {
  const root = fixture({ posts: [{ slug: "uncited", title: "Uncited", date: "2026-01-05", sources: [] }] });
  try {
    const threw = refusal(root);
    assert(threw, "an uncited post BUILT — the citation requirement is not enforced");
    assert(/no `sources:` in frontmatter/.test(threw), `wrong error: ${threw.slice(0, 200)}`);
    assert(!existsSync(join(root, "blog", "uncited.html")), "the page was written anyway");
    assert(!read(root, "sitemap.xml").includes("uncited"), "the uncited post reached the sitemap");
  } finally { cleanup(root); }
});

check("REFUSES to publish a post that still contains placeholder text", () => {
  const root = fixture({
    posts: [{
      slug: "half-written", title: "Half Written", date: "2026-01-05",
      body: "## Rules\n\nMaine requires reporting by PLACEHOLDER for all covered products.",
    }],
  });
  try {
    const threw = refusal(root);
    assert(threw, "a post containing PLACEHOLDER published — this is the session-99 failure");
    assert(/still contains "PLACEHOLDER"/.test(threw), `wrong error: ${threw.slice(0, 200)}`);
    assert(!existsSync(join(root, "blog", "half-written.html")), "the page was written anyway");
  } finally { cleanup(root); }
});

check("REFUSES a source that is not an absolute https URL", () => {
  const root = fixture({ posts: [{ slug: "bad-cite", title: "Bad Cite", date: "2026-01-05", sources: ["see the FDA website"] }] });
  try {
    const threw = refusal(root);
    assert(threw, "an unfollowable citation was accepted");
    assert(/not an absolute https URL/.test(threw), `wrong error: ${threw.slice(0, 200)}`);
  } finally { cleanup(root); }
});

// ⚠️ THE NEGATIVE CONTROL. Without this, a gate that threw on EVERY post would pass all
// three tests above and nothing would ever publish again.
check("PUBLISHES a cited post with no placeholders", () => {
  const root = fixture({
    posts: [{
      slug: "properly-sourced", title: "Properly Sourced", date: "2026-01-05",
      sources: ["https://www.ecfr.gov/current/title-21/part-117", "https://legislature.maine.gov/statutes/38/title38sec1614.html"],
      body: "## Rules\n\nA claim, followed by where it was checked.",
    }],
  });
  try {
    build(root);
    assert(existsSync(join(root, "blog", "properly-sourced.html")), "a properly cited post did NOT publish — the gate refuses everything");
    assert(read(root, "blog.html").includes("properly-sourced"), "cited post missing from the index");
    assert(read(root, "sitemap.xml").includes("properly-sourced"), "cited post missing from the sitemap");
  } finally { cleanup(root); }
});

// ...and the gate must not reach drafting, or writing becomes impossible: a post is
// uncited and full of placeholders for its whole life until the moment it is finished.
check("does NOT block previewing an uncited, placeholder-filled DRAFT", () => {
  const root = fixture({
    posts: [{
      slug: "in-progress", title: "In Progress", date: future(30), draft: true, sources: [],
      body: "## Rules\n\nTODO: check the threshold. NOT PUBLISHABLE AS WRITTEN.",
    }],
  });
  try {
    build(root, ["--drafts"]);
    assert(existsSync(join(root, "blog", "_preview", "in-progress.html")), "an unfinished draft could not be previewed — the gate reaches drafting");
    assert(!existsSync(join(root, "blog", "in-progress.html")), "the draft was published");
    assert(!read(root, "sitemap.xml").includes("in-progress"), "the draft reached the sitemap");
  } finally { cleanup(root); }
});

// The draft listing must say WHY a draft is not publishable. Otherwise the only way to
// discover a post is uncited is to flip `draft: false` and be refused — i.e. on the day
// you had scheduled it. Both directions in one test: blocked reports the reason, ready
// reports ready.
check("the draft listing reports what still blocks each draft", () => {
  const root = fixture({
    posts: [
      { slug: "not-ready", title: "Not Ready", date: future(10), draft: true, sources: [] },
      { slug: "is-ready", title: "Is Ready", date: future(20), draft: true },
    ],
  });
  try {
    const out = build(root);
    const line = (slug) => out.split("\n").find((l) => l.includes(slug)) || "";
    assert(/no `sources:`/.test(line("not-ready")), `uncited draft did not report a reason: ${line("not-ready")}`);
    assert(/ready to publish/.test(line("is-ready")), `ready draft was not reported ready: ${line("is-ready")}`);
    // ...and neither was actually published, which is the whole point of them being drafts.
    assert(!existsSync(join(root, "blog", "is-ready.html")), "a draft marked ready was published anyway");
  } finally { cleanup(root); }
});

check("REFUSES a title whose quotes were escaped into backslashes", () => {
  const root = fixture({ posts: [{ slug: "escaped", title: 'What \\"x\\" means', date: "2026-01-05" }] });
  try {
    const threw = refusal(root);
    assert(threw, "a title containing a backslash published — it renders with the backslashes visible");
    assert(/contains a backslash/.test(threw), `wrong error: ${threw.slice(0, 200)}`);
  } finally { cleanup(root); }
});

console.log(`\n${failures.length === 0 ? "✓" : "✗"} ${passed} passed, ${failures.length} failed`);
for (const f of failures) console.log(`\n  ✗ ${f}`);
process.exit(failures.length === 0 ? 0 : 1);
