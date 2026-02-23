/* BlackhawkBraids – Homepage JavaScript */
(function () {
  'use strict';

  /* --------------------------------------------------
     Mobile navigation toggle
  -------------------------------------------------- */
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.getElementById('nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu when a link is clicked
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu on outside click
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --------------------------------------------------
     Newsletter form submission
  -------------------------------------------------- */
  const form    = document.getElementById('newsletter-form');
  const success = document.getElementById('newsletter-success');
  const error   = document.getElementById('newsletter-error');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const name  = form.querySelector('#newsletter-name');
      const email = form.querySelector('#newsletter-email');

      // Hide previous messages
      success.hidden = true;
      error.hidden   = true;

      // Basic validation
      const nameVal  = name  ? name.value.trim()  : '';
      const emailVal = email ? email.value.trim() : '';
      const emailRe  = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

      if (!nameVal || !emailVal || !emailRe.test(emailVal)) {
        error.hidden = false;
        (name && !nameVal ? name : email).focus();
        return;
      }

      // Simulate successful submission (replace with real API call)
      const submitBtn = form.querySelector('[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Subscribing…';

      setTimeout(function () {
        success.hidden = false;
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subscribe';
      }, 800);
    });
  }

  /* --------------------------------------------------
     Update copyright year
  -------------------------------------------------- */
  const yearEl = document.getElementById('footer-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* --------------------------------------------------
     Smooth scroll polyfill for anchor links
  -------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

}());
