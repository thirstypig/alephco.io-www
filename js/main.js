// Email signup handler — double opt-in via the app's public /api/subscribe.
// The visitor is saved as "pending" and emailed a confirmation link; only after
// they click it do they count as confirmed. No email/data is stored in the
// browser. Uses localhost:4060 during local dev (same pattern as the links below).
const SIGNUP_API_BASE =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:4060'
    : 'https://app.alephco.io';

async function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const email = (form.email.value || '').trim();
  const website = form.website ? form.website.value : ''; // honeypot — bots fill it
  const msg = document.getElementById('signup-msg');
  const btn = form.querySelector('button[type="submit"]');

  function say(text, color) {
    msg.textContent = text;
    msg.style.color = color;
    msg.style.display = 'block';
  }

  if (!email) { say('Please enter your email.', '#991b1b'); return; }

  const original = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

  try {
    const res = await fetch(SIGNUP_API_BASE + '/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, website: website }),
    });
    const data = await res.json().catch(() => ({}));
    if (data && data.ok) {
      say(data.message || "Check your inbox to confirm your email.", '#1f7a4a');
      form.email.value = '';
    } else {
      say((data && data.message) || 'Sorry, something went wrong. Please try again.', '#991b1b');
    }
  } catch (_) {
    say('Sorry, something went wrong. Please try again.', '#991b1b');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = original; }
  }
}

// Localhost detection: rewrite app.alephco.io links to localhost:4060
// so "Log In" and "Get Started" work during local development
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href*="app.alephco.io"]').forEach(a => {
      a.href = a.href.replace('https://app.alephco.io', 'http://localhost:4060');
    });
  });
}

// Mobile nav toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
    });
    // Close on link click (mobile)
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => menu.classList.remove('open'));
    });
  }

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.parentElement.classList.toggle('open');
    });
  });

  // Live status check
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  if (statusDot && statusText) {
    fetch('https://app.alephco.io/api/health')
      .then(r => r.json())
      .then(data => {
        if (data.status === 'healthy' && data.database === 'connected') {
          statusDot.style.background = '#10b981';
          statusText.textContent = 'All systems operational';
        } else {
          statusDot.style.background = '#f59e0b';
          statusText.textContent = 'Degraded performance';
        }
      })
      .catch(() => {
        statusDot.style.background = '#ef4444';
        statusText.textContent = 'Unable to reach servers';
      });
  }

  // Contact form — JSON to the app's public endpoint, which emails the message to Aleph
  // (app: server/routes/public-contact.ts). The inbox is configured on the server; no address
  // but the public support@ fallback appears in this file. Same localhost rule as the signup.
  const form = document.getElementById('contact-form');
  if (form) {
    const errorBox = form.querySelector('.form-error');
    const successBox = document.querySelector('.form-success');
    const showError = (lead) => {
      errorBox.textContent = lead + ' ';
      const a = document.createElement('a');
      a.href = 'mailto:support@alephco.io';
      a.textContent = 'Email support@alephco.io';
      errorBox.appendChild(a);
      errorBox.appendChild(document.createTextNode('.'));
      errorBox.style.display = 'block';
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.style.display = 'none';
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      let source = location.pathname;
      try {
        const ref = document.referrer ? new URL(document.referrer) : null;
        if (ref && ref.hostname === location.hostname && ref.pathname !== location.pathname) {
          source += ' (from ' + ref.pathname + ')';
        }
      } catch (_) { /* unparseable referrer: page path alone */ }

      const value = (name) => (form.elements[name] ? form.elements[name].value.trim() : '');
      const payload = {
        name: value('name'),
        email: value('email'),
        message: value('message'),
        source: source.slice(0, 200),
        website: form.elements.website ? form.elements.website.value : '',
      };
      if (value('company')) payload.company = value('company');
      if (value('regulation')) payload.regulation = value('regulation');

      try {
        const res = await fetch(SIGNUP_API_BASE + '/api/public/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          form.style.display = 'none';
          successBox.style.display = 'block';
          successBox.focus();
          return;
        }
        if (res.status === 429) {
          showError('Too many messages from this connection. Please try again later.');
        } else if (res.status === 400) {
          showError('Please check your name, email and message, then try again.');
        } else {
          showError('Sorry \u2014 your message did not send.');
        }
      } catch (_) {
        showError('Sorry \u2014 your message did not send.');
      }
      btn.textContent = original;
      btn.disabled = false;
    });
  }
});

