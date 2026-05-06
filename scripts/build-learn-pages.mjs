#!/usr/bin/env node
// Build static HTML pages for /learn/ from Supabase help_articles (public, published only).
// Usage: npm run build:learn
//
// SEO note: this writes server-rendered HTML so Googlebot sees article content
// in the source — no JS hydration required. RLS on Supabase enforces that only
// public+published articles are reachable with the anon key.

import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

dotenv.config();

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATES = path.join(ROOT, 'learn', '_templates');
const OUT = path.join(ROOT, 'learn');

const SITE_URL = (process.env.SITE_URL || 'https://www.alephco.io').replace(/\/$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MODULES = [
  { id: 'fsvp', label: 'FSVP', title: 'FSVP — Foreign Supplier Verification', description: 'For US food importers verifying overseas suppliers under FDA rules.' },
  { id: 'cpsia', label: 'CPSIA', title: 'CPSIA / CPC certificates', description: 'Children’s Product Certificates and CPSC testing requirements.' },
  { id: 'prop65', label: 'Prop 65', title: 'California Proposition 65', description: 'Warning labels and exposure analysis for California sales.' },
  { id: 'pfas', label: 'PFAS', title: 'PFAS state requirements', description: '"Forever chemicals" disclosures across US states.' },
  { id: 'general', label: 'General', title: 'Getting started & general', description: 'Onboarding, multi-module overviews, and platform basics.' },
];
const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m]));

const CATEGORY_LABEL = {
  'getting-started': 'Getting started',
  'compliance': 'Compliance',
  'products': 'Products',
  'documents': 'Documents',
  'admin': 'Admin',
};

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(s) { return escapeHtml(s); }

async function readTpl(name) {
  return fs.readFile(path.join(TEMPLATES, name), 'utf8');
}

function fill(tpl, vars) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : ''));
}

async function loadCommon() {
  const [headTpl, navTpl, footerTpl] = await Promise.all([
    readTpl('_head.html'), readTpl('_nav.html'), readTpl('_footer.html'),
  ]);
  return { headTpl, navTpl, footerTpl };
}

function renderHead(common, vars) {
  return fill(common.headTpl, {
    OG_TYPE: 'website',
    EXTRA_HEAD: '',
    ...vars,
  });
}

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

async function writeFile(p, content) {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, content, 'utf8');
}

function articleUrl(slug) { return `${SITE_URL}/learn/articles/${slug}/`; }
function moduleUrl(id) { return `${SITE_URL}/learn/m/${id}/`; }
function landingUrl() { return `${SITE_URL}/learn/`; }

function articleCardHtml(a) {
  const mod = MODULE_BY_ID[a.module] || { label: a.module || 'General' };
  return `        <a class="article-card" href="/learn/articles/${escapeAttr(a.slug)}/">
          <span class="module-tag">${escapeHtml(mod.label)}</span>
          <h3>${escapeHtml(a.title)}</h3>
          <p>${escapeHtml(a.excerpt || '')}</p>
        </a>`;
}

function moduleCardHtml(m, count) {
  return `        <a class="module-card" href="/learn/m/${escapeAttr(m.id)}/">
          <span class="section-label">${escapeHtml(m.label)}</span>
          <h3>${escapeHtml(m.title)}</h3>
          <p>${escapeHtml(m.description)}</p>
          <div class="count">${count} article${count === 1 ? '' : 's'}</div>
        </a>`;
}

function relatedHtml(article, allArticles) {
  const related = allArticles
    .filter((a) => a.id !== article.id && a.module === article.module)
    .slice(0, 5);
  if (related.length === 0) return '';
  const items = related.map((a) =>
    `<li><a href="/learn/articles/${escapeAttr(a.slug)}/">${escapeHtml(a.title)}</a></li>`
  ).join('\n          ');
  return `        <section class="related-articles">
          <h2>Related articles</h2>
          <ul>
          ${items}
          </ul>
        </section>`;
}

function jsonLdScript(article) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.seo_description || article.excerpt || '',
    datePublished: article.created_at,
    dateModified: article.updated_at || article.created_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl(article.slug) },
    author: { '@type': 'Organization', name: 'Aleph Compliance, Inc.', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'Aleph Compliance, Inc.',
      url: SITE_URL,
    },
    articleSection: CATEGORY_LABEL[article.category] || article.category,
  };
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

