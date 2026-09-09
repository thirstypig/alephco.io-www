/**
 * Fetch, crop and commit a hero photo per Markdown blog post.
 *
 * ─── WHY PEXELS AND NOT UNSPLASH ────────────────────────────────────────────
 *
 * Both keys are configured. Unsplash is not used, and the reason is architectural:
 * its API Guidelines require HOTLINKING — "All API uses must use the hotlinked image
 * URLs returned by the API under the photo.urls properties." That would put a
 * third-party request on every blog page load, break every hero if Unsplash is
 * unreachable, and send readers' IPs to a third party — against CLAUDE.md's rule that
 * nothing may become a RUNTIME dependency of a site whose whole premise is static files.
 *
 * Pexels permits downloading, so the deploy stays a folder of files.
 *
 * ─── ATTRIBUTION IS MANDATORY ───────────────────────────────────────────────
 *
 * ⚠️ Pexels requires a prominent link back to Pexels and credit to the photographer.
 * That is not optional and not a nicety: it is the condition of the API licence. The
 * manifest written here carries the photographer name and URLs, and build-blog.mjs
 * renders the credit under the hero. Deleting the credit while keeping the photo puts
 * the site out of licence.
 *
 * ─── WHY THE PNG/WEBP FILES ARE COMMITTED ───────────────────────────────────
 *
 * Same reasoning as build-og-cards.mjs: this needs `sips` and `cwebp`, and requiring
 * either in the deploy job would trade a real constraint for no benefit. Run locally,
 * commit the output, CI stays untouched.
 *
 * Usage:
 *   node scripts/fetch-blog-heroes.mjs            # only posts with no hero yet
 *   node scripts/fetch-blog-heroes.mjs <slug>...  # specific posts (re-picks them)
 *   node scripts/fetch-blog-heroes.mjs --offset 2 # take the Nth search result instead
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HERO_DIR = path.join(ROOT, 'img', 'blog', 'hero');
const MANIFEST = path.join(HERO_DIR, 'manifest.json');
const W = 1600, H = 900;

/**
 * Search terms per post. Hand-written, not derived from the title.
 *
 * ⚠️ Titles make terrible image queries. "What 'intentionally added' PFAS actually
 * means" returns nothing; "waterproof jacket rain" returns the thing the post is about.
 * Every query here names something a camera can actually point at — a regulation is not
 * photographable, but the product it governs is.
 */
const QUERIES = {
  'amazon-compliance-documents-what-seller-central-requires': 'warehouse shipping boxes labels',
  'compliance-for-a-200-sku-catalogue-without': 'warehouse inventory shelves stock',
  'exposure-assessment-without-a-toxicologist': 'scientist laboratory microscope research',
  'fsvp-for-the-first-time-importer': 'food factory production line',
  'gcc-vs-cpc-which-certificate-does-your': 'signing documents paperwork desk',
  'getting-a-pfas-declaration-out-of-an': 'textile factory fabric manufacturing',
  'hazard-analysis-without-a-consultant': 'food safety inspection kitchen',
  'mocra-for-cosmetics-importers-registration-and-listing': 'cosmetics bottles skincare products',
  'pfas-rules-for-importers': 'waterproof fabric raincoat texture',
  // ⚠️ NO QUERY ON PURPOSE — this post uses the branded fallback.
  // Three attempts each returned imagery that CONTRADICTED the subject: a German
  // "Plakatieren verboten!" sign, a novelty "WARNING: MAY YELL AT VIDEO GAMES" sign,
  // and a Norwegian supermarket. Stock corpora answer "warning sign" with novelty and
  // foreign signage, because that is what gets photographed. Prop 65 is a CALIFORNIA
  // statute; foreign-language shelf signage above a post about it is worse than no
  // photo. If you re-add a query here, look at what comes back before committing it.
  'reach-and-svhc-for-us-companies-selling': 'chemistry laboratory glassware',
  'selling-into-canada-and-mexico-what-changes': 'semi truck highway freight transport',
  'short-form-warnings-what-changed': 'packaging label print design closeup',
  'supplier-declarations-that-hold-up-in-an': 'business contract signing handshake',
  'supplier-verification-what-fda-actually-accepts': 'food factory quality control worker',
  'surviving-a-cpsc-or-fda-request-for': 'archive files folders cabinet',
  'the-children-s-product-compliance-checklist': 'wooden toys children colourful',
  'third-party-testing-choosing-a-cpsc-accepted': 'laboratory testing equipment technician',
  'total-organic-fluorine-testing-when-you-need': 'laboratory analytical instrument chemistry',
  'tracking-labels-what-has-to-be-on': 'barcode label printing warehouse',
  'what-changes-in-2027-the-importer-s': 'hourglass time deadline desk',
  'what-intentionally-added-pfas-actually-means': 'waterproof jacket rain droplets',
  'when-oehha-adds-a-chemical-what-it': 'chemical bottles laboratory shelf',
  'year-end-compliance-review-what-to-close': 'desk paperwork review office',
  'you-received-a-60-day-notice-now': 'legal envelope mail letter desk',

  // ── The 12 hand-written posts (not generated from Markdown) ───────────────
  // They shipped with inline gradient heroes in the PRE-MANIFEST palette (#0F6E56 teal,
  // #BA7517 amber), which the redesign left behind. Photos bring them into line with the
  // generated posts. `manifest-design-system` is deliberately absent: it is a post about
  // the design system itself, and stock photography above it would be the filler this
  // whole approach is trying to avoid.
  'cpc-certificate-guide': 'toy manufacturing factory production line',
  'cpsc-recalls-for-importers': 'cardboard boxes stacked plain warehouse',
  'fsvp-guide-for-importers': 'food import warehouse pallets crates',
  'fsvp-vs-haccp': 'food processing plant hygiene stainless',
  'how-to-choose-testing-lab': 'scientists working laboratory equipment',
  'multi-regulation-compliance-framework': 'stacked paper documents desk office',
  'pfas-regulations-guide': 'water droplets fabric coating macro',
  'product-compliance-for-amazon-sellers': 'ecommerce delivery packages boxes',
  'prop-65-warnings-guide': 'plain cardboard packaging blank unbranded',
  'spreadsheets-failing-compliance': 'spreadsheet laptop data analysis desk',
  'why-i-built-aleph': 'founder working laptop startup office',
};

