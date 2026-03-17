/**
 * product-urgency.js — Aura Athletics PDP
 * taste-skill: MOTION_INTENSITY: 6 · DESIGN_VARIANCE: 8
 * Animations use exclusively transform + opacity (no layout-triggering props)
 */
(function () {
  'use strict';

  const data = window.__pdpData || {};

  /* ─────────────────────────────────────────────────────────
     SCROLL REVEAL — staggered IntersectionObserver
  ───────────────────────────────────────────────────────── */
  function initScrollReveal() {
    const els = document.querySelectorAll('.pdp-reveal');
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
  }

  /* ─────────────────────────────────────────────────────────
     REVIEW BAR ANIMATION — animate on scroll into view
  ───────────────────────────────────────────────────────── */
  function initReviewBars() {
    const fills = document.querySelectorAll('.pdp-bar-fill');
    if (!fills.length) return;
    // Store the intended width, reset to 0
    fills.forEach(fill => {
      fill.dataset.targetWidth = fill.style.width;
      fill.style.width = fill.dataset.targetWidth; // keep width, animate via scaleX
    });
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fills.forEach((fill, i) => {
          setTimeout(() => fill.classList.add('animated'), i * 80);
        });
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    const summary = document.querySelector('.pdp-reviews-summary');
    if (summary) obs.observe(summary);
  }

  /* ─────────────────────────────────────────────────────────
     REVIEW CARD REVEAL — staggered fade-up
  ───────────────────────────────────────────────────────── */
  function initReviewCardReveal() {
    const cards = document.querySelectorAll('.pdp-review-card:not(.pdp-review-hidden)');
    if (!cards.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), 60 * i);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    cards.forEach(card => obs.observe(card));
  }

  /* ─────────────────────────────────────────────────────────
     DESKTOP GALLERY — thumb click / crossfade
  ───────────────────────────────────────────────────────── */
  function initGallery() {
    const thumbstrip = document.getElementById('pdp-thumbstrip');
    const mainImage  = document.getElementById('pdp-main-image');
    if (!thumbstrip || !mainImage) return;

    const thumbs = thumbstrip.querySelectorAll('.pdp-thumb');
    const slides = mainImage.querySelectorAll('.pdp-slide');

    function goTo(index) {
      thumbs.forEach((t, i) => t.classList.toggle('active', i === index));
      slides.forEach((s, i) => s.classList.toggle('active', i === index));
    }

    thumbs.forEach((thumb, i) => thumb.addEventListener('click', () => goTo(i)));
  }

  /* ─────────────────────────────────────────────────────────
     MOBILE CAROUSEL — touch swipe + dots
  ───────────────────────────────────────────────────────── */
  function initMobileCarousel() {
    const track    = document.getElementById('pdp-carousel-track');
    const dotsWrap = document.getElementById('pdp-carousel-dots');
    if (!track || !dotsWrap) return;

    const slides = track.querySelectorAll('.pdp-carousel-slide');
    const dots   = dotsWrap.querySelectorAll('.pdp-dot');
    let current  = 0;

    function goTo(index) {
      current = Math.max(0, Math.min(index, slides.length - 1));
      track.style.transform = `translateX(${-current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
    });
  }

  /* ─────────────────────────────────────────────────────────
     MAGNETIC ATC BUTTON — cursor attraction
  ───────────────────────────────────────────────────────── */
  function initMagneticATC() {
    const btn = document.getElementById('pdp-atc-btn');
    if (!btn) return;

    const STRENGTH = 0.35; // magnetic pull strength
    let raf = null;

    function lerp(a, b, t) { return a + (b - a) * t; }

    let targetX = 0, targetY = 0, currentX = 0, currentY = 0;

    function animate() {
      currentX = lerp(currentX, targetX, 0.14);
      currentY = lerp(currentY, targetY, 0.14);
      btn.style.transform = `translate(${currentX}px, ${currentY}px)`;
      if (Math.abs(currentX - targetX) > 0.01 || Math.abs(currentY - targetY) > 0.01) {
        raf = requestAnimationFrame(animate);
      } else {
        raf = null;
      }
    }

    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      targetX = (e.clientX - cx) * STRENGTH;
      targetY = (e.clientY - cy) * STRENGTH;
      if (!raf) raf = requestAnimationFrame(animate);
    });

    btn.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;
      if (!raf) raf = requestAnimationFrame(animate);
    });
  }

  /* ─────────────────────────────────────────────────────────
     VARIANT SELECTOR
  ───────────────────────────────────────────────────────── */
  function initVariants() {
    if (!data.variants || !data.optionNames) return;

    const variantInput  = document.getElementById('pdp-variant-id');
    const priceEl       = document.getElementById('pdp-price');
    const atcLabel      = document.getElementById('pdp-atc-label');
    const atcBtn        = document.getElementById('pdp-atc-btn');
    const stickyPrice   = document.getElementById('pdp-sticky-price');

    const selectedOptions = data.optionNames.map((_, i) => {
      const pill = document.querySelector(`.pdp-variant-pills[data-option-index="${i}"] .pdp-variant-pill.active`);
      return pill ? pill.dataset.optionValue : null;
    });

    function findVariant(opts) {
      return data.variants.find(v => v.options.every((o, i) => o === opts[i])) || null;
    }

    function formatMoney(cents) {
      return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    }

    function updateBuyBox(variant) {
      if (!variant) return;

      if (priceEl) {
        if (variant.compareAtPrice > variant.price) {
          priceEl.innerHTML =
            `<span class="pdp-price-original">${formatMoney(variant.compareAtPrice)}</span>` +
            `<span class="pdp-price-sale">${formatMoney(variant.price)}</span>`;
        } else {
          priceEl.innerHTML = `<span>${formatMoney(variant.price)}</span>`;
        }
      }

      if (stickyPrice) stickyPrice.textContent = formatMoney(variant.price);

      if (atcBtn) {
        atcBtn.disabled = !variant.available;
        atcBtn.setAttribute('aria-disabled', String(!variant.available));
      }
      if (atcLabel) atcLabel.textContent = variant.available ? 'Add to Bag' : 'Sold Out';
      if (variantInput) variantInput.value = variant.id;

      // Switch to variant's featured image
      if (variant.featuredImageSrc) {
        const thumbs = document.querySelectorAll('.pdp-thumb img');
        thumbs.forEach((img, i) => {
          if (img.src && variant.featuredImageSrc && img.src.includes(variant.featuredImageSrc.split('?')[0].split('/').pop().split('_')[0])) {
            document.querySelectorAll('.pdp-thumb')[i].click();
          }
        });
      }
    }

    document.querySelectorAll('.pdp-variant-pill').forEach(pill => {
      pill.addEventListener('click', function () {
        if (this.classList.contains('sold-out')) return;
        const optIdx = parseInt(this.dataset.optionIndex, 10);

        document.querySelectorAll(`.pdp-variant-pills[data-option-index="${optIdx}"] .pdp-variant-pill`)
          .forEach(p => p.classList.remove('active'));
        this.classList.add('active');

        selectedOptions[optIdx] = this.dataset.optionValue;
        const matched = findVariant(selectedOptions);
        if (matched) updateBuyBox(matched);
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     QTY STEPPER
  ───────────────────────────────────────────────────────── */
  function initQty() {
    const input = document.getElementById('pdp-qty-input');
    const minus = document.getElementById('pdp-qty-minus');
    const plus  = document.getElementById('pdp-qty-plus');
    if (!input || !minus || !plus) return;
    minus.addEventListener('click', () => { const v = parseInt(input.value, 10); if (v > 1) input.value = v - 1; });
    plus.addEventListener('click',  () => { const v = parseInt(input.value, 10); if (v < 99) input.value = v + 1; });
  }

  /* ─────────────────────────────────────────────────────────
     AJAX ADD TO CART
  ───────────────────────────────────────────────────────── */
  function initATC() {
    const form      = document.getElementById('pdp-form');
    const atcBtn    = document.getElementById('pdp-atc-btn');
    const atcLabel  = document.getElementById('pdp-atc-label');
    const stickyBtn = document.getElementById('pdp-sticky-btn');
    if (!form || !atcBtn) return;

    async function addToCart(variantId, qty) {
      atcBtn.classList.add('loading');
      if (atcLabel) atcLabel.textContent = 'Adding…';
      if (stickyBtn) stickyBtn.querySelector('span') && (stickyBtn.querySelector('span').textContent = 'Adding…');

      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: qty })
        });
        if (!res.ok) throw new Error('Cart error');
        if (atcLabel) atcLabel.textContent = 'Added ✓';
        if (stickyBtn && stickyBtn.querySelector('span')) stickyBtn.querySelector('span').textContent = 'Added ✓';
        setTimeout(() => {
          if (atcLabel) atcLabel.textContent = 'Add to Bag';
          if (stickyBtn && stickyBtn.querySelector('span')) stickyBtn.querySelector('span').textContent = 'Add to Bag';
          refreshCartCount();
        }, 2000);
      } catch (err) {
        if (atcLabel) atcLabel.textContent = 'Try again';
        setTimeout(() => { if (atcLabel) atcLabel.textContent = 'Add to Bag'; }, 2200);
      } finally {
        atcBtn.classList.remove('loading');
      }
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      const variantId = parseInt(document.getElementById('pdp-variant-id').value, 10);
      const qty       = parseInt(document.getElementById('pdp-qty-input').value, 10) || 1;
      addToCart(variantId, qty);
    });

    if (stickyBtn) {
      stickyBtn.addEventListener('click', () => {
        const variantId = parseInt(document.getElementById('pdp-variant-id').value, 10);
        const qty       = parseInt(document.getElementById('pdp-qty-input').value, 10) || 1;
        addToCart(variantId, qty);
      });
    }
  }

  function refreshCartCount() {
    fetch('/cart.js').then(r => r.json()).then(cart => {
      const badge = document.getElementById('cart-count');
      if (badge) badge.textContent = cart.item_count;
    }).catch(() => {});
  }

  /* ─────────────────────────────────────────────────────────
     LIVE VIEWER COUNT
  ───────────────────────────────────────────────────────── */
  function initViewers() {
    const el = document.getElementById('pdp-viewers-count');
    if (!el) return;
    let count = Math.floor(Math.random() * 16) + 7;
    el.textContent = count;
    setInterval(() => {
      count = Math.max(4, Math.min(38, count + (Math.random() < 0.5 ? 1 : -1)));
      el.textContent = count;
    }, 5000);
  }

  /* ─────────────────────────────────────────────────────────
     MIDNIGHT DISPATCH COUNTDOWN
  ───────────────────────────────────────────────────────── */
  function initCountdown() {
    const el = document.getElementById('pdp-countdown');
    if (!el) return;
    function tick() {
      const now = new Date(), midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const d = midnight - now;
      const h = Math.floor(d / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);
      el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ─────────────────────────────────────────────────────────
     ACCORDION — smooth grid-template-rows
  ───────────────────────────────────────────────────────── */
  function initAccordion() {
    document.querySelectorAll('.pdp-accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', function () {
        const item   = this.closest('.pdp-accordion-item');
        const isOpen = item.classList.contains('open');

        document.querySelectorAll('.pdp-accordion-item.open').forEach(open => {
          open.classList.remove('open');
          open.querySelector('.pdp-accordion-trigger').setAttribute('aria-expanded', 'false');
        });

        if (!isOpen) {
          item.classList.add('open');
          this.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     STICKY MOBILE ATC — IntersectionObserver on ATC btn
  ───────────────────────────────────────────────────────── */
  function initStickyATC() {
    const bar    = document.getElementById('pdp-sticky-atc');
    const atcBtn = document.getElementById('pdp-atc-btn');
    if (!bar || !atcBtn) return;

    const obs = new IntersectionObserver(entries => {
      const show = !entries[0].isIntersecting;
      bar.classList.toggle('visible', show);
      bar.setAttribute('aria-hidden', String(!show));
    }, { threshold: 0 });

    obs.observe(atcBtn);
  }

  /* ─────────────────────────────────────────────────────────
     REVIEW FILTERS + LOAD MORE
  ───────────────────────────────────────────────────────── */
  function initReviews() {
    const filters  = document.querySelectorAll('.pdp-filter-tab');
    const loadMore = document.getElementById('pdp-load-more');

    filters.forEach(btn => {
      btn.addEventListener('click', function () {
        filters.forEach(f => f.classList.remove('active'));
        this.classList.add('active');
        const filter = this.dataset.filter;
        document.querySelectorAll('.pdp-review-card').forEach(card => {
          card.style.display = (filter === 'all' || card.dataset.stars === filter) ? '' : 'none';
        });
      });
    });

    if (loadMore) {
      loadMore.addEventListener('click', function () {
        const hidden = document.querySelectorAll('.pdp-review-card.pdp-review-hidden');
        hidden.forEach((card, i) => {
          card.classList.remove('pdp-review-hidden');
          setTimeout(() => card.classList.add('visible'), i * 60);
        });
        this.style.display = 'none';
      });
    }
  }

  /* ─────────────────────────────────────────────────────────
     SUGGESTED CAROUSEL — prev / next
  ───────────────────────────────────────────────────────── */
  function initSuggestedCarousel() {
    const track = document.getElementById('pdp-suggested-track');
    const prev  = document.getElementById('pdp-sugg-prev');
    const next  = document.getElementById('pdp-sugg-next');
    if (!track || !prev || !next) return;

    const cards     = track.querySelectorAll('.pdp-sugg-card');
    const gap       = 24;
    let offset      = 0;
    const cardW     = () => (cards[0] ? cards[0].getBoundingClientRect().width + gap : 260);
    const maxOffset = () => Math.max(0, cards.length - Math.floor(track.parentElement.offsetWidth / cardW()));

    function update() {
      track.style.transform = `translateX(${-offset * cardW()}px)`;
      prev.style.opacity = offset === 0 ? '0.3' : '1';
      next.style.opacity = offset >= maxOffset() ? '0.3' : '1';
    }

    prev.addEventListener('click', () => { if (offset > 0) { offset--; update(); } });
    next.addEventListener('click', () => { if (offset < maxOffset()) { offset++; update(); } });
    update();
  }

  /* ─────────────────────────────────────────────────────────
     INIT ALL
  ───────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initScrollReveal();
    initReviewBars();
    initReviewCardReveal();
    initGallery();
    initMobileCarousel();
    initMagneticATC();
    initVariants();
    initQty();
    initATC();
    initViewers();
    initCountdown();
    initAccordion();
    initStickyATC();
    initReviews();
    initSuggestedCarousel();
  });

})();
