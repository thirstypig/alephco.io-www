// Link rendering for the /learn article pages (scripts/build-learn-pages.mjs).
//
// An article link to another site — or to a file, such as the sample FSVP records under
// /learn/samples/ — opens in a new tab, as the same link does in the app's Help panel
// (HelpQuickTipCards.tsx / HelpArticlePage.tsx: `target="_blank"` for any href starting "http").
// A link inside /learn/ stays in the tab. An app help link (/help/<category>/<slug>) is rewritten to
// its /learn page, a help-guide picture (/help-img/…) is loaded from the app, and a TL;DR quote
// becomes a box. Tested by tests/validate-fsvp-samples.mjs.

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeAttr = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

/** The app, which serves the help guides' pictures (`/help-img/…`) and the signed-in help pages. */
export const APP_URL = "https://app.alephco.io";

/** Help categories published on /learn — the app's `isPublicCategory` (client/src/features/support/data/article.ts). */
const PUBLIC_HELP_CATEGORIES = new Set(["getting-started", "compliance"]);

/**
 * Where a link written inside an article goes on /learn. Articles are written for the app, where
 * `/help/<category>/<slug>` is an article; here that address does not exist. A public article is
 * at `/learn/articles/<category>/<slug>/`; any other one opens in the app (sign-in needed).
 */
export function learnHref(href) {
  const m = /^\/help\/([a-z0-9-]+)\/([a-z0-9-]+)\/?(#.*)?$/.exec(href || "");
  if (!m) return href;
  return PUBLIC_HELP_CATEGORIES.has(m[1]) ? `/learn/articles/${m[1]}/${m[2]}/${m[3] ?? ""}` : `${APP_URL}${href}`;
}

/**
 * Where a picture in an article is loaded from. The app's help guides show pictures the app serves
 * at `/help-img/…` (2026-10-30); on alephco.io that path is not ours, so it is loaded from the app
 * (which marks those files `Cross-Origin-Resource-Policy: same-site` so this site may show them).
 */
export function learnImageSrc(src) {
  return /^\/help-img\//.test(src || "") ? `${APP_URL}${src}` : src;
}

/** Whether an article link should open in a new tab. */
export function opensInNewTab(href) {
  return /^https?:\/\//i.test(href || "");
}

/** A marked extension: renders links with target/rel for the ones that leave the page. */
export const learnLinkRenderer = {
  renderer: {
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      // As marked's own renderer does (cleanUrl): encode, but leave existing %-escapes alone.
      href = learnHref(href);
      let url;
      try {
        url = encodeURI(href).replace(/%25/g, "%");
      } catch {
        return text;
      }
      const t = title ? ` title="${escapeAttr(title)}"` : "";
      const ext = opensInNewTab(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${escapeAttr(url)}"${t}${ext}>${text}</a>`;
    },
    image({ href, title, text }) {
      const src = learnImageSrc(href);
      const t = title ? ` title="${escapeAttr(title)}"` : "";
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(text)}"${t} loading="lazy">`;
    },
    // The app writes an article's TL;DR as a leading "> **TL;DR**" quote (2026-10-30); show it as
    // the same distinct box the app does, not as an ordinary quotation.
    blockquote({ tokens }) {
      const body = this.parser.parse(tokens);
      if (/^<p><strong>TL;DR<\/strong><\/p>/.test(body.trim())) {
        return `<aside class="learn-tldr" aria-label="TL;DR">\n${body}</aside>\n`;
      }
      return `<blockquote>\n${body}</blockquote>\n`;
    },
  },
};
