// Client-side search for /learn/ — uses Supabase anon key (RLS scopes results to public articles).
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://jkupfcvqxhlqwwqwmypr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprdXBmY3ZxeGhscXd3cXdteXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjM4MDEsImV4cCI6MjA4NjgzOTgwMX0.3lFJjByJYzObvjj42ujdqhpvCtUuwZfzwvstRdxXyXk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MODULE_LABEL = { fsvp: 'FSVP', cpsia: 'CPSIA', prop65: 'Prop 65', pfas: 'PFAS', general: 'General' };

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderResults(rows) {
  const root = document.getElementById('search-results');
  const status = document.getElementById('search-status');
  if (!rows || rows.length === 0) {
    root.innerHTML = '';
    status.textContent = 'No results. Try a different query.';
    return;
  }
  status.textContent = `${rows.length} result${rows.length === 1 ? '' : 's'}`;
  root.innerHTML = rows.map((a) => `
    <a class="article-card" href="/learn/articles/${escapeHtml(a.slug)}/">
      <span class="module-tag">${escapeHtml(MODULE_LABEL[a.module] || a.module || 'General')}</span>
      <h3>${escapeHtml(a.title)}</h3>
      <p>${escapeHtml(a.excerpt || '')}</p>
    </a>
  `).join('');
}

async function runSearch(q) {
  const status = document.getElementById('search-status');
  if (!q || !q.trim()) {
    status.textContent = 'Enter a query above to search.';
    document.getElementById('search-results').innerHTML = '';
    return;
  }
  status.textContent = 'Searching...';
  // Build a tsquery-friendly string: split on whitespace, AND with &.
  const tsquery = q.trim().split(/\s+/).filter(Boolean).map((t) => t.replace(/[^\w]/g, '')).filter(Boolean).join(' & ');
  let query = supabase
    .from('help_articles')
    .select('slug,title,excerpt,module,category')
    .eq('published', true)
    .eq('visibility', 'public')
    .limit(50);
  if (tsquery) {
    query = query.textSearch('search_vector', tsquery, { config: 'english' });
  }
  const { data, error } = await query;
  if (error) {
    console.error(error);
    status.textContent = 'Search error. Try again.';
    return;
  }
  renderResults(data);
}

const params = new URLSearchParams(location.search);
const q = params.get('q') || '';
const input = document.getElementById('search-input');
if (input) input.value = q;
const form = document.getElementById('search-form');
if (form) {
  form.addEventListener('submit', (e) => {
    // Allow native GET nav so the URL updates; but also intercept for inline behavior:
    // (we let the browser handle navigation — keeps URL shareable.)
  });
}
runSearch(q);
