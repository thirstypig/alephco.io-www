// The testing lab directory (testing-labs.html + js/testing-labs-data.js).
//
// The data file is GENERATED in alephco.io-app (`npm run labs:export-www`) from CPSC's public lab
// list and Aleph's own list. These checks keep it public-only and keep the page honest about how
// old the copy is. Node built-ins only.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let passed = 0;
const failures = [];
const assert = (ok, msg) => (ok ? passed++ : failures.push(msg));

// Run the data file the way the browser does: it assigns one global.
const sandbox = { window: {} };
vm.runInNewContext(readFileSync(join(ROOT, "js/testing-labs-data.js"), "utf8"), sandbox);
const data = sandbox.window.ALEPH_TESTING_LABS;

assert(data && Array.isArray(data.labs), "js/testing-labs-data.js must set window.ALEPH_TESTING_LABS with a labs array");
if (data && Array.isArray(data.labs)) {
  // The ONLY fields a lab may carry — the app's DIRECTORY_LAB_FIELDS (shared/testing-labs-directory.ts).
  const FIELDS = ["alephTags", "bodyType", "country", "cpscLabId", "group", "key", "location", "name", "scopes", "source", "website"];
  assert(/^\d{4}-\d{2}-\d{2}$/.test(data.asOf), `asOf must be a YYYY-MM-DD date, got ${data.asOf}`);
  assert(data.sourceUrl === "https://www.cpsc.gov/cgi-bin/labsearch/", "sourceUrl must be CPSC's lab search");
  assert(data.labs.length >= 300, `expected at least 300 labs (a short list is a wrong export), got ${data.labs.length}`);
  assert(data.count === data.labs.length, "count must equal the number of labs");
  const keys = new Set();
  for (const lab of data.labs) {
    const k = Object.keys(lab).sort().join(",");
    assert(k === FIELDS.join(","), `${lab.key}: fields must be exactly ${FIELDS.join(", ")}, got ${k}`);
    assert(!keys.has(lab.key), `${lab.key}: listed twice`);
    keys.add(lab.key);
    assert(lab.scopes.every((i) => Number.isInteger(i) && data.facets.scopes[i]), `${lab.key}: a scope index points at no scope`);
    assert(lab.source === "cpsc" ? /^\d{4}$/.test(lab.cpscLabId) : lab.cpscLabId === null, `${lab.key}: CPSC Lab ID must be four digits on a CPSC row and empty otherwise`);
  }
  const text = readFileSync(join(ROOT, "js/testing-labs-data.js"), "utf8");
  assert(!/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(text), "the lab data must contain no email address (CPSC's contact people are never exported)");
}

// The page must say how old the copy is and send people to CPSC for current status.
const page = readFileSync(join(ROOT, "testing-labs.html"), "utf8");
assert(page.includes('id="lab-asof-date"'), "testing-labs.html must show the list's as-of date");
assert(page.includes('href="https://www.cpsc.gov/cgi-bin/labsearch/"'), "testing-labs.html must link to CPSC's lab search");
assert(/<script src="js\/testing-labs-data\.js"><\/script>\s*<script src="js\/main\.js"><\/script>/.test(page), "the data script must load before main.js");
assert(!/Aleph (verifies|certifies|approves)/i.test(page), "the page must not claim Aleph verifies, certifies or approves labs");
const main = readFileSync(join(ROOT, "js/main.js"), "utf8");
assert(/const PAGE = 25;/.test(main), "the directory renders 25 labs a page, never the whole list");
assert(!/innerHTML/.test(main.slice(main.indexOf("Testing lab directory"))), "the directory must write lab text with textContent, never innerHTML");

if (failures.length) {
  for (const f of failures) console.error("✗ " + f);
  console.error(`✗ ${failures.length} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`✓ All ${passed} testing-lab directory checks passed`);