// ── Testing lab directory (/testing-labs.html) ──────────────────────
// Reads window.ALEPH_TESTING_LABS from js/testing-labs-data.js, a static copy generated in the app
// repo (`npm run labs:export-www`). No request to the app: the page works when the app is down.
// Renders 25 labs a page — never the whole list at once. Text goes in with textContent only.
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('lab-directory');
  const data = window.ALEPH_TESTING_LABS;
  if (!root || !data) return;

  const PAGE = 25;
  const TYPE_LABEL = { Independent: 'Independent lab', Firewalled: 'Firewalled lab', Governmental: 'Governmental lab' };
  const fold = (s) => String(s || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const $ = (id) => document.getElementById(id);
  const q = $('lab-q'), country = $('lab-country'), type = $('lab-type'), scope = $('lab-scope');
  const list = $('lab-list'), count = $('lab-count'), pageLabel = $('lab-page'), prev = $('lab-prev'), next = $('lab-next');

  const scopes = data.facets.scopes;
  const labs = data.labs.map((l) => ({ ...l, hay: fold([l.cpscLabId || '', l.name, l.location].join(' ')), nameF: fold(l.name) }));
  $('lab-asof-date').textContent = data.asOf;

  const fill = (select, values, label) => values.forEach((v) => {
    const o = document.createElement('option');
    o.value = String(v);
    o.textContent = label ? label(v) : v;
    select.appendChild(o);
  });
  fill(country, data.facets.countries);
  fill(type, data.facets.bodyTypes, (t) => TYPE_LABEL[t] || t);
  fill(scope, scopes.map((_, i) => i), (i) => scopes[i]);

  // ?q= seeds the search, so other pages can link straight to a lab.
  const params = new URLSearchParams(location.search);
  if (params.get('q')) q.value = params.get('q');

  let page = 1;
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function matches() {
    const words = fold(q.value).split(' ').filter(Boolean);
    const qf = fold(q.value);
    const c = country.value, t = type.value, s = scope.value === '' ? null : Number(scope.value);
    const hits = labs.filter((l) =>
      words.every((w) => l.hay.includes(w)) &&
      (!c || l.country === c) && (!t || l.bodyType === t) && (s === null || l.scopes.includes(s)));
    if (qf) {
      const rank = (l) => (l.cpscLabId === qf ? 0 : l.nameF.startsWith(qf) ? 1 : 2);
      hits.sort((a, b) => rank(a) - rank(b));
    }
    return hits;
  }

  function row(l) {
    const li = el('li', 'lab-row');
    const head = el('div', 'lab-row-head');
    const who = el('div');
    who.appendChild(el('p', 'lab-name', l.name));
    const facts = [l.cpscLabId ? 'CPSC Lab ID ' + l.cpscLabId : 'Not on CPSC’s accepted-lab list'];
    if (l.location || l.country) facts.push(l.location || l.country);
    if (l.group) facts.push('Group: ' + l.group);
    who.appendChild(el('p', 'lab-facts', facts.join(' · ')));
    head.appendChild(who);
    const tags = el('div', 'lab-tags');
    if (l.bodyType) tags.appendChild(el('span', 'lab-tag', TYPE_LABEL[l.bodyType] || l.bodyType));
    if (l.source === 'aleph' && l.alephTags.length) tags.appendChild(el('span', 'lab-tag', 'Aleph’s list: ' + l.alephTags.join(', ')));
    if (l.website) {
      const a = el('a', 'lab-site', 'Website');
      a.href = /^https?:\/\//i.test(l.website) ? l.website : 'https://' + l.website;
      a.rel = 'noopener nofollow';
      a.target = '_blank';
      tags.appendChild(a);
    }
    head.appendChild(tags);
    li.appendChild(head);
    if (l.scopes.length) {
      const d = el('details', 'lab-scopes');
      d.appendChild(el('summary', null, l.scopes.length + (l.scopes.length === 1 ? ' accepted scope' : ' accepted scopes')));
      const ul = el('ul');
      l.scopes.forEach((i) => ul.appendChild(el('li', null, scopes[i])));
      d.appendChild(ul);
      li.appendChild(d);
    }
    return li;
  }

  function render() {
    const hits = matches();
    const pages = Math.max(1, Math.ceil(hits.length / PAGE));
    if (page > pages) page = pages;
    const shown = hits.slice((page - 1) * PAGE, page * PAGE);
    list.replaceChildren(...shown.map(row));
    count.textContent = hits.length
      ? ((page - 1) * PAGE + 1) + '–' + ((page - 1) * PAGE + shown.length) + ' of ' + hits.length + ' labs'
      : 'No lab matches. Try fewer words or another filter.';
    pageLabel.textContent = 'Page ' + page + ' of ' + pages;
    prev.disabled = page <= 1;
    next.disabled = page >= pages;
  }

  let timer;
  q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { page = 1; render(); }, 150); });
  [country, type, scope].forEach((s) => s.addEventListener('change', () => { page = 1; render(); }));
  prev.addEventListener('click', () => { page -= 1; render(); root.scrollIntoView({ block: 'start' }); });
  next.addEventListener('click', () => { page += 1; render(); root.scrollIntoView({ block: 'start' }); });
  render();
});
