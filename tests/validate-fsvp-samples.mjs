/**
 * The sample filled FSVP records under learn/samples/ (2026-10-20).
 *
 * The app's Help links each one at https://alephco.io/learn/samples/<file>.pdf. They are generated in
 * the app repo (scripts/fsvp-samples/generate.ts), which writes the PDFs here together with
 * scripts/fsvp-samples-manifest.json — and a byte-identical copy of that manifest into the app, where
 * a test checks every Help link against it. This suite makes sure what the manifest promises is what
 * this site publishes:
 *   - every listed file exists, with the listed size and sha256 (a half-copied or stale file fails);
 *   - learn/samples/ holds nothing the manifest does not list;
 *   - the deploy's staging step publishes learn/ whole, so they ship — and the manifest itself
 *     lives outside learn/, because staging refuses to publish any .json file;
 *   - /learn article links that leave the site (the samples among them) open in a new tab.
 *
 * Run: node tests/validate-fsvp-samples.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { createHash } from "crypto";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIR = join(REPO, "learn", "samples");
const MANIFEST = join(REPO, "scripts", "fsvp-samples-manifest.json");

let passed = 0;
const failures = [];
async function check(name, fn) {
  try {
    await fn();
    passed++;
  } catch (err) {
    failures.push(`${name}: ${err.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const listed = manifest.samples ?? [];

await check("the manifest lists at least one sample", () => assert(listed.length > 0, "empty manifest"));

for (const s of listed) {
  await check(`${s.file} is published as listed`, () => {
    assert(/^[a-z0-9-]+\.pdf$/.test(s.file), `unexpected file name ${s.file}`);
    const p = join(DIR, s.file);
    assert(existsSync(p), `learn/samples/${s.file} is missing`);
    const bytes = readFileSync(p);
    assert(bytes.subarray(0, 5).toString("latin1") === "%PDF-", "not a PDF");
    assert(bytes.length === s.bytes, `size ${bytes.length}, manifest says ${s.bytes}`);
    const sha = createHash("sha256").update(bytes).digest("hex");
    assert(sha === s.sha256, `sha256 ${sha}, manifest says ${s.sha256}`);
  });
}

await check("learn/samples/ holds only the listed PDFs", () => {
  const names = new Set(listed.map((s) => s.file));
  const stray = readdirSync(DIR).filter((f) => !names.has(f));
  assert(stray.length === 0, `not in the manifest: ${stray.join(", ")}`);
});

await check("the deploy stages learn/ whole, and the manifest is not inside it", () => {
  const stage = readFileSync(join(REPO, "scripts", "stage-site.sh"), "utf8");
  assert(/^cp -R learn "\$OUT\/learn"$/m.test(stage), "stage-site.sh no longer copies learn/ — the samples would not ship");
  assert(!/learn\/samples/.test(stage), "stage-site.sh removes or special-cases learn/samples");
  assert(!MANIFEST.startsWith(join(REPO, "learn")), "the manifest is under learn/ — staging refuses .json files");
  assert(statSync(DIR).isDirectory(), "learn/samples is not a directory");
});

await check("/learn article links that leave the site open in a new tab; links inside stay", async () => {
  const { marked } = await import("marked");
  const { learnLinkRenderer } = await import("../scripts/lib/learn-links.mjs");
  marked.use(learnLinkRenderer);
  const html = marked.parse("[s](https://alephco.io/learn/samples/x.pdf) [in](/learn/articles/y/)");
  assert(/<a href="https:\/\/alephco\.io\/learn\/samples\/x\.pdf" target="_blank" rel="noopener noreferrer">s<\/a>/.test(html), html);
  assert(/<a href="\/learn\/articles\/y\/">in<\/a>/.test(html), html);
  const build = readFileSync(join(REPO, "scripts", "build-learn-pages.mjs"), "utf8");
  assert(/marked\.use\(learnLinkRenderer\)/.test(build), "build-learn-pages.mjs does not use the link renderer");
});

if (failures.length === 0) {
  console.log(`✓ All ${passed} FSVP sample checks passed (${listed.length} samples)`);
} else {
  console.log(`✗ ${failures.length} of ${passed + failures.length} FSVP sample checks failed:\n`);
  for (const f of failures) console.log(`  - ${f}`);
}
process.exit(failures.length > 0 ? 1 : 0);
