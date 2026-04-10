// Email signup handler
function handleSignup(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.email.value;
  const msg = document.getElementById('signup-msg');

  // Store locally for now (replace with Resend/Mailchimp/API endpoint later)
  const signups = JSON.parse(localStorage.getItem('aleph-signups') || '[]');
  if (signups.includes(email)) {
    msg.textContent = "You're already on the list!";
    msg.style.color = 'var(--fg-muted)';
  } else {
    signups.push(email);
    localStorage.setItem('aleph-signups', JSON.stringify(signups));
    msg.textContent = "You're in! We'll send updates to " + email;
    msg.style.color = 'var(--teal-500)';
  }
  msg.style.display = 'block';
  form.email.value = '';
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

  // Theme toggle
  const themeBtn = document.querySelector('.theme-toggle');
  if (themeBtn) {
    const saved = localStorage.getItem('aleph-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);

    themeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('aleph-theme', next);
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
