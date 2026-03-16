/**
 * product-urgency.js
 * All interactive behaviour for the Aura Athletics PDP
 */
(function () {
  'use strict';

  const data = window.__pdpData || {};

  /* ─────────────────────────────────────────────────────────
     DESKTOP GALLERY — thumb click switches main image
  ───────────────────────────────────────────────────────── */
  function initGallery() {
    const thumbstrip = document.getElementById('pdp-thumbstrip');
    const mainImage  = document.getElementById('pdp-main-image');
    if (!thumbstrip || !mainImage) return;

    const thumbs  = thumbstrip.querySelectorAll('.pdp-thumb');
    const slides  = mainImage.querySelectorAll('.pdp-slide');

    function goTo(index) {
      thumbs.forEach((t, i) => t.classList.toggle('active', i === index));
      slides.forEach((s, i) => s.classList.toggle('active', i === index));
    }

    thumbs.forEach((thumb, i) => {
      thumb.addEventListener('click', () => goTo(i));
    });
  }

  /* ─────────────────────────────────────────────────────────
     MOBILE CAROUSEL — swipe + dot navigation
  ───────────────────────────────────────────────────────── */
  function initMobileCarousel() {
    const track = document.getElementById('pdp-carousel-track');
    const dotsWrap = document.getElementById('pdp-carousel-dots');
    if (!track || !dotsWrap) return;

    const slides = track.querySelectorAll('.pdp-carousel-slide');
    const dots   = dotsWrap.querySelectorAll('.pdp-dot');
    let current = 0;

    function goTo(index) {
      current = Math.max(0, Math.min(index, slides.length - 1));
      track.style.transform = `translateX(${-current * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

    // Touch swipe
    let startX = 0;
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
    });
  }

  /* ─────────────────────────────────────────────────────────
     VARIANT SELECTOR — pill clicks + variant matching
  ───────────────────────────────────────────────────────── */
  function initVariants() {
    if (!data.variants || !data.optionNames) return;

    const form       = document.getElementById('pdp-form');
    const variantInput = document.getElementById('pdp-variant-id');
    const priceEl    = document.getElementById('pdp-price');
    const atcLabel   = document.getElementById('pdp-atc-label');
    const atcBtn     = document.getElementById('pdp-atc-btn');
    const stickyPrice = document.getElementById('pdp-sticky-price');

    // Track currently selected option values
    const selectedOptions = [];
    data.optionNames.forEach((_, i) => {
      const pills = document.querySelectorAll(`.pdp-variant-pills[data-option-index="${i}"] .pdp-variant-pill.active`);
      selectedOptions[i] = pills.length ? pills[0].dataset.optionValue : null;
    });

    function findVariant(options) {
      return data.variants.find(v =>
        v.options.every((opt, i) => opt === options[i])
      ) || null;
    }

    function formatMoney(cents) {
      const amount = (cents / 100).toFixed(2);
      return '\u20AC' + amount; // fallback — Shopify sends already-formatted prices via Liquid
    }

    function updateBuyBox(variant) {
      if (!variant) return;
      // Price
      if (priceEl) {
        if (variant.compareAtPrice && variant.compareAtPrice > variant.price) {
          priceEl.innerHTML =
            `<span class="pdp-price-original">${formatMoney(variant.compareAtPrice)}</span>` +
            `<span class="pdp-price-sale">${formatMoney(variant.price)}</span>`;
        } else {
          priceEl.innerHTML = `<span>${formatMoney(variant.price)}</span>`;
        }
      }
      if (stickyPrice) stickyPrice.textContent = formatMoney(variant.price);

      // ATC state
      if (atcBtn) {
        atcBtn.disabled = !variant.available;
        atcBtn.setAttribute('aria-disabled', String(!variant.available));
      }
      if (atcLabel) atcLabel.textContent = variant.available ? 'Add to Cart' : 'Sold Out';

      // Variant input
      if (variantInput) variantInput.value = variant.id;

      // Gallery: switch to variant image if present
      if (variant.featuredImageSrc) {
        const thumbs = document.querySelectorAll('.pdp-thumb img');
        const mainImgs = document.querySelectorAll('.pdp-slide img');
        thumbs.forEach((img, i) => {
          if (img.src.includes(variant.featuredImageSrc)) {
            document.querySelectorAll('.pdp-thumb')[i].click();
          }
        });
      }
    }

    document.querySelectorAll('.pdp-variant-pill').forEach(pill => {
      pill.addEventListener('click', function () {
        if (this.classList.contains('sold-out')) return;
        const optIdx = parseInt(this.dataset.optionIndex, 10);
        const val    = this.dataset.optionValue;

        // Update active pill in this option group
        document.querySelectorAll(`.pdp-variant-pills[data-option-index="${optIdx}"] .pdp-variant-pill`)
          .forEach(p => p.classList.remove('active'));
        this.classList.add('active');

        selectedOptions[optIdx] = val;
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

    minus.addEventListener('click', () => {
      const v = parseInt(input.value, 10);
      if (v > 1) input.value = v - 1;
    });
    plus.addEventListener('click', () => {
      const v = parseInt(input.value, 10);
      if (v < 99) input.value = v + 1;
    });
  }

  /* ─────────────────────────────────────────────────────────
     ADD TO CART — AJAX with loading state
  ───────────────────────────────────────────────────────── */
  function initATC() {
    const form    = document.getElementById('pdp-form');
    const atcBtn  = document.getElementById('pdp-atc-btn');
    const atcLabel = document.getElementById('pdp-atc-label');
    const stickyBtn = document.getElementById('pdp-sticky-btn');
    if (!form || !atcBtn) return;

    async function addToCart(variantId, qty) {
      atcBtn.classList.add('loading');
      atcLabel.textContent = 'Adding…';
      if (stickyBtn) stickyBtn.textContent = 'Adding…';

      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity: qty })
        });
        if (!res.ok) throw new Error('Cart error');
        atcLabel.textContent = '✓ Added!';
        if (stickyBtn) stickyBtn.textContent = '✓ Added!';
        setTimeout(() => {
          atcLabel.textContent = 'Add to Cart';
          if (stickyBtn) stickyBtn.textContent = 'Add to Cart';
          // Refresh cart count in header
          updateCartCount();
        }, 1800);
      } catch (err) {
        atcLabel.textContent = 'Try again';
        if (stickyBtn) stickyBtn.textContent = 'Try again';
        setTimeout(() => {
          atcLabel.textContent = 'Add to Cart';
          if (stickyBtn) stickyBtn.textContent = 'Add to Cart';
        }, 2000);
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

    // Sticky ATC button wires to same action
    if (stickyBtn) {
      stickyBtn.addEventListener('click', () => {
        const variantId = parseInt(document.getElementById('pdp-variant-id').value, 10);
        const qty       = parseInt(document.getElementById('pdp-qty-input').value, 10) || 1;
        addToCart(variantId, qty);
      });
    }
  }

  function updateCartCount() {
    fetch('/cart.js')
      .then(r => r.json())
      .then(cart => {
        const badge = document.getElementById('cart-count');
        if (badge) badge.textContent = cart.item_count;
      })
      .catch(() => {});
  }

  /* ─────────────────────────────────────────────────────────
     LIVE VIEWER COUNT — animated random number
  ───────────────────────────────────────────────────────── */
  function initViewers() {
    const el = document.getElementById('pdp-viewers-count');
    if (!el) return;
    let count = Math.floor(Math.random() * 18) + 8; // 8–25
    el.textContent = count;
    setInterval(() => {
      const delta = Math.random() < 0.5 ? 1 : -1;
      count = Math.max(5, Math.min(40, count + delta));
      el.textContent = count;
    }, 4200);
  }

  /* ─────────────────────────────────────────────────────────
     COUNTDOWN TIMER — counts down to midnight
  ───────────────────────────────────────────────────────── */
  function initCountdown() {
    const el = document.getElementById('pdp-countdown');
    if (!el) return;

    function tick() {
      const now  = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.textContent =
        String(h).padStart(2, '0') + ':' +
        String(m).padStart(2, '0') + ':' +
        String(s).padStart(2, '0');
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ─────────────────────────────────────────────────────────
     ACCORDION
  ───────────────────────────────────────────────────────── */
  function initAccordion() {
    document.querySelectorAll('.pdp-accordion-trigger').forEach(trigger => {
      trigger.addEventListener('click', function () {
        const item     = this.closest('.pdp-accordion-item');
        const isOpen   = item.classList.contains('open');
        const body     = item.querySelector('.pdp-accordion-body');

        // Close all
        document.querySelectorAll('.pdp-accordion-item.open').forEach(openItem => {
          openItem.classList.remove('open');
          openItem.querySelector('.pdp-accordion-trigger').setAttribute('aria-expanded', 'false');
        });

        // Open clicked (unless it was open)
        if (!isOpen) {
          item.classList.add('open');
          this.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────────────
     MOBILE STICKY ATC — shows when buy box scrolls out
  ───────────────────────────────────────────────────────── */
  function initStickyATC() {
    const stickyBar = document.getElementById('pdp-sticky-atc');
    const atcBtn    = document.getElementById('pdp-atc-btn');
    if (!stickyBar || !atcBtn) return;

    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const visible = !entry.isIntersecting;
        stickyBar.classList.toggle('visible', visible);
        stickyBar.setAttribute('aria-hidden', String(!visible));
      });
    }, { threshold: 0 });

    obs.observe(atcBtn);
  }

  /* ─────────────────────────────────────────────────────────
     REVIEW FILTERS + LOAD MORE
  ───────────────────────────────────────────────────────── */
  function initReviews() {
    const filters   = document.querySelectorAll('.pdp-filter-tab');
    const cards     = document.querySelectorAll('.pdp-review-card');
    const loadMore  = document.getElementById('pdp-load-more');
    const hiddenClass = 'pdp-review-hidden';

    filters.forEach(btn => {
      btn.addEventListener('click', function () {
        filters.forEach(f => f.classList.remove('active'));
        this.classList.add('active');
        const filter = this.dataset.filter;
        cards.forEach(card => {
          const stars = card.dataset.stars;
          const show  = filter === 'all' || stars === filter;
          card.style.display = show ? '' : 'none';
        });
      });
    });

    if (loadMore) {
      loadMore.addEventListener('click', function () {
        const hidden = document.querySelectorAll(`.pdp-review-card.${hiddenClass}`);
        hidden.forEach(card => card.classList.remove(hiddenClass));
        this.style.display = 'none';
      });
    }
  }

  /* ─────────────────────────────────────────────────────────
     SUGGESTED PRODUCTS CAROUSEL — prev/next arrows
  ───────────────────────────────────────────────────────── */
  function initSuggestedCarousel() {
    const track = document.getElementById('pdp-suggested-track');
    const prev  = document.getElementById('pdp-sugg-prev');
    const next  = document.getElementById('pdp-sugg-next');
    if (!track || !prev || !next) return;

    const cards      = track.querySelectorAll('.pdp-sugg-card');
    const cardWidth  = () => cards[0] ? cards[0].getBoundingClientRect().width + 16 : 260;
    let offset = 0;
    const maxVisible = () => Math.floor(track.parentElement.offsetWidth / cardWidth());

    function update() {
      track.style.transform = `translateX(${-offset * cardWidth()}px)`;
      prev.style.opacity = offset === 0 ? '0.3' : '1';
      next.style.opacity = offset >= cards.length - maxVisible() ? '0.3' : '1';
    }

    prev.addEventListener('click', () => { if (offset > 0) { offset--; update(); } });
    next.addEventListener('click', () => {
      if (offset < cards.length - maxVisible()) { offset++; update(); }
    });

    update();
  }

  /* ─────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initGallery();
    initMobileCarousel();
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
