// Link rendering for the /learn article pages (scripts/build-learn-pages.mjs).
//
// An article link to another site — or to a file, such as the sample FSVP records under
// /learn/samples/ — opens in a new tab, as the same link does in the app's Help panel
// (HelpQuickTipCards.tsx / HelpArticlePage.tsx: `target="_blank"` for any href starting "http").
// A link inside /learn/ stays in the tab. Tested by tests/validate-fsvp-samples.mjs.

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeAttr = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);

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
  },
};
