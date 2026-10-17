// Behaviour for Salty Cowboy activity detail pages only. Duration selection, live
// total, the photographer add-on, the gallery lightbox, and the mobile sticky bar.
(function () {
  var durationGroup = document.getElementById('durationGroup');
  if (!durationGroup) return; // not a detail page

  var chips = [].slice.call(durationGroup.querySelectorAll('.duration-chip'));
  var addon = document.getElementById('addonCheckbox');
  var totalEl = document.getElementById('bookingTotal');
  var startTimesLine = document.getElementById('startTimesLine');
  var mobileDuration = document.getElementById('mobileStickyDuration');
  var mobileTotal = document.getElementById('mobileStickyTotal');

  var ADDON_PER_HOUR = 2000000;

  function selected() {
    return chips.filter(function (c) { return c.getAttribute('aria-checked') === 'true'; })[0] || chips[0];
  }

  function currentTotalIdr() {
    var chip = selected();
    var idr = Number(chip.getAttribute('data-price-idr')) || 0;
    if (addon && addon.checked) idr += ADDON_PER_HOUR;
    return idr;
  }

  function render() {
    var chip = selected();
    var currency = window.ThCurrency;
    if (totalEl) totalEl.textContent = currency ? currency.format(currentTotalIdr()) : '';
    if (mobileTotal) mobileTotal.textContent = currency ? currency.format(currentTotalIdr()) : '';
    if (mobileDuration) mobileDuration.textContent = chip.textContent.trim();
    // Price shown inside each duration chip
    chips.forEach(function (c) {
      var priceEl = c.querySelector('.duration-chip__price');
      if (priceEl && currency) priceEl.textContent = currency.format(Number(c.getAttribute('data-price-idr')));
    });
    // Start times for the selected duration come from the generated table's matching row
    if (startTimesLine) {
      var table = document.querySelector('table');
      var label = chip.textContent.trim();
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

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.setAttribute('aria-checked', 'false'); });
      chip.setAttribute('aria-checked', 'true');
      render();
    });
  });

  if (addon) addon.addEventListener('change', render);

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

  // Section tabs: progressive enhancement. Without JS every panel stays visible
  // and stacked (the markup has no hidden attributes), so the page still reads
  // fine. With JS, only the active panel shows under the tab row.
  var tabs = [].slice.call(document.querySelectorAll('.tab-nav [role="tab"]'));
  if (tabs.length) {
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });

    function activate(index, focusPanel) {
      tabs.forEach(function (t, i) {
        var isActive = i === index;
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        t.tabIndex = isActive ? 0 : -1;
      });
      panels.forEach(function (p, i) { if (p) p.hidden = i !== index; });
      if (focusPanel && panels[index]) panels[index].focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activate(i, false); });
      tab.addEventListener('keydown', function (e) {
        var next;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        else return;
        e.preventDefault();
        tabs[next].focus();
        activate(next, false);
      });
    });

    // Links elsewhere on the page that point at a panel id (e.g. "Run by Salty
    // Cowboy" linking to #business) should switch tabs too, not just scroll
    // to a hidden panel.
    panels.forEach(function (panel, i) {
      if (!panel) return;
      [].slice.call(document.querySelectorAll('a[href="#' + panel.id + '"]')).forEach(function (link) {
        link.addEventListener('click', function () { activate(i, false); });
      });
    });

    activate(0, false);
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
