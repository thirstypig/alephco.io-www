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

  // Contact form
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Sending...';
      btn.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { 'Accept': 'application/json' },
        });
        if (res.ok) {
          form.style.display = 'none';
          document.querySelector('.form-success').style.display = 'block';
        } else {
          btn.textContent = 'Error — try again';
          btn.disabled = false;
          setTimeout(() => { btn.textContent = original; }, 3000);
        }
      } catch {
        btn.textContent = 'Error — try again';
        btn.disabled = false;
        setTimeout(() => { btn.textContent = original; }, 3000);
      }
    });
  }
});