async function buildArticles(common, articles) {
  const tpl = await readTpl('article.html');
  for (const a of articles) {
    const seoTitle = a.seo_title || a.title;
    const seoDesc = a.seo_description || a.excerpt || '';
    const canonical = articleUrl(a.slug);
    const mod = MODULE_BY_ID[a.module] || { id: a.module || 'general', label: a.module || 'General' };
    const head = renderHead(common, {
      PAGE_TITLE: `${seoTitle} | Aleph`,
      PAGE_DESCRIPTION: seoDesc,
      CANONICAL_URL: canonical,
      OG_TYPE: 'article',
      EXTRA_HEAD: jsonLdScript(a),
    });
    const contentHtml = marked.parse(a.content || '');
    const html = fill(tpl, {
      HEAD: head,
      NAV: common.navTpl,
      FOOTER: common.footerTpl,
      TITLE: escapeHtml(a.title),
      EXCERPT: escapeHtml(a.excerpt || ''),
      CATEGORY_LABEL: escapeHtml(CATEGORY_LABEL[a.category] || a.category || ''),
      MODULE: escapeAttr(mod.id),
      MODULE_LABEL: escapeHtml(mod.label),
      CONTENT_HTML: contentHtml,
      RELATED_HTML: relatedHtml(a, articles),
    });
    const outPath = path.join(OUT, 'articles', a.slug, 'index.html');
    await writeFile(outPath, html);
  }
}

async function buildLanding(common, articles) {
  const tpl = await readTpl('landing.html');
  const counts = Object.fromEntries(MODULES.map((m) => [m.id, 0]));
  for (const a of articles) {
    if (counts[a.module] !== undefined) counts[a.module] += 1;
  }
  const moduleCards = MODULES.map((m) => moduleCardHtml(m, counts[m.id])).join('\n');
  const articleCards = articles.map(articleCardHtml).join('\n');
  const head = renderHead(common, {
    PAGE_TITLE: 'Aleph Learn — compliance guides for US importers',
    PAGE_DESCRIPTION: 'Plain-language guides to FSVP, CPSIA, Prop 65, and PFAS for US importers. Updated as the rules change.',
    CANONICAL_URL: landingUrl(),
    OG_TYPE: 'website',
    EXTRA_HEAD: '',
  });
  const html = fill(tpl, {
    HEAD: head,
    NAV: common.navTpl,
    FOOTER: common.footerTpl,
    MODULE_CARDS: moduleCards,
    ARTICLE_CARDS: articleCards,
    ARTICLE_COUNT: String(articles.length),
  });
  await writeFile(path.join(OUT, 'index.html'), html);
}

async function buildModulePages(common, articles) {
  const tpl = await readTpl('module.html');
  for (const m of MODULES) {
    const inMod = articles.filter((a) => a.module === m.id);
    const cards = inMod.length
      ? inMod.map(articleCardHtml).join('\n')
      : '        <div class="article-list-empty">No public articles in this module yet.</div>';
    const head = renderHead(common, {
      PAGE_TITLE: `${m.title} | Aleph Learn`,
      PAGE_DESCRIPTION: m.description,
      CANONICAL_URL: moduleUrl(m.id),
      OG_TYPE: 'website',
      EXTRA_HEAD: '',
    });
    const html = fill(tpl, {
      HEAD: head,
      NAV: common.navTpl,
      FOOTER: common.footerTpl,
      MODULE_LABEL: escapeHtml(m.label),
      MODULE_TITLE: escapeHtml(m.title),
      MODULE_DESCRIPTION: escapeHtml(m.description),
      ARTICLE_CARDS: cards,
    });
    await writeFile(path.join(OUT, 'm', m.id, 'index.html'), html);
  }
}

async function buildSearch(common) {
  const tpl = await readTpl('search.html');
  const head = renderHead(common, {
    PAGE_TITLE: 'Search | Aleph Learn',
    PAGE_DESCRIPTION: 'Search the Aleph compliance knowledge base.',
    CANONICAL_URL: `${SITE_URL}/learn/search/`,
    OG_TYPE: 'website',
    EXTRA_HEAD: '<meta name="robots" content="noindex">',
  });
  const html = fill(tpl, {
    HEAD: head,
    NAV: common.navTpl,
    FOOTER: common.footerTpl,
  });
  await writeFile(path.join(OUT, 'search', 'index.html'), html);
}

