/**
 * Structural validation for the Aleph marketing site.
 * Ensures nav/footer consistency across all HTML pages.
 *
 * Run: node tests/validate-structure.mjs
 * Zero dependencies — uses only Node built-ins.
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── File inventory ──────────────────────────────────────────────
// All pages that should have nav + footer (everything except 404)
const PAGES = [
  "index.html",
  "about.html",
  "blog.html",
  "contact.html",
  "how-it-works.html",
  "industries.html",
  "pricing.html",
  "privacy.html",
  "status.html",
  "terms.html",
  "blog/cpc-certificate-guide.html",
  "blog/cpsc-recalls-for-importers.html",
  "blog/fsvp-guide-for-importers.html",
  "blog/fsvp-vs-haccp.html",
  "blog/how-to-choose-testing-lab.html",
  "blog/multi-regulation-compliance-framework.html",
  "blog/pfas-regulations-guide.html",
  "blog/product-compliance-for-amazon-sellers.html",
  "blog/prop-65-warnings-guide.html",
  "blog/spreadsheets-failing-compliance.html",
  "blog/why-i-built-aleph.html",
  "features/cpsia-cpc-generator.html",
  "features/fsvp-management.html",
  "features/pfas-tracking.html",
  "features/prop-65-labels.html",
  "for/amazon-sellers.html",
  "for/food-importers.html",
  "for/toy-importers.html",
  "compare/assent-compliance.html",
  "compare/registrar-corp.html",
];

const EXPECTED_NAV_LINKS = ["How It Works", "Industries", "Pricing"];

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
  } else {
    failed++;
    failures.push(message);
  }
}

// ── Tests ───────────────────────────────────────────────────────

for (const page of PAGES) {
  const filepath = join(ROOT, page);
  const html = readFileSync(filepath, "utf-8");
  const isSubdir = page.includes("/");
  const prefix = isSubdir ? "\\.\\./" : "";

  // 1. No "Home" link in nav
  const homeInNav = html.match(/<ul class="nav-links">[\s\S]*?<\/ul>/);
  if (homeInNav) {
    assert(
      !homeInNav[0].includes(">Home<"),
      `${page}: nav still contains "Home" link`
    );
  }

  // 2. Correct nav links (exactly 3)
  if (homeInNav) {
    const navLinks = homeInNav[0].match(/<a [^>]*>([^<]+)<\/a>/g) || [];
    const navTexts = navLinks.map((l) => l.replace(/<[^>]+>/g, "").trim());
    assert(
      navTexts.length === 3,
      `${page}: expected 3 nav links, got ${navTexts.length}: [${navTexts.join(", ")}]`
    );
    for (const expected of EXPECTED_NAV_LINKS) {
      assert(
        navTexts.includes(expected),
        `${page}: nav missing "${expected}" link`
      );
    }
  } else {
    assert(false, `${page}: nav-links block not found`);
  }

  // 3. Footer has grid structure
  assert(
    html.includes('class="footer-grid"'),
    `${page}: missing footer-grid class`
  );

  // 4. Footer has all 4 columns
  const footerCols = (html.match(/class="footer-col"/g) || []).length;
  assert(
    footerCols === 4,
    `${page}: expected 4 footer-col elements, got ${footerCols}`
  );

  // 5. Footer has brand section
  assert(
    html.includes('class="footer-brand"'),
    `${page}: missing footer-brand section`
  );

  // 6. Footer has bottom bar with copyright
  assert(
    html.includes('class="footer-bottom"'),
    `${page}: missing footer-bottom bar`
  );
  assert(
    html.includes("2026 Aleph Compliance, Inc."),
    `${page}: missing copyright notice`
  );

  // 7. Footer column headings present
  for (const heading of ["Product", "Resources", "Company", "Legal"]) {
    assert(
      html.includes(`<h4>${heading}</h4>`),
      `${page}: missing footer column heading "${heading}"`
    );
  }

  // 8. Internal links resolve to real files
  const internalLinks =
    html.match(/href="(?!https?:\/\/|mailto:|#|\/|data:)[^"]+"/g) || [];
  for (const link of internalLinks) {
    const href = link.slice(6, -1); // strip href=" and "
    const target = resolve(dirname(filepath), href.split("#")[0]);
    assert(
      existsSync(target),
      `${page}: broken link → ${href} (resolved to ${target})`
    );
  }

  // 9. Logo links to "/" (home)
  assert(
    html.includes('href="/" class="nav-logo"'),
    `${page}: nav logo should link to /`
  );
}

// ── CSS validation ──────────────────────────────────────────────
const css = readFileSync(join(ROOT, "css/style.css"), "utf-8");

assert(css.includes(".footer-grid"), "style.css: missing .footer-grid rule");
assert(css.includes(".footer-brand"), "style.css: missing .footer-brand rule");
assert(css.includes(".footer-col"), "style.css: missing .footer-col rule");
assert(
  css.includes(".footer-bottom"),
  "style.css: missing .footer-bottom rule"
);
assert(
  css.includes("grid-template-columns"),
  "style.css: footer-grid should use CSS grid"
);
assert(
  css.includes("@media (max-width: 768px)"),
  "style.css: missing responsive breakpoint for footer"
);

// ── Report ──────────────────────────────────────────────────────
console.log("");
if (failed === 0) {
  console.log(`\u2713 All ${passed} checks passed across ${PAGES.length} pages`);
} else {
  console.log(`\u2717 ${failed} of ${passed + failed} checks failed:\n`);
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
}
console.log("");
process.exit(failed > 0 ? 1 : 0);