async function pexelsKey() {
  const env = await fs.readFile(path.join(ROOT, '.env'), 'utf8');
  const k = env.match(/^PEXELS_API_KEY\s*=\s*(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, '');
  if (!k) throw new Error('PEXELS_API_KEY missing from .env');
  return k;
}

async function search(key, query, offset) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}` +
    `&orientation=landscape&size=large&per_page=8`;
  const res = await fetch(url, { headers: { Authorization: key } });
  if (!res.ok) throw new Error(`pexels ${res.status} for "${query}"`);
  const { photos = [] } = await res.json();
  // Landscape only, and large enough that a 1600x900 crop is not an upscale.
  const usable = photos.filter((p) => p.width >= W && p.height >= H);
  return usable[offset] || usable[0] || null;
}

async function makeHero(srcUrl, outWebp, srcW, srcH) {
  const tmp = `${outWebp}.tmp.jpg`;
  const res = await fetch(srcUrl);
  if (!res.ok) throw new Error(`download ${res.status}`);
  await fs.writeFile(tmp, Buffer.from(await res.arrayBuffer()));

  // Scale on whichever axis is short of the target, THEN centre-crop. Resizing on one
  // axis alone leaves the other under 900 or 1600 and sips pads with white rather than
  // cropping — a white band down one side of the hero, on every post it happened to.
  const scaleByWidth = srcW / srcH < W / H;
  await run('sips', [scaleByWidth ? '--resampleWidth' : '--resampleHeight',
                     String(scaleByWidth ? W : H), tmp, '--out', tmp]);
  await run('sips', ['-c', String(H), String(W), tmp, '--out', tmp]);
  await run('cwebp', ['-q', '82', '-quiet', tmp, '-o', outWebp]);
  await fs.unlink(tmp);
  return (await fs.stat(outWebp)).size;
}

const args = parseArgs();
function parseArgs() {
  const a = process.argv.slice(2);
  const i = a.indexOf('--offset');
  const offset = i === -1 ? 0 : Number(a[i + 1]);
  return { slugs: a.filter((x) => !x.startsWith('--') && x !== String(offset)), offset };
}

const key = await pexelsKey();
await fs.mkdir(HERO_DIR, { recursive: true });
let manifest = {};
try { manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8')); } catch {}

const targets = args.slugs.length ? args.slugs : Object.keys(QUERIES);
let done = 0, skipped = 0;

for (const slug of targets) {
  const query = QUERIES[slug];
  if (!query) { console.log(`  ?  ${slug} — no query defined, skipped`); continue; }
  const out = path.join(HERO_DIR, `${slug}.webp`);
  const exists = await fs.access(out).then(() => true).catch(() => false);
  if (exists && !args.slugs.length) { skipped++; continue; }

  const photo = await search(key, query, args.offset);
  if (!photo) { console.log(`  ✗  ${slug} — no usable result for "${query}"`); continue; }

  const bytes = await makeHero(photo.src.original, out, photo.width, photo.height);
  manifest[slug] = {
    query,
    id: photo.id,
    photographer: photo.photographer,
    photographer_url: photo.photographer_url,
    pexels_url: photo.url,
    alt: photo.alt || '',
    provider: 'Pexels',
  };
  console.log(`  ✓  ${slug}  ${(bytes / 1024).toFixed(0)}KB  by ${photo.photographer}`);
  done++;
  await new Promise((r) => setTimeout(r, 250)); // stay well inside 200 req/hr
}

await fs.writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`\n  ${done} fetched, ${skipped} already present. Manifest: img/blog/hero/manifest.json`);