async function updateSitemap(articles) {
  const sitemapPath = path.join(ROOT, 'sitemap.xml');
  const existing = await fs.readFile(sitemapPath, 'utf8').catch(() => null);
  const learnUrls = [
    `<url><loc>${SITE_URL}/learn/</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    ...MODULES.map((m) => `<url><loc>${moduleUrl(m.id)}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`),
    ...articles.map((a) => {
      const lastmod = (a.updated_at || a.created_at || '').slice(0, 10);
      return `<url><loc>${articleUrl(a.slug)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>monthly</changefreq><priority>0.7</priority></url>`;
    }),
  ];
  const block = `  <!-- Learn / Knowledge Base (generated by build:learn) -->\n  ${learnUrls.join('\n  ')}`;

  if (existing) {
    // Remove any prior generated block and re-insert before </urlset>.
    const cleaned = existing.replace(
      /\s*<!-- Learn \/ Knowledge Base \(generated by build:learn\) -->[\s\S]*?(?=(\n\s*<!--)|(\s*<\/urlset>))/,
      ''
    );
    const updated = cleaned.replace('</urlset>', `${block}\n</urlset>`);
    await fs.writeFile(sitemapPath, updated, 'utf8');
  } else {
    const fresh = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${block}\n</urlset>\n`;
    await fs.writeFile(sitemapPath, fresh, 'utf8');
  }
}

async function updateRobots() {
  const robotsPath = path.join(ROOT, 'robots.txt');
  const existing = await fs.readFile(robotsPath, 'utf8').catch(() => '');
  if (existing.includes('Allow: /learn/')) return; // already configured
  const lines = existing.trim().split('\n');
  const out = [];
  let inserted = false;
  for (const line of lines) {
    out.push(line);
    if (!inserted && /^User-agent:/i.test(line)) {
      // already-allowed-everything sites have Allow: / — append explicit /learn for clarity.
    }
  }
  // Ensure explicit allow + sitemap.
  let merged = lines.join('\n');
  if (!/Allow:\s*\/learn\//.test(merged)) {
    // insert after first Allow: / or at top
    if (/Allow:\s*\//.test(merged)) {
      merged = merged.replace(/(Allow:\s*\/[^\n]*)/, `$1\nAllow: /learn/`);
    } else {
      merged = `User-agent: *\nAllow: /\nAllow: /learn/\n` + merged;
    }
  }
  if (!/Sitemap:/i.test(merged)) {
    merged += `\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
  }
  await fs.writeFile(robotsPath, merged.trimEnd() + '\n', 'utf8');
}

async function main() {
  const t0 = Date.now();
  console.log('Fetching public published articles...');
  const { data: articles, error } = await supabase
    .from('help_articles')
    .select('id,slug,title,excerpt,content,module,category,visibility,seo_title,seo_description,published,created_at,updated_at,order_index')
    .eq('published', true)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (!articles || articles.length === 0) {
    throw new Error('Got 0 articles — RLS misconfiguration or empty content. Aborting.');
  }
  // Defense in depth: filter to public even though RLS should already do it.
  const publicArticles = articles.filter((a) => a.visibility === 'public');
  console.log(`  -> ${publicArticles.length} public articles (of ${articles.length} returned).`);

  const common = await loadCommon();

  console.log('Rendering articles...');
  await buildArticles(common, publicArticles);

  console.log('Rendering landing page...');
  await buildLanding(common, publicArticles);

  console.log('Rendering module pages...');
  await buildModulePages(common, publicArticles);

  console.log('Rendering search shell...');
  await buildSearch(common);

  console.log('Updating sitemap.xml...');
  await updateSitemap(publicArticles);

  console.log('Updating robots.txt...');
  await updateRobots();

  const ms = Date.now() - t0;
  console.log(`\nDone in ${ms}ms`);
  console.log(`  Articles: ${publicArticles.length}`);
  console.log(`  Modules:  ${MODULES.length}`);
  console.log(`  Landing:  /learn/`);
  console.log(`  Search:   /learn/search/`);
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
