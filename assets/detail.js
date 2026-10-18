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
