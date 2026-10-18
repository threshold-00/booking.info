// Behaviour for Salty Cowboy activity detail pages only: the gallery
// lightbox, the in-page tabs, and the mobile sticky bar show/hide. The price
// line in the booking panel and sticky bar is plain [data-price-idr] markup,
// already kept in sync by app.js's site-wide ThCurrency.render, so there is
// nothing left here that depends on a duration-chip widget.
(function () {
  var isDetailPage = document.getElementById('bookingCta');
  if (!isDetailPage) return; // not a detail page

  // Gallery lightbox
  var lightbox = document.getElementById('lightbox');
  var seeAllBtn = document.getElementById('seeAllPhotos');
  if (lightbox && seeAllBtn) {
    var images = [].slice.call(document.querySelectorAll('#detailGallery img[data-lightbox-index]'));
    var lightboxImg = document.getElementById('lightboxImg');
    var lightboxCount = document.getElementById('lightboxCount');
    var closeBtn = document.getElementById('lightboxClose');
    var prevBtn = document.getElementById('lightboxPrev');
    var nextBtn = document.getElementById('lightboxNext');
    var current = 0;
    var lastFocused = null;

    function show(i) {
      current = (i + images.length) % images.length;
      var img = images[current];
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxCount.textContent = (current + 1) + ' of ' + images.length;
    }
    function open(i) {
      lastFocused = document.activeElement;
      show(i);
      lightbox.showModal();
      closeBtn.focus();
    }
    function close() {
      lightbox.close();
      if (lastFocused) lastFocused.focus();
    }

    images.forEach(function (img, i) {
      img.addEventListener('click', function () { open(i); });
    });
    seeAllBtn.addEventListener('click', function () { open(0); });
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', function () { show(current - 1); });
    nextBtn.addEventListener('click', function () { show(current + 1); });
    lightbox.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) close(); });
    lightbox.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'Tab') {
        var focusables = [closeBtn, prevBtn, nextBtn];
        var idx = focusables.indexOf(document.activeElement);
        e.preventDefault();
        var next = e.shiftKey ? (idx - 1 + focusables.length) % focusables.length : (idx + 1) % focusables.length;
        focusables[next].focus();
      }
    });
  }

  // In-page section nav: a real ARIA tabs widget (WAI-ARIA APG tabs pattern,
  // automatic activation). Only one section shows at a time; the rest are
  // [hidden]. Arrow keys move both focus and selection; Home/End jump to the
  // first/last tab. Any other in-page link that targets a panel id (e.g. the
  // "Meet the business" owner-strip link) switches to that tab too.
  var pageNav = document.querySelector('.page-nav[role="tablist"]');
  if (pageNav) {
    var tabs = [].slice.call(pageNav.querySelectorAll('[role="tab"]'));
    var panels = tabs
      .map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); })
      .filter(Boolean);

    function selectTab(tab, opts) {
      var moveFocus = !opts || opts.moveFocus !== false;
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute('aria-selected', selected ? 'true' : 'false');
        t.tabIndex = selected ? 0 : -1;
      });
      panels.forEach(function (p) {
        p.hidden = p.id !== tab.getAttribute('aria-controls');
      });
      if (moveFocus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { selectTab(tab, { moveFocus: false }); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
        else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === 'Home') next = tabs[0];
        else if (e.key === 'End') next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); selectTab(next); }
      });
    });

    // Any other link pointing at a panel id (e.g. the owner-strip "Meet the
    // business" link) activates that tab instead of jumping to hidden content.
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      if (pageNav.contains(link)) return;
      var id = link.getAttribute('href').slice(1);
      var tab = tabs.filter(function (t) { return t.getAttribute('aria-controls') === id; })[0];
      if (!tab) return;
      link.addEventListener('click', function () { selectTab(tab, { moveFocus: false }); });
    });

    // Deep link support: #know, #faq etc. in the URL on load select that tab.
    var initialId = location.hash.slice(1);
    var initialTab = tabs.filter(function (t) { return t.getAttribute('aria-controls') === initialId; })[0];
    if (initialTab) selectTab(initialTab, { moveFocus: false });
  }

  // Mobile sticky bar: hidden while the inline booking button is on screen,
  // or while a field is focused (keyboard open). Body gets padding-bottom
  // equal to the bar's measured height so it never covers the footer, and
  // no dead space is reserved while the bar is hidden.
  var stickyBar = document.getElementById('mobileStickyBar');
  var inlineCta = document.getElementById('bookingCta');
  if (stickyBar && inlineCta) {
    var ctaVisible = false, fieldFocused = false;

    function syncPadding() {
      var hidden = stickyBar.classList.contains('is-hidden');
      document.body.style.paddingBottom = hidden ? '0px' : stickyBar.getBoundingClientRect().height + 'px';
    }

    function render() {
      stickyBar.classList.toggle('is-hidden', ctaVisible || fieldFocused);
      syncPadding();
    }

    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        ctaVisible = entries[0].isIntersecting;
        render();
      }, { threshold: 0.01 });
      obs.observe(inlineCta);
    }

    document.addEventListener('focusin', function (e) {
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) {
        fieldFocused = true;
        render();
      }
    });
    document.addEventListener('focusout', function (e) {
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) {
        fieldFocused = false;
        render();
      }
    });

    window.addEventListener('resize', syncPadding);
    render();
  }
})();
