// Behaviour for Salty Cowboy activity detail pages only. Duration selection, the
// rider stepper, live total, the photographer add-on, the gallery lightbox, the
// in-page nav active state, and the mobile sticky bar.
(function () {
  var durationGroup = document.getElementById('durationGroup');
  if (!durationGroup) return; // not a detail page

  var chips = [].slice.call(durationGroup.querySelectorAll('.duration-chip'));
  var addon = document.getElementById('addonCheckbox');
  var totalEl = document.getElementById('bookingTotal');
  var totalLabelEl = document.getElementById('bookingTotalLabel');
  var startTimesLine = document.getElementById('startTimesLine');
  var mobileDuration = document.getElementById('mobileStickyDuration');
  var mobileTotal = document.getElementById('mobileStickyTotal');
  var stepper = document.getElementById('riderStepper');
  var riderCountEl = document.getElementById('riderCount');
  var riderMinus = document.getElementById('riderMinus');
  var riderPlus = document.getElementById('riderPlus');

  var ADDON_PER_HOUR = 2000000;
  var maxPeople = stepper ? Number(stepper.getAttribute('data-max-people')) || 1 : 1;
  var minPeople = stepper ? Number(stepper.getAttribute('data-min-people')) || 1 : 1;
  var noun = stepper ? stepper.getAttribute('data-noun') : 'rider';
  var nounPlural = stepper ? stepper.getAttribute('data-noun-plural') : 'riders';
  var riders = minPeople;

  function selected() {
    return chips.filter(function (c) { return c.getAttribute('aria-checked') === 'true'; })[0] || chips[0];
  }

  function currentTotalIdr() {
    var chip = selected();
    var idr = Number(chip.getAttribute('data-chip-idr')) || 0;
    if (stepper) idr *= riders;
    if (addon && addon.checked) idr += ADDON_PER_HOUR;
    return idr;
  }

  function updateStepperButtons() {
    if (!stepper) return;
    riderCountEl.textContent = String(riders);
    riderMinus.disabled = riders <= minPeople;
    riderMinus.setAttribute('aria-disabled', riderMinus.disabled ? 'true' : 'false');
    riderPlus.disabled = riders >= maxPeople;
    riderPlus.setAttribute('aria-disabled', riderPlus.disabled ? 'true' : 'false');
  }

  function render() {
    var chip = selected();
    var currency = window.ThCurrency;
    var totalText = currency ? currency.format(currentTotalIdr()) : '';
    if (totalEl) totalEl.textContent = totalText;
    if (totalLabelEl) {
      totalLabelEl.textContent = stepper
        ? 'Total for ' + riders + ' ' + (riders === 1 ? noun : nounPlural)
        : 'Total';
    }
    if (mobileTotal) mobileTotal.textContent = stepper ? totalText + ' for ' + riders : totalText;
    if (mobileDuration) mobileDuration.textContent = chip.getAttribute('data-label') || '';
    // Price shown inside each duration chip
    chips.forEach(function (c) {
      var priceEl = c.querySelector('.duration-chip__price');
      if (priceEl && currency) {
        priceEl.textContent = currency.format(Number(priceEl.getAttribute('data-price-idr')), {
          suffix: priceEl.getAttribute('data-price-suffix') || ''
        });
      }
    });
    // Start times for the selected duration come from the generated table's matching row
    if (startTimesLine) {
      var table = document.querySelector('table');
      var label = chip.getAttribute('data-label') || '';
      var text = '';
      if (table) {
        [].slice.call(table.querySelectorAll('tbody tr')).forEach(function (row) {
          var cells = row.querySelectorAll('td');
          if (cells[0] && cells[0].textContent.trim() === label) text = cells[1].textContent.trim();
        });
      }
      startTimesLine.textContent = text ? 'Start times: ' + text : '';
    }
  }

  function selectChip(chip) {
    chips.forEach(function (c) {
      c.setAttribute('aria-checked', c === chip ? 'true' : 'false');
      c.setAttribute('tabindex', c === chip ? '0' : '-1');
    });
    render();
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () { selectChip(chip); chip.focus(); });
    // G2: roving tabindex radiogroup keyboard support.
    chip.addEventListener('keydown', function (e) {
      var i = chips.indexOf(chip);
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = chips[(i + 1) % chips.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = chips[(i - 1 + chips.length) % chips.length];
      else if (e.key === 'Home') next = chips[0];
      else if (e.key === 'End') next = chips[chips.length - 1];
      if (!next) return;
      e.preventDefault();
      selectChip(next);
      next.focus();
    });
  });

  if (addon) addon.addEventListener('change', render);

  if (stepper) {
    updateStepperButtons();
    riderMinus.addEventListener('click', function () {
      if (riders <= minPeople) return;
      riders -= 1;
      updateStepperButtons();
      render();
    });
    riderPlus.addEventListener('click', function () {
      if (riders >= maxPeople) return;
      riders += 1;
      updateStepperButtons();
      render();
    });
  }

  // Re-render once ThCurrency has fetched a live rate or the currency toggle changes
  document.addEventListener('DOMContentLoaded', render);
  window.addEventListener('storage', function (e) {
    if (e.key === 'th_currency' || e.key === 'th_idr_aud_rate') render();
  });
  var origRender = window.ThCurrency && window.ThCurrency.render;
  if (window.ThCurrency) {
    window.ThCurrency.render = function () { origRender(); render(); };
  }
  render();

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

  // In-page section nav: every section is visible and stacked (no tabs), so this
  // just tracks which one is in view and underlines the matching link. Driven by
  // scroll/resize (rAF-throttled) rather than IntersectionObserver: a single
  // observer callback only reports sections whose intersection state just
  // changed, not every section's current position, so on an abrupt jump (a nav
  // click, Home/End, find-in-page) it can miss the one actually at the top of
  // the viewport. Recomputing from every section's position on every frame is
  // cheap (11 sections max) and always correct.
  var pageNav = document.querySelector('.page-nav');
  if (pageNav) {
    var links = [].slice.call(pageNav.querySelectorAll('a'));
    var sections = links
      .map(function (l) { return document.getElementById(l.getAttribute('href').slice(1)); })
      .filter(Boolean);
    function setCurrent(id) {
      links.forEach(function (l) {
        var isCurrent = l.getAttribute('href') === '#' + id;
        l.toggleAttribute('aria-current', isCurrent);
        if (isCurrent) l.setAttribute('aria-current', 'true');
      });
    }
    var LINE = 96;
    var ticking = false;
    function recompute() {
      ticking = false;
      var current = sections[0];
      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top - LINE <= 0) current = sections[i];
      }
      setCurrent(current.id);
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(recompute);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    recompute();
  }

  // Mobile sticky bar: hidden while the inline booking button is on screen
  var stickyBar = document.getElementById('mobileStickyBar');
  var inlineCta = document.getElementById('bookingCta');
  if (stickyBar && inlineCta && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      stickyBar.classList.toggle('is-hidden', entries[0].isIntersecting);
    }, { threshold: 0.01 });
    obs.observe(inlineCta);
  }
})();
