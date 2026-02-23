/* BlackhawkBraids - Homepage JavaScript */
(function () {
  'use strict';

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');

  function initMobileNavigation() {
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.getElementById('nav-menu');

    if (!toggle || !menu) {
      return;
    }

    toggle.addEventListener('click', function () {
      const isOpen = menu.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('click', function (event) {
      if (!toggle.contains(event.target) && !menu.contains(event.target)) {
        menu.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    const success = document.getElementById('newsletter-success');
    const error = document.getElementById('newsletter-error');

    if (!form || !success || !error) {
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const name = form.querySelector('#newsletter-name');
      const email = form.querySelector('#newsletter-email');
      const submitBtn = form.querySelector('[type="submit"]');

      success.hidden = true;
      error.hidden = true;

      const nameVal = name ? name.value.trim() : '';
      const emailVal = email ? email.value.trim() : '';
      const emailRe = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

      if (!nameVal || !emailVal || !emailRe.test(emailVal)) {
        error.hidden = false;
        (name && !nameVal ? name : email).focus();
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Subscribing...';
      }

      setTimeout(function () {
        success.hidden = false;
        form.reset();

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Subscribe';
        }
      }, 800);
    });
  }

  function initFooterYear() {
    const yearEl = document.getElementById('footer-year');
    if (yearEl) {
      yearEl.textContent = String(new Date().getFullYear());
    }
  }

  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    if (!links.length) {
      return;
    }

    function getScrollOffset() {
      const headerHeight = header ? header.offsetHeight : 0;
      return headerHeight + 14;
    }

    links.forEach(function (anchor) {
      const href = anchor.getAttribute('href');
      if (!href || href === '#' || href === '#cart') {
        return;
      }

      anchor.addEventListener('click', function (event) {
        const target = document.querySelector(href);
        if (!target) {
          return;
        }

        event.preventDefault();

        const targetTop = target.getBoundingClientRect().top + window.scrollY - getScrollOffset();
        window.scrollTo({
          top: Math.max(targetTop, 0),
          behavior: reducedMotionQuery.matches ? 'auto' : 'smooth'
        });

        window.history.replaceState(null, '', href);
      });
    });
  }

  function initScrollReveal() {
    const revealSections = document.querySelectorAll('[data-reveal]');
    if (!revealSections.length) {
      return;
    }

    if (reducedMotionQuery.matches || !('IntersectionObserver' in window)) {
      revealSections.forEach(function (section) {
        section.classList.add('is-visible');
      });
      return;
    }

    document.body.classList.add('has-reveal-js');

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.18,
      rootMargin: '0px 0px -10% 0px'
    });

    revealSections.forEach(function (section, index) {
      section.style.transitionDelay = String(Math.min(index * 80, 220)) + 'ms';
      observer.observe(section);
    });
  }

  function initEcommerceStructure() {
    const ecommerce = window.BlackhawkEcommerce;
    const cartCount = document.getElementById('cart-count');
    const cartButton = document.getElementById('cart-button');
    const cartStatus = document.getElementById('cart-status');

    if (!ecommerce || !cartCount) {
      return;
    }

    ecommerce.config.set({
      apiBaseUrl: '/api',
      checkoutSessionPath: '/checkout/create-session'
    });

    function announce(message) {
      if (!cartStatus) {
        return;
      }

      cartStatus.textContent = '';
      window.setTimeout(function () {
        cartStatus.textContent = message;
      }, 30);
    }

    function updateCartCount() {
      const count = ecommerce.cart.getCount();
      cartCount.textContent = String(count);

      if (cartButton) {
        cartButton.setAttribute('aria-label', 'View cart with ' + String(count) + ' items');
      }
    }

    updateCartCount();
    ecommerce.cart.subscribe(updateCartCount);

    document.querySelectorAll('[data-add-to-cart]').forEach(function (button) {
      button.addEventListener('click', function () {
        const card = button.closest('[data-product-id]');
        if (!card) {
          return;
        }

        const item = {
          productId: card.getAttribute('data-product-id') || '',
          name: card.getAttribute('data-product-name') || 'BlackhawkBraids item',
          price: card.getAttribute('data-product-price') || '0'
        };

        ecommerce.cart.add(item);
        announce(item.name + ' added to cart.');
      });
    });

    if (cartButton) {
      cartButton.addEventListener('click', function (event) {
        event.preventDefault();
        announce('Cart UI and checkout flow will connect in the ecommerce phase.');
      });
    }
  }

  initMobileNavigation();
  initNewsletterForm();
  initFooterYear();
  initSmoothScroll();
  initScrollReveal();
  initEcommerceStructure();
}());
