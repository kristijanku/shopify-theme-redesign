/* ═══════════════════════════════════════════════
   AURA ATHLETICS — SHOPIFY THEME JS
   Ported from redesign/index.html
═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

  /* ─── Scroll reveal ─── */
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  /* ─── Nav scroll state ─── */
  const nav = document.getElementById('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 60);
    }, { passive: true });
  }

  /* ─── Mobile nav toggle ─── */
  window.toggleMobileNav = function () {
    const drawer = document.getElementById('navDrawer');
    if (!drawer || !nav) return;
    const pill = nav.querySelector('.nav-pill');
    const isOpen = drawer.classList.toggle('open');
    if (pill) {
      pill.style.borderRadius = isOpen ? '1.5rem 1.5rem 0 0' : '';
    }
  };

  /* ─── Accordion ─── */
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', function () {
      const item = this.closest('.accordion-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item.open').forEach(openItem => {
        openItem.classList.remove('open');
      });
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ─── Magnetic button ─── */
  const heroCta = document.getElementById('heroCta');
  if (heroCta && window.matchMedia('(hover: hover)').matches) {
    heroCta.addEventListener('mousemove', (e) => {
      const rect = heroCta.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.25;
      const dy = (e.clientY - cy) * 0.25;
      heroCta.style.transform = `translate(${dx}px, ${dy}px) translateY(-2px)`;
    });
    heroCta.addEventListener('mouseleave', () => {
      heroCta.style.transform = '';
    });
  }

  /* ─── Image parallax tilt on hero right ─── */
  const heroRight = document.querySelector('.hero-right');
  if (heroRight && window.matchMedia('(hover: hover)').matches) {
    heroRight.addEventListener('mousemove', (e) => {
      const rect = heroRight.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const img = heroRight.querySelector('img');
      if (img) {
        img.style.transform = `scale(1.04) translate(${x * 12}px, ${y * 8}px)`;
      }
    });
    heroRight.addEventListener('mouseleave', () => {
      const img = heroRight.querySelector('img');
      if (img) img.style.transform = '';
    });
  }

  /* ─── Smooth scroll for nav links ─── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ─── Product gallery thumbnail switching ─── */
  document.querySelectorAll('.product-gallery-thumb').forEach((thumb, i) => {
    thumb.addEventListener('click', function () {
      const gallery = this.closest('.product-gallery');
      if (!gallery) return;
      const mainImg = gallery.querySelector('.product-gallery-main img');
      const thumbImg = this.querySelector('img');
      if (mainImg && thumbImg) {
        mainImg.src = thumbImg.src;
        mainImg.alt = thumbImg.alt;
      }
      gallery.querySelectorAll('.product-gallery-thumb').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
    });
  });

  /* ─── Variant selector ─── */
  document.querySelectorAll('.variant-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      if (this.classList.contains('unavailable')) return;
      const group = this.closest('.variant-buttons');
      if (group) {
        group.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
      }
      this.classList.add('active');
      // Update hidden variant ID input
      const variantId = this.dataset.variantId;
      const form = this.closest('form');
      if (form && variantId) {
        const idInput = form.querySelector('input[name="id"]');
        if (idInput) idInput.value = variantId;
      }
    });
  });

  /* ─── Cart quantity controls ─── */
  document.querySelectorAll('.cart-qty-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const qtyInput = this.closest('.cart-qty')?.querySelector('input[name="updates[]"]');
      if (!qtyInput) return;
      let val = parseInt(qtyInput.value) || 1;
      if (this.dataset.action === 'minus') val = Math.max(0, val - 1);
      if (this.dataset.action === 'plus') val = val + 1;
      qtyInput.value = val;
    });
  });

});
