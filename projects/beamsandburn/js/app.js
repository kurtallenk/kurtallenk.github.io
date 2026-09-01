// Core site JS — shared across all pages
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ */
  /* Mobile nav toggle                                                   */
  /* ------------------------------------------------------------------ */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('navLinks');
  var scrim = document.getElementById('navScrim');

  function closeNav() {
    if (!nav) return;
    nav.classList.remove('open');
    if (scrim) scrim.classList.remove('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function openNav() {
    if (!nav) return;
    nav.classList.add('open');
    if (scrim) scrim.classList.add('open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.contains('open');
      if (isOpen) { closeNav(); } else { openNav(); }
    });
  }
  if (scrim) scrim.addEventListener('click', closeNav);
  nav && nav.querySelectorAll('.nav-link').forEach(function (a) {
    a.addEventListener('click', closeNav);
  });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  /* ------------------------------------------------------------------ */
  /* Active nav link — driven by body[data-page]                        */
  /* ------------------------------------------------------------------ */
  var page = document.body.getAttribute('data-page');
  if (page) {
    document.querySelectorAll('.nav-link[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === page) a.classList.add('active');
    });
  }

  /* ------------------------------------------------------------------ */
  /* Sticky header shadow on scroll                                     */
  /* ------------------------------------------------------------------ */
  var header = document.getElementById('siteHeader');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ------------------------------------------------------------------ */
  /* Footer year                                                        */
  /* ------------------------------------------------------------------ */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------ */
  /* Scroll reveal                                                      */
  /* ------------------------------------------------------------------ */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var groups = {};
      revealEls.forEach(function (el) {
        var group = el.closest('[data-reveal-group]');
        if (group) {
          groups[group] = groups[group] || 0;
          el.style.setProperty('--i', groups[group]);
          groups[group]++;
        }
      });
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Contact form handler (no backend) — show simple success message     */
  /* ------------------------------------------------------------------ */
  var contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = contactForm.name && contactForm.name.value ? contactForm.name.value : 'friend';
      alert('Thanks, ' + name + '! We received your message and will get back to you.');
      contactForm.reset();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Gallery lightbox — swipe + smooth animation                        */
  /* ------------------------------------------------------------------ */
  var gallery = document.getElementById('galleryGrid');
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxCaption = document.getElementById('lightboxCaption');
  var closeBtn = document.getElementById('closeLightbox');
  var prevBtn = document.getElementById('prevBtn');
  var nextBtn = document.getElementById('nextBtn');
  var galleryImgs = [];
  var currentIndex = 0;
  var animating = false;

  function openLightbox(idx, direction) {
    if (animating) return;
    currentIndex = idx;
    var img = galleryImgs[currentIndex];
    if (!img) return;

    animating = true;

    if (reduceMotion) {
      lightboxImg.src = img.src;
      lightboxCaption.textContent = img.getAttribute('data-caption') || img.alt || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      animating = false;
      return;
    }

    if (direction === 'next') {
      lightboxImg.classList.add('slide-out-left');
    } else if (direction === 'prev') {
      lightboxImg.classList.add('slide-out-right');
    } else {
      lightboxImg.classList.add('fade-out');
    }

    setTimeout(function () {
      lightboxImg.src = img.src;
      lightboxCaption.textContent = img.getAttribute('data-caption') || img.alt || '';

      if (direction === 'next') {
        lightboxImg.className = 'slide-in-right';
      } else if (direction === 'prev') {
        lightboxImg.className = 'slide-in-left';
      } else {
        lightboxImg.className = 'fade-in';
      }

      setTimeout(function () {
        lightboxImg.className = '';
        animating = false;
      }, 400);
    }, 300);

    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
  }

  function next() { openLightbox((currentIndex + 1) % galleryImgs.length, 'next'); }
  function prev() { openLightbox((currentIndex - 1 + galleryImgs.length) % galleryImgs.length, 'prev'); }

  if (gallery && lightbox) {
    galleryImgs = Array.from(gallery.querySelectorAll('.gallery-item'));
    galleryImgs.forEach(function (img, i) {
      var wrap = img.closest('.gallery-item-wrap') || img;
      wrap.addEventListener('click', function () { openLightbox(i); });
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('aria-label', 'Open image: ' + (img.alt || 'gallery item'));
      wrap.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);

    window.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') closeLightbox();
    });

    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    // Mobile swipe support
    var startX = 0, endX = 0;
    lightboxImg.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; });
    lightboxImg.addEventListener('touchmove', function (e) { endX = e.touches[0].clientX; });
    lightboxImg.addEventListener('touchend', function () {
      var threshold = 50;
      var diff = endX - startX;
      if (Math.abs(diff) > threshold) {
        if (diff < 0) next(); else prev();
      }
      startX = 0; endX = 0;
    });
  }
})();
