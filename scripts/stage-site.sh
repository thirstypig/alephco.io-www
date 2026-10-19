#!/usr/bin/env bash
# Copy ONLY the public website into a fresh folder for GitHub Pages (2026-10-19).
#
# Why an allowlist: the deploy used to publish the whole checkout, so internal files (CLAUDE.md,
# docs/, unreleased draft posts, node_modules/) were public. Anything not listed here is not
# published. Run after `npm run build:learn` and `npm run build:blog`.
#
# Usage: scripts/stage-site.sh <out-dir>
set -euo pipefail
OUT="${1:?usage: stage-site.sh <out-dir>}"
rm -rf "$OUT"
mkdir -p "$OUT/blog"

# Top-level pages and the files a host or browser asks for by name.
cp ./*.html CNAME robots.txt sitemap.xml favicon.png .nojekyll "$OUT/"
# Assets and page folders.
cp -R css js img features for compare "$OUT/"
# Build-time photo credits keyed by post slug, including UNRELEASED posts — it would reveal
# upcoming topics. The published pages carry their own credit lines.
rm -f "$OUT/img/blog/hero/manifest.json"
# Blog: built pages only — never the Markdown sources (blog/posts/, drafts included), the
# publishing schedule or the page template.
cp blog/*.html "$OUT/blog/"
rm -f "$OUT/blog/_template.html"
# /learn: generated pages, minus the generator's templates.
cp -R learn "$OUT/learn"
rm -rf "$OUT/learn/_templates"

# Fail loudly if anything private got in, or anything essential is missing.
fail=0
for p in img/blog/hero/manifest.json CLAUDE.md package.json package-lock.json .env.example .env .github docs scripts tests node_modules blog/posts blog/schedule.json blog/_template.html learn/_templates; do
  if [ -e "$OUT/$p" ]; then echo "stage-site: PRIVATE path would be published: $p" >&2; fail=1; fi
done
for p in index.html pricing.html CNAME .nojekyll sitemap.xml robots.txt css js img blog.html learn/index.html; do
  if [ ! -e "$OUT/$p" ]; then echo "stage-site: REQUIRED path missing: $p" >&2; fail=1; fi
done
if find "$OUT" -name '*.json' | grep -q .; then
  echo "stage-site: JSON files would be published (build inputs belong in the repo, not the site):" >&2; find "$OUT" -name '*.json' >&2; fail=1
fi
if find "$OUT" -name '*.md' | grep -q .; then
  echo "stage-site: Markdown files would be published:" >&2; find "$OUT" -name '*.md' >&2; fail=1
fi
[ "$fail" = 0 ] || exit 1
echo "stage-site: OK — $(find "$OUT" -type f | wc -l | tr -d ' ') files staged in $OUT"
