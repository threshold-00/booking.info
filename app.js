// RealDays, static site behaviour. Set your address here (used by the contact form and call link).
var CONTACT_EMAIL = 'rowena@getrealdays.com';

// Formspree form endpoint, e.g. 'https://formspree.io/f/abcdwxyz'. Empty means the form falls back to a mail draft.
var FORM_ENDPOINT = '';

// Site-wide currency toggle. All experience prices are sourced in IDR; this converts
// them to AUD using a live rate (frankfurter.app, free, no key) cached in localStorage,
// with a fixed fallback rate if the fetch fails or hasn't run yet. The chosen currency
// and any element marked data-price-idr are kept in sync across every page via
// localStorage, since this is a static multi-page site with no shared app state.
// Prices set in AUD (the business demos) use data-price-aud and convert the same way.
window.ThCurrency = (function () {
  var CURRENCY_KEY = 'th_currency';
  var RATE_KEYS = { AUD: 'th_idr_aud_rate', USD: 'th_idr_usd_rate' };
  var RATE_TS_KEY = 'th_idr_rate_ts';
  // Fallback rates, used only until the live fetch below succeeds or if it
  // fails. AUD matches the rate already shipped; USD was pulled from the
  // same source (frankfurter.app) on 2026-10-18 (1 IDR = 0.000055 USD) and
  // shown to Ro rather than invented, per her brief.
  var FALLBACK_RATES = { AUD: 0.0001, USD: 0.000055 };
  var DEFAULT_CURRENCY = 'AUD';
  var RATE_MAX_AGE = 1000 * 60 * 60 * 6; // refetch at most every 6 hours

  function getCurrency() {
    try { return localStorage.getItem(CURRENCY_KEY) || DEFAULT_CURRENCY; } catch (e) { return DEFAULT_CURRENCY; }
  }
  function setCurrency(c) {
    try { localStorage.setItem(CURRENCY_KEY, c); } catch (e) { /* ignore */ }
    render();
  }
  function getCachedRates() {
    try {
      var ts = Number(localStorage.getItem(RATE_TS_KEY) || 0);
      if (Date.now() - ts >= RATE_MAX_AGE) return null;
      var aud = Number(localStorage.getItem(RATE_KEYS.AUD));
      var usd = Number(localStorage.getItem(RATE_KEYS.USD));
      if (aud && usd) return { AUD: aud, USD: usd };
    } catch (e) { /* ignore */ }
    return null;
  }
  function cacheRates(rates) {
    try {
      localStorage.setItem(RATE_KEYS.AUD, String(rates.AUD));
      localStorage.setItem(RATE_KEYS.USD, String(rates.USD));
      localStorage.setItem(RATE_TS_KEY, String(Date.now()));
    } catch (e) { /* ignore */ }
  }

  var rates = getCachedRates() || FALLBACK_RATES;

  function fetchRate() {
    fetch('https://api.frankfurter.app/latest?from=IDR&to=AUD,USD')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
      .then(function (data) {
        var live = data && data.rates;
        if (live && live.AUD && live.USD) {
          rates = { AUD: live.AUD, USD: live.USD };
          cacheRates(rates);
          render();
        }
      })
      .catch(function () { /* keep the fallback rates */ });
  }

  function formatIDR(amount) {
    return 'IDR ' + Math.round(amount).toLocaleString('en-US');
  }
  function formatConverted(amount, code) {
    var n = amount >= 100 ? Math.round(amount) : Math.round(amount * 100) / 100;
    return '$' + n.toLocaleString('en-US') + ' ' + code;
  }

  function format(idrAmount, opts) {
    opts = opts || {};
    var currency = getCurrency();
    var text = currency === 'IDR' ? formatIDR(idrAmount) : formatConverted(idrAmount * rates[currency], currency);
    return (opts.prefix ? opts.prefix + ' ' : '') + text + (opts.suffix || '');
  }
  function formatAUD(audAmount, opts) {
    opts = opts || {};
    var currency = getCurrency();
    var text = currency === 'AUD' ? formatConverted(audAmount, 'AUD')
      : currency === 'IDR' ? formatIDR(audAmount / rates.AUD)
      : formatConverted(audAmount * rates[currency] / rates.AUD, currency);
    return (opts.prefix ? opts.prefix + ' ' : '') + text + (opts.suffix || '');
  }

  function render() {
    var currency = getCurrency();
    document.querySelectorAll('[data-price-idr]').forEach(function (el) {
      var idr = Number(el.getAttribute('data-price-idr'));
      if (!idr) return;
      el.textContent = format(idr, {
        prefix: el.getAttribute('data-price-prefix') || '',
        suffix: el.getAttribute('data-price-suffix') || ''
      });
    });
    document.querySelectorAll('[data-price-aud]').forEach(function (el) {
      var aud = Number(el.getAttribute('data-price-aud'));
      if (!aud) return;
      el.textContent = formatAUD(aud, {
        prefix: el.getAttribute('data-price-prefix') || '',
        suffix: el.getAttribute('data-price-suffix') || ''
      });
    });
    document.querySelectorAll('.currency-select').forEach(function (sel) {
      sel.value = currency;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.currency-select').forEach(function (sel) {
      sel.addEventListener('change', function () { setCurrency(sel.value); });
    });
    render();
    fetchRate();
  });

  return { format: format, formatAUD: formatAUD, getCurrency: getCurrency, setCurrency: setCurrency, render: render };
})();


// Explore map (Leaflet, vendored in assets/leaflet/), in the homepage's "View on map"
// panel (mapPanel, below). One pin per business location; each pin shows that business's activities one
// at a time, read from the homepage cards (#browseGrid), so a new card shows up on the
// map without touching this list. The map follows the browse filters (only pins with a
// matching card, and only the matching cards in each pin). It is built the first time
// the panel opens, so Leaflet measures a visible box. Pins sit on the business's
// address, or the suburb when the address is private or not confirmed.
var exploreMap = (function () {
  var mapEl = document.getElementById('exploreMap');
  if (!mapEl || typeof L === 'undefined') return null;

  // business: the cards' data-business. emoji: shown in the pin, for the activity.
  // only: card ?x= keys, when one business has activities in two places.
  var pins = [
    { business: 'Gordon Studio Glassblowers', emoji: '🔥', place: 'Red Hill', region: 'mornington', lat: -38.3726, lng: 145.0218 },
    { business: 'Heathcote Bike Hire', emoji: '🚲', place: 'Heathcote', region: 'mornington', lat: -36.9220, lng: 144.7080 },
    { business: 'Salty Seas Surf School', emoji: '🏄', place: 'Inverloch', region: 'mornington', lat: -38.6475, lng: 145.7390 },
    { business: 'Tiger Moth World', emoji: '✈️', place: 'Torquay Airport', region: 'mornington', lat: -38.2977, lng: 144.3653 },
    { business: 'Spring Creek Horse Rides', emoji: '🐴', place: 'Bellbrae, near Torquay', region: 'mornington', lat: -38.3375, lng: 144.2533 },
    { business: 'Indigo Woodworks', emoji: '🪵', place: 'Indigo Valley', region: 'mornington', lat: -36.0860, lng: 146.8480 },
    { business: 'Moonraker Dolphin Swims', emoji: '🐬', place: 'Sorrento Pier', region: 'mornington', lat: -38.3390, lng: 144.7430 },
    { business: 'Phoenix Pottery', emoji: '🏺', place: 'Fitzroy', region: 'mornington', lat: -37.7985, lng: 144.9772 },
    { business: 'Lygon Street Pottery', emoji: '🏺', place: 'Brunswick East', region: 'mornington', lat: -37.7705, lng: 144.9715 },
    { business: 'simétrie', emoji: '🧵', place: 'Brunswick', region: 'mornington', lat: -37.7667, lng: 144.9600 },
    { business: 'Suigeneris Atelier', emoji: '🧵', place: 'Mulgrave', region: 'mornington', lat: -37.9265, lng: 145.1660 },
    { business: 'Peachy Keen Ceramics', emoji: '🏺', place: 'Mount Eliza', region: 'mornington', lat: -38.1890, lng: 145.0920 },
    { business: 'East Coast Kayaking', emoji: '🛶', place: 'Melbourne city, on the Yarra', region: 'mornington', lat: -37.8210, lng: 144.9640, only: ['city-day', 'city-twilight'] },
    { business: 'East Coast Kayaking', emoji: '🛶', place: 'Sandringham', region: 'mornington', lat: -37.9510, lng: 145.0010, only: ['bayside', 'point-nepean', 'phillip-island'] },
    { business: 'Salty Cowboy', emoji: '🐴', place: 'Bali', region: 'bali', lat: -8.6500, lng: 115.2167 }
  ];

  // Activities per pin, from the cards in the results grid (each card is there once).
  var cards = [].slice.call(document.querySelectorAll('#browseGrid .card[data-business]'));
  var match = function () { return true; }, region = '';
  function activities(pin) {
    return cards.filter(function (c) {
      if (c.getAttribute('data-business') !== pin.business) return false;
      if (pin.only) {
        var x = (c.getAttribute('href') || '').match(/[?&]x=([a-z0-9-]+)/);
        if (!x || pin.only.indexOf(x[1]) < 0) return false;
      }
      return match(c);
    });
  }

  function pinIcon(active, emoji) {
    return L.divIcon({
      className: 'th-pin' + (active ? ' is-active' : ''),
      html: '<span class="th-pin__in"><svg viewBox="0 0 28 36" width="34" height="44" aria-hidden="true"><path d="M14 35s12-12.3 12-21A12 12 0 0 0 2 14c0 8.7 12 21 12 21z" fill="currentColor"/><circle cx="14" cy="14" r="9" fill="#f3f2ee"/></svg>' +
        (emoji ? '<span class="th-pin__emoji" aria-hidden="true">' + emoji + '</span>' : '') + '</span>',
      iconSize: [34, 44],
      iconAnchor: [17, 43],
      popupAnchor: [0, -37]
    });
  }

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  // One activity at a time: photo, title and place as one link, then the price and a
  // "Book now" button to the same page, with arrows and "1 / 2" when the business has more. Built when opened, so prices filled in by the
  // currency switcher are current. Used for the desktop popup and the phone sheet.
  function slides(pin) {
    var list = activities(pin), i = 0;
    var box = el('div', 'pop'), card = el('a', 'pop-card');
    var media = el('div', 'pop-media'), body = el('div', 'pop-body');
    var title = el('p', 'pop-title'), meta = el('p', 'pop-meta', pin.place), price = el('p', 'card__price pop-amount');
    var foot = el('div', 'pop-foot'), book = el('a', 'btn--primary pop-book', 'Book now');
    card.appendChild(media); card.appendChild(body);
    body.appendChild(title); body.appendChild(meta);
    foot.appendChild(price); foot.appendChild(book);
    box.appendChild(card); box.appendChild(foot);

    var count;
    function go(n) {
      i = (n + list.length) % list.length;
      var c = list[i], src = c.querySelector('.card__media picture') || c.querySelector('.card__media img');
      card.href = book.href = c.getAttribute('href');
      book.setAttribute('aria-label', 'Book now, ' + (c.getAttribute('data-title') || ''));
      card.setAttribute('aria-label', (c.getAttribute('data-title') || '') + ', ' + pin.business + ', ' + pin.place);
      title.textContent = c.getAttribute('data-title') || '';
      var p = c.querySelector('.card__price');
      price.textContent = p ? p.textContent.trim() : '';
      media.textContent = '';
      if (src) {
        var img = src.cloneNode(true), tag = img.tagName === 'IMG' ? img : img.querySelector('img');
        if (tag) { tag.removeAttribute('loading'); tag.removeAttribute('style'); }
        if (img.tagName !== 'IMG') img.removeAttribute('style');
        media.appendChild(img);
      }
      if (count) count.textContent = (i + 1) + ' / ' + list.length;
    }
    if (list.length > 1) {
      var nav = el('div', 'pop-nav');
      var prev = el('button', 'pop-arrow', '\u2039'), next = el('button', 'pop-arrow', '\u203A');
      prev.type = next.type = 'button';
      prev.setAttribute('aria-label', 'Previous experience');
      next.setAttribute('aria-label', 'Next experience');
      count = el('span', 'pop-count');
      count.setAttribute('aria-live', 'polite');
      prev.addEventListener('click', function () { go(i - 1); });
      next.addEventListener('click', function () { go(i + 1); });
      nav.appendChild(prev); nav.appendChild(count); nav.appendChild(next);
      box.appendChild(nav);
    }
    go(0);
    return box;
  }

  var map = null, markers = [], active = null, pop, sheet, sheetBody, sheetClose;
  var useSheet = window.matchMedia('(max-width:820px)');

  function setActive(m) {
    if (active && active !== m) { active.setIcon(pinIcon(false, active.options.emoji)); active.setZIndexOffset(0); }
    active = m;
    if (m) { m.setIcon(pinIcon(true, m.options.emoji)); m.setZIndexOffset(1000); }
  }
  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    setActive(null);
  }
  function openSheet(m, p) {
    setActive(m);
    sheetBody.textContent = '';
    sheetBody.appendChild(slides(p));
    sheet.setAttribute('aria-label', p.business);
    sheet.hidden = false;
    // The map sits in the fixed map panel: keep the pin in the part above the sheet.
    var rect = mapEl.getBoundingClientRect(), pt = map.latLngToContainerPoint(m.getLatLng());
    var to = Math.min(rect.height, sheet.getBoundingClientRect().top - rect.top);
    map.panBy([pt.x - rect.width / 2, pt.y - to / 2]);
    sheetClose.focus({ preventScroll: true });
  }
  function close() { if (map) map.closePopup(); closeSheet(); }

  function build() {
    // The map has its own panel now, so dragging and wheel zoom are on everywhere.
    map = L.map(mapEl, { scrollWheelZoom: true, zoomControl: false, zoomSnap: 0.25, wheelPxPerZoomLevel: 90 });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    // One host (OpenStreetMap's advice since its servers moved to HTTP/2): one connection,
    // made early by the preconnect in the page head, instead of three.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Phones and tablets: a sheet along the bottom of the screen instead of a popup, so
    // the other pins stay in view.
    sheet = el('div', 'map-sheet'); sheetBody = el('div'); sheetClose = el('button', 'map-sheet__close');
    sheet.setAttribute('role', 'dialog');
    sheet.hidden = true;
    sheetClose.type = 'button';
    sheetClose.setAttribute('aria-label', 'Close');
    sheetClose.appendChild(el('span', '', '\u00D7'));
    sheet.appendChild(sheetBody); sheet.appendChild(sheetClose);
    document.body.appendChild(sheet);
    sheetClose.addEventListener('click', closeSheet);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });
    map.on('click', closeSheet);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { if (!es[0].isIntersecting) closeSheet(); }).observe(mapEl);
    }

    // Desktop: one popup, about 300px wide, opened on the clicked pin.
    pop = L.popup({ className: 'th-pop', closeButton: true, minWidth: 300, maxWidth: 300, offset: [0, -23], autoPanPadding: [20, 20] });
    map.on('popupclose', function (e) { if (e.popup === pop) setActive(null); });

    markers = pins.map(function (p) {
      var m = L.marker([p.lat, p.lng], { icon: pinIcon(false, p.emoji), emoji: p.emoji, title: p.business + ', ' + p.place, keyboard: true });
      m.on('click', function () {
        if (useSheet.matches) { map.closePopup(); openSheet(m, p); return; }
        closeSheet();
        pop.setLatLng(m.getLatLng()).setContent(slides(p));
        map.openPopup(pop);
        setActive(m);
      });
      return { pin: p, marker: m };
    });

    window.addEventListener('resize', function () { map.invalidateSize(); });
  }

  // Only pins with a matching card. The view fits the chosen location's pins; with All
  // locations it fits Victoria (where most businesses are), or Bali when nothing in
  // Victoria matches.
  function draw() {
    if (!map || !mapEl.offsetWidth) return;
    close();
    var shown = [];
    markers.forEach(function (o) {
      var on = activities(o.pin).length > 0;
      if (on) { o.marker.addTo(map); shown.push(o.pin); } else o.marker.remove();
    });
    var r = region || (shown.some(function (p) { return p.region === 'mornington'; }) ? 'mornington' : 'bali');
    var points = shown.filter(function (p) { return p.region === r; }).map(function (p) { return [p.lat, p.lng]; });
    if (points.length === 1) map.setView(points[0], 10);
    else if (points.length) map.fitBounds(L.latLngBounds(points), { padding: [30, 30], maxZoom: 10 });
    else map.setView(r === 'bali' ? [-8.65, 115.2167] : [-37.8, 145.0], 8);
  }

  return {
    // Called by the browse filters: which cards match, and the chosen location.
    filter: function (fn, r) { match = fn; region = r || ''; draw(); },
    // Called when the map panel opens, and again once it has slid in or changed size.
    open: function () {
      if (!map) build();
      map.invalidateSize();
      draw();
    },
    resize: function () { if (map) { map.invalidateSize(); draw(); } },
    close: close
  };
})();

// Mobile menu (640px and under): the same full-screen panel on every page, built here
// so generated pages get it too. Two groups styled alike, Explore and For businesses,
// then the currency picker. It goes inside #siteNav, which the hamburger opens as the
// overlay; the desktop links in #siteNav are hidden while it's open (styles.css).
// Runs before the currency code binds its pickers on DOMContentLoaded.
(function () {
  var nav = document.getElementById('siteNav');
  if (!nav || nav.querySelector('.menu-panel')) return;
  var groups = [
    ['Explore', [['Browse experiences', '/#browse'], ['FAQ', '/#faq']]],
    ['For businesses', [['List your business', '/for-business/'], ['Talk to us', '/for-business/#interested']]]
  ];
  var here = location.pathname.replace(/index\.html$/, '');
  var panel = document.createElement('div');
  panel.className = 'menu-panel';
  groups.forEach(function (g, n) {
    var box = document.createElement('div'), label = document.createElement('p'), ul = document.createElement('ul');
    box.className = 'menu-group';
    label.className = 'menu-group__label';
    label.id = 'menuGroup' + n;
    label.textContent = g[0];
    ul.setAttribute('aria-labelledby', label.id);
    g[1].forEach(function (l) {
      var li = document.createElement('li'), a = document.createElement('a');
      a.href = l[1];
      a.textContent = l[0];
      if (l[1].indexOf('#') < 0 && l[1] === here) a.setAttribute('aria-current', 'page');
      li.appendChild(a);
      ul.appendChild(li);
    });
    box.appendChild(label);
    box.appendChild(ul);
    panel.appendChild(box);
  });
  var cur = document.createElement('div');
  cur.className = 'menu-currency';
  cur.innerHTML = '<label class="menu-group__label" for="currencySelectNav">Currency</label>' +
    '<span class="select-wrap"><select id="currencySelectNav" class="currency-select">' +
    '<option value="AUD">AUD</option><option value="USD">USD</option><option value="IDR">IDR</option></select></span>';
  panel.appendChild(cur);
  nav.appendChild(panel);
})();

// Sort by, for the homepage results: one list, so the options are easy to change (a
// proposal for Ro to confirm). No "Soonest available": no experience has dates yet.
var SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: '$ (low to high)' },
  { value: 'price-desc', label: '$ (high to low)' }
];
(function () {
  var select = document.getElementById('sortSelect');
  if (!select) return;
  select.textContent = '';
  SORT_OPTIONS.forEach(function (o) { select.add(new Option(o.label, o.value)); });
})();

// One dropdown open at a time across the page: each one announces itself on opening with
// "rd:dropdown-open" and closes when another does. "rd:dropdowns-close" closes them all
// (the map opening, the filter nav un-sticking).
function closeDropdowns() { document.dispatchEvent(new CustomEvent('rd:dropdowns-close')); }

// Site-styled dropdowns: the Experiences filters (Where, How long, Sort by), the hero
// search and the header's currency picker. The real
// <select> stays in the page, hidden, and still fires "change", so the filters and the
// URL work as before; a button and a listbox in the site's style sit on top. Setting
// select.value from code updates the button too. Phones (coarse pointers) keep the
// built-in picker, which is easier to use there.
(function () {
  if (!window.matchMedia || !window.matchMedia('(pointer:fine)').matches) return;
  var selects = [].slice.call(document.querySelectorAll('#browse select.location-select, #sortSelect, #top select.location-select, .site-header select.currency-select'));
  var desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');

  selects.forEach(function (select, n) {
    var wrap = document.createElement('div'), btn = document.createElement('button'), list = document.createElement('ul');
    var label = document.querySelector('label[for="' + select.id + '"]');
    var id = select.id + 'Menu', active = -1;
    wrap.className = 'th-select';
    btn.type = 'button';
    btn.id = select.id + 'Button';
    btn.className = select.className + ' th-select__button';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    list.className = 'th-select__list';
    list.id = id;
    list.setAttribute('role', 'listbox');
    list.tabIndex = -1;
    list.hidden = true;
    if (label) {
      if (!label.id) label.id = select.id + 'Label';
      label.htmlFor = btn.id;
      btn.setAttribute('aria-labelledby', label.id + ' ' + btn.id);
      list.setAttribute('aria-labelledby', label.id);
    }
    var opts = [].map.call(select.options, function (o, i) {
      var li = document.createElement('li');
      li.id = id + '-' + i;
      li.setAttribute('role', 'option');
      li.textContent = o.textContent;
      li.addEventListener('mousedown', function (e) { e.preventDefault(); });
      li.addEventListener('click', function () { choose(i); });
      li.addEventListener('mousemove', function () { highlight(i); });
      list.appendChild(li);
      return li;
    });
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    wrap.appendChild(btn);
    wrap.appendChild(list);
    select.classList.add('th-select__native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    function sync() {
      var i = select.selectedIndex;
      btn.textContent = select.options[i] ? select.options[i].textContent : '';
      opts.forEach(function (li, k) { li.setAttribute('aria-selected', k === i ? 'true' : 'false'); });
    }
    // Keep the button in step when the filters set the value from code.
    Object.defineProperty(select, 'value', {
      get: function () { return desc.get.call(select); },
      set: function (v) { desc.set.call(select, v); sync(); }
    });
    select.addEventListener('change', sync);

    // Scrolls only the list, never the page.
    function highlight(i) {
      active = i;
      opts.forEach(function (li, k) { li.classList.toggle('is-active', k === i); });
      if (i < 0) return;
      var li = opts[i];
      list.setAttribute('aria-activedescendant', li.id);
      if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop;
      else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight;
    }
    // Opens under the button, or above it if it would cross the bottom of the hero (or
    // of the screen elsewhere).
    function open() {
      document.dispatchEvent(new CustomEvent('rd:dropdown-open', { detail: list }));
      list.classList.remove('is-up');
      list.hidden = false;
      var hero = wrap.closest('#top'), r = list.getBoundingClientRect();
      var limit = hero ? hero.getBoundingClientRect().bottom : window.innerHeight;
      if (r.bottom > limit && btn.getBoundingClientRect().top - r.height - 6 > 0) list.classList.add('is-up');
      btn.setAttribute('aria-expanded', 'true');
      highlight(select.selectedIndex);
      list.focus({ preventScroll: true });
    }
    function close(refocus) {
      if (list.hidden) return;
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (refocus) btn.focus({ preventScroll: true });
    }
    document.addEventListener('rd:dropdown-open', function (e) { if (e.detail !== list) close(false); });
    document.addEventListener('rd:dropdowns-close', function () { close(false); });
    function choose(i) {
      var changed = i !== select.selectedIndex;
      desc.set.call(select, select.options[i].value);
      sync();
      close(true);
      if (changed) select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    btn.addEventListener('click', function () { if (list.hidden) open(); else close(true); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
    });
    var typed = '', typedAt = 0;
    list.addEventListener('keydown', function (e) {
      var last = opts.length - 1;
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight(Math.min(last, active + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(0, active - 1)); }
      else if (e.key === 'Home') { e.preventDefault(); highlight(0); }
      else if (e.key === 'End') { e.preventDefault(); highlight(last); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (active >= 0) choose(active); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === 'Tab') { close(false); }
      else if (e.key.length === 1) {
        typed = (Date.now() - typedAt > 600 ? '' : typed) + e.key.toLowerCase(); typedAt = Date.now();
        for (var k = 0; k < opts.length; k++) if (opts[k].textContent.toLowerCase().indexOf(typed) === 0) { highlight(k); break; }
      }
    });
    list.addEventListener('blur', function () { setTimeout(function () { if (!wrap.contains(document.activeElement)) close(false); }, 0); });
    document.addEventListener('mousedown', function (e) { if (!wrap.contains(e.target)) close(false); });
    sync();
  });
})();

// Touch screens keep the built-in picker for the Experiences filters, but a select needs
// 16px text or iOS zooms in when it opens. So the select, at 16px, is laid invisibly over
// a copy of its value set at the pills' size; tapping still opens the native picker.
(function () {
  if (!window.matchMedia || window.matchMedia('(pointer:fine)').matches) return;
  var desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  [].forEach.call(document.querySelectorAll('#browse select.location-select, #sortSelect'), function (select) {
    var wrap = document.createElement('span'), value = document.createElement('span');
    wrap.className = 'th-native';
    value.className = select.className + ' th-native__value';
    value.setAttribute('aria-hidden', 'true');
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(value);
    wrap.appendChild(select);
    select.classList.add('th-native__select');
    function sync() { var o = select.options[select.selectedIndex]; value.textContent = o ? o.textContent : ''; }
    // Keep the copy in step when the filters set the value from code.
    Object.defineProperty(select, 'value', {
      get: function () { return desc.get.call(select); },
      set: function (v) { desc.set.call(select, v); sync(); }
    });
    select.addEventListener('change', sync);
    sync();
  });
})();

// "View on map" panel (#mapPanel) around the explore map. From 1024px it docks on the
// right half, from under the header to the bottom of the screen, and the filter nav and
// list reflow into the left half (a region, no focus trap);
// from 768px it slides over the list with a scrim; on phones it's a full-screen sheet
// with the page locked behind it (both modal, focus kept inside). Slides in over 250ms,
// or just appears with reduced motion. Esc, the close button and the scrim close it.
// The browse code drives show/hide (and the map=1 address); it sets onRequestClose.
var mapPanel = (function () {
  var panel = document.getElementById('mapPanel'), toggle = document.getElementById('mapToggle');
  if (!panel || !toggle) return null;
  var closeBtn = document.getElementById('mapClose'), scrim = document.getElementById('mapScrim');
  var docked = window.matchMedia('(min-width:1024px)');
  var mobile = window.matchMedia('(max-width:767px)');
  var open = false, timer, api;

  function durMs() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur')) || 0; }
  function headerH() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0; }
  function alignResults() {
    var nav = document.getElementById('filterNav');
    var head = [].filter.call(document.querySelectorAll('#browseResults h2'), function (h) { return h.offsetParent; })[0];
    if (!nav || !head || !nav.classList.contains('is-stuck')) return;
    var gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s-5')) || 24;
    var delta = head.getBoundingClientRect().top - (headerH() + nav.offsetHeight + gap);
    if (delta > 1) window.scrollBy({ top: delta, behavior: 'instant' });
  }
  function setMode() {
    var modal = !docked.matches;
    panel.setAttribute('role', modal ? 'dialog' : 'region');
    if (modal) panel.setAttribute('aria-modal', 'true'); else panel.removeAttribute('aria-modal');
    if (scrim) scrim.hidden = !(open && modal && !mobile.matches);
    document.body.classList.toggle('map-docked', open && docked.matches);
    document.documentElement.classList.toggle('is-map-locked', open && mobile.matches);
  }
  function refit() { if (exploreMap) exploreMap.resize(); }

  function show(focus) {
    if (open) return;
    open = true;
    clearTimeout(timer);
    closeDropdowns();
    // Beside or over the list: bring the results up so the filter nav sits under the header.
    var slot = document.getElementById('filterSlot');
    if (slot && !mobile.matches) {
      var gap = slot.getBoundingClientRect().top - headerH();
      if (gap > 0) window.scrollBy({ top: gap + 1, behavior: 'instant' });
    }
    panel.classList.remove('is-warming');
    panel.hidden = false;
    setMode();
    // Once the nav has stuck (next frames), close the space its placeholder leaves above
    // the list, so the first heading sits just under the bar. Never scrolls back up.
    if (!mobile.matches) requestAnimationFrame(function () { requestAnimationFrame(alignResults); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { panel.classList.add('is-open'); }); });
    toggle.setAttribute('aria-expanded', 'true');
    if (exploreMap) exploreMap.open();
    timer = setTimeout(refit, durMs() + 30);
    if (focus && closeBtn) closeBtn.focus({ preventScroll: true });
  }
  function hide(focus) {
    if (!open) return;
    open = false;
    panel.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    setMode();
    if (exploreMap) exploreMap.close();
    clearTimeout(timer);
    timer = setTimeout(function () { if (!open) panel.hidden = true; }, durMs() + 30);
    if (focus) toggle.focus({ preventScroll: true });
  }
  function requestClose() { if (api.onRequestClose) api.onRequestClose(); else hide(true); }

  // Head start: when someone points at, focuses or touches "View on map", the panel is
  // laid out off screen (unseen, out of the accessibility tree) and the map built there,
  // so the tiles are already downloading by the time the click lands.
  function warm() {
    if (open || !exploreMap || !panel.hidden) return;
    clearTimeout(timer);
    panel.classList.add('is-warming');
    panel.hidden = false;
    exploreMap.open();
    timer = setTimeout(function () { if (!open) { panel.hidden = true; panel.classList.remove('is-warming'); } }, 10000);
  }
  ['pointerenter', 'focus', 'touchstart'].forEach(function (type) { toggle.addEventListener(type, warm, { passive: true }); });

  if (closeBtn) closeBtn.addEventListener('click', requestClose);
  if (scrim) scrim.addEventListener('click', requestClose);
  // Docked (1024px and up): a click anywhere outside the panel closes it, except in the
  // filter nav, where changing filters updates the map. The modal sizes use the scrim.
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!open || !docked.matches || !t.isConnected || panel.contains(t) || toggle.contains(t) || t.closest('#filterNav')) return;
    requestClose();
  });
  document.addEventListener('keydown', function (e) {
    if (!open) return;
    // A pin's sheet closes first (its own Esc handler).
    if (e.key === 'Escape' && !document.querySelector('.map-sheet:not([hidden])')) { requestClose(); return; }
    // Modal modes keep Tab inside the panel.
    if (e.key !== 'Tab' || docked.matches) return;
    var f = [].filter.call(panel.querySelectorAll('a[href],button,input,select,[tabindex]:not([tabindex="-1"])'), function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  });
  function onChange() { if (!open) return; setMode(); refit(); }
  [docked, mobile].forEach(function (mq) { if (mq.addEventListener) mq.addEventListener('change', onChange); });
  var resizeTimer;
  window.addEventListener('resize', function () { if (!open) return; clearTimeout(resizeTimer); resizeTimer = setTimeout(refit, 100); });
  document.addEventListener('filternav:change', function () { if (open) setTimeout(refit, 0); });

  api = { show: show, hide: hide, isOpen: function () { return open; }, onRequestClose: null };
  return api;
})();

// Homepage browse (#browse): the filter nav (What and Situation chips, horse sub-chips,
// Where, How long and Sort by), the two hand-picked rails and "All experiences". Filters
// combine with AND logic on the cards in #browseGrid, never navigate, and live in the URL
// (?cat=&sub=&who=&location=&duration=&sort=&map=1), so a refresh or the back button
// brings them back. With any filter on, the rails hide and only matching cards show.
// The hero search sets the same filters. The map (exploreMap, in the "View on map"
// panel) follows them.
(function () {
  var grid = document.getElementById('browseGrid');
  if (!grid) return;
  var $ = function (id) { return document.getElementById(id); };
  var rails = $('browseRails');
  var chipRow = $('chipRow'), horseSub = $('horseSub');
  var locationSelect = $('locationSelect'), durationSelect = $('durationSelect'), sortSelect = $('sortSelect');
  var countEl = $('browseCount'), statusEl = $('browseStatus'), emptyEl = $('browseEmpty'), clearBtn = $('clearFilters');
  var capBtn = document.querySelector('.card-cap-more[aria-controls="browseGrid"]');
  var heroForm = $('heroSearch'), heroWhat = $('heroWhat'), heroWhere = $('heroWhere'), heroWho = $('heroWho');

  var cards = [].slice.call(grid.querySelectorAll('.card'));
  cards.forEach(function (c, i) { c._order = i; });
  var catChips = chipRow ? [].slice.call(chipRow.querySelectorAll('.cat-chip')) : [];
  var horseChip = catChips.filter(function (c) { return c.getAttribute('data-cat') === 'horse'; })[0];
  var subChips = horseSub ? [].slice.call(horseSub.querySelectorAll('.sub-chip')) : [];
  var whoChips = [].slice.call(document.querySelectorAll('#situationRow .who-chip'));

  // Hide any What chip with no live listings yet, worked out from the cards, so a chip
  // appears on its own once the first business in that category is listed.
  (function () {
    var live = {};
    cards.forEach(function (card) {
      (card.getAttribute('data-cat') || '').split(/\s+/).forEach(function (c) { if (c) live[c] = true; });
    });
    catChips.forEach(function (chip) {
      var cat = chip.getAttribute('data-cat');
      if (cat && !live[cat]) chip.hidden = true;
    });
  })();

  // state.cat: the selected What chips (OR'd together); empty means Anything.
  var state = { cat: [], sub: '', who: '', region: '', duration: '', sort: 'recommended', map: false };
  var LOCATIONS = { victoria: 'mornington', bali: 'bali' };
  var DURATIONS = ['1h', '1-5h', 'full-day', 'multi-day'];
  var WHO = ['solo', 'duo', 'group'];
  var SORTS = (window.SORT_OPTIONS || []).map(function (o) { return o.value; });

  function readURL() {
    var params = new URLSearchParams(window.location.search);
    var cat = params.get('cat') || '';
    state.cat = cat ? cat.split(',').filter(Boolean) : [];
    state.sub = params.get('sub') || '';
    state.who = WHO.indexOf(params.get('who')) >= 0 ? params.get('who') : '';
    state.region = LOCATIONS[params.get('location') || ''] || '';
    state.duration = DURATIONS.indexOf(params.get('duration')) >= 0 ? params.get('duration') : '';
    state.sort = SORTS.indexOf(params.get('sort')) > 0 ? params.get('sort') : 'recommended';
    // view=map is the old Map tab's address; it opens the map panel now.
    state.map = params.get('map') === '1' || params.get('view') === 'map';
  }

  // push: a new history entry (location, duration, map), so the back button steps back
  // through them. Chip and sort changes replace the current entry.
  function writeURL(push, mark) {
    var params = new URLSearchParams(window.location.search);
    function put(k, v) { if (v) params.set(k, v); else params.delete(k); }
    put('cat', state.cat.join(','));
    put('sub', state.sub);
    put('who', state.who);
    put('location', Object.keys(LOCATIONS).filter(function (k) { return LOCATIONS[k] === state.region; })[0]);
    put('duration', state.duration);
    put('sort', state.sort === 'recommended' ? '' : state.sort);
    put('map', state.map ? '1' : '');
    params.delete('view');
    params.delete('region');
    var qs = params.toString();
    var url = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    if (url === window.location.pathname + window.location.search + window.location.hash) return;
    if (push) history.pushState(mark || null, '', url); else history.replaceState(history.state, '', url);
  }

  // Buckets: 60 minutes or less; 61 to 300; over 300 on a single day; two days or more.
  function durationBucket(card) {
    var days = parseInt(card.getAttribute('data-days'), 10) || 1;
    var mins = parseInt(card.getAttribute('data-duration'), 10);
    if (days >= 2) return 'multi-day';
    if (!mins) return '';
    if (mins <= 60) return '1h';
    if (mins <= 300) return '1-5h';
    return 'full-day';
  }
  function has(card, attr, v) { return (card.getAttribute(attr) || '').split(/\s+/).indexOf(v) !== -1; }

  function cardMatches(card, opts) {
    opts = opts || {};
    if (!opts.ignoreCat && state.cat.length && !state.cat.some(function (c) { return has(card, 'data-cat', c); })) return false;
    if (!opts.ignoreSub && state.sub && has(card, 'data-cat', 'horse') && card.getAttribute('data-type') !== state.sub) return false;
    if (state.who && !has(card, 'data-situation', state.who)) return false;
    if (state.region && card.getAttribute('data-region') !== state.region) return false;
    if (state.duration && durationBucket(card) !== state.duration) return false;
    return true;
  }
  function hasActiveFilters() {
    return !!(state.cat.length || state.sub || state.who || state.region || state.duration);
  }

  // Sub-chip counts: the horse cards left by the other filters.
  function updateSubCounts() {
    var horse = cards.filter(function (c) { return has(c, 'data-cat', 'horse') && cardMatches(c, { ignoreCat: true, ignoreSub: true }); });
    subChips.forEach(function (chip) {
      var type = chip.getAttribute('data-type');
      var n = type ? horse.filter(function (c) { return c.getAttribute('data-type') === type; }).length : horse.length;
      var base = chip.getAttribute('data-label') || chip.textContent.replace(/\s*\(\d+\)\s*$/, '');
      chip.setAttribute('data-label', base);
      chip.textContent = base + ' (' + n + ')';
    });
  }

  function countLabel(n) {
    var label = n === 1 ? '1 experience' : n + ' experiences';
    if (state.region === 'bali') label += ' in Bali';
    else if (state.region === 'mornington') label += ' in Victoria, Australia';
    return label;
  }

  var shown = cards.length;
  function render() {
    var active = hasActiveFilters();
    if (rails) rails.hidden = active;
    shown = 0;
    cards.forEach(function (card) {
      var match = cardMatches(card);
      card.hidden = !match;
      if (match) shown++;
    });
    if (countEl) countEl.textContent = countLabel(shown);
    if (emptyEl) emptyEl.hidden = !(active && shown === 0);
    // Phones show the first 12 of the full list, then "See all"; never while filtering.
    if (active) grid.removeAttribute('data-mobile-cap'); else grid.setAttribute('data-mobile-cap', '');
    if (capBtn) capBtn.hidden = active || grid.classList.contains('is-expanded');
    updateSubCounts();
    if (exploreMap) exploreMap.filter(cardMatches, state.region);
  }

  // Sort: re-orders the cards in "All experiences" (the rails keep their own order).
  // Ties keep the recommended order; cards with no price go last.
  function applySort(announce) {
    var dir = state.sort === 'price-asc' ? 1 : state.sort === 'price-desc' ? -1 : 0;
    var price = function (c) { var v = parseFloat(c.getAttribute('data-sort-aud')); return isNaN(v) ? null : v; };
    cards.slice().sort(function (a, b) {
      if (dir) {
        var pa = price(a), pb = price(b);
        if (pa === null && pb !== null) return 1;
        if (pb === null && pa !== null) return -1;
        if (pa !== pb && pa !== null) return dir * (pa - pb);
      }
      return a._order - b._order;
    }).forEach(function (c) { grid.appendChild(c); });
    if (announce && statusEl) {
      var o = (window.SORT_OPTIONS || []).filter(function (x) { return x.value === state.sort; })[0];
      var said = state.sort === 'price-asc' ? 'Sorted by price, low to high' : state.sort === 'price-desc' ? 'Sorted by price, high to low' : 'Sorted by ' + (o ? o.label : 'recommended').toLowerCase();
      statusEl.textContent = said + '. ' + countLabel(shown) + '.';
    }
  }

  // Situation helper: one line under the chips. With a mouse or trackpad, hovering or
  // focusing a chip shows its line, otherwise the chosen chip's; on touch it changes on
  // select. The line is aria-hidden; each chip has its own description (aria-describedby).
  var helpEl = $('situationHelp'), helpTimer, hoverWho = '';
  var canHover = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  function helpFor(who) {
    var chip = whoChips.filter(function (c) { return c.getAttribute('data-who') === who; })[0];
    return chip ? chip.getAttribute('data-help') || '' : '';
  }
  // Fades out, swaps the text, fades back in; instant with reduced motion (--dur is 0).
  function syncHelp() {
    var text = helpFor(hoverWho || state.who);
    if (!helpEl || helpEl.getAttribute('data-text') === text) return;
    helpEl.setAttribute('data-text', text);
    var half = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur')) || 0) / 2;
    clearTimeout(helpTimer);
    if (!half) { helpEl.textContent = text; placeHelp(); return; }
    helpEl.classList.add('is-fading');
    helpTimer = setTimeout(function () { helpEl.textContent = text; placeHelp(); helpEl.classList.remove('is-fading'); }, half);
  }
  // Centred under the chips, but nudged back inside the container when the line is wider
  // than the chips and they sit near an edge (phones, narrow windows).
  function placeHelp() {
    if (!helpEl) return;
    helpEl.style.transform = '';
    var box = helpEl.closest('.container');
    if (!box || !helpEl.textContent) return;
    var r = helpEl.getBoundingClientRect(), b = box.getBoundingClientRect(), cs = getComputedStyle(box);
    var left = b.left + parseFloat(cs.paddingLeft), right = b.right - parseFloat(cs.paddingRight), dx = 0;
    if (r.left < left) dx = left - r.left;
    else if (r.right > right) dx = right - r.right;
    if (dx) helpEl.style.transform = 'translateX(calc(-50% + ' + Math.round(dx) + 'px))';
  }
  window.addEventListener('resize', placeHelp);
  if (canHover) whoChips.forEach(function (chip) {
    function on() { hoverWho = chip.getAttribute('data-who'); syncHelp(); }
    function off() { hoverWho = chip === document.activeElement ? hoverWho : ''; syncHelp(); }
    chip.addEventListener('mouseenter', on);
    chip.addEventListener('focus', on);
    chip.addEventListener('mouseleave', off);
    chip.addEventListener('blur', function () { hoverWho = ''; syncHelp(); });
  });

  // Stuck filter nav (768px and up): What, Situation, Where and How long become
  // dropdowns in one row, built here with the same options as the expanded bar and
  // driven by the same state. What stays multi-select (checkboxes); the others close on
  // a choice. Esc closes and returns focus to the button; Tab or a click outside closes.
  function makeDropdown(box, key, name, options, multi, selected, pick) {
    var wrap = document.createElement('div'), btn = document.createElement('button'), list = document.createElement('ul');
    var id = 'fnDd' + key, active = -1;
    wrap.className = 'dd';
    btn.type = 'button';
    btn.className = 'dd__btn';
    btn.id = id + 'Button';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', id);
    var nameEl = document.createElement('span'), valueEl = document.createElement('span');
    nameEl.className = 'dd__label';
    nameEl.textContent = name + ':';
    valueEl.className = 'dd__value';
    btn.appendChild(nameEl);
    btn.appendChild(document.createTextNode(' '));
    btn.appendChild(valueEl);
    list.className = 'dd__list';
    list.id = id;
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', name);
    if (multi) list.setAttribute('aria-multiselectable', 'true');
    list.tabIndex = -1;
    list.hidden = true;
    var items = options.map(function (o, i) {
      var li = document.createElement('li'), mark = document.createElement('span'), text = document.createElement('span'), main = document.createElement('span');
      li.id = id + '-' + i;
      li.setAttribute('role', 'option');
      mark.className = multi ? 'dd__check' : 'dd__tick';
      mark.setAttribute('aria-hidden', 'true');
      text.className = 'dd__text';
      main.textContent = o.label;
      text.appendChild(main);
      if (o.sub) { var sub = document.createElement('span'); sub.className = 'dd__sub'; sub.textContent = o.sub; text.appendChild(sub); }
      li.appendChild(mark);
      li.appendChild(text);
      li.addEventListener('mousedown', function (e) { e.preventDefault(); });
      li.addEventListener('click', function () { choose(i); });
      li.addEventListener('mousemove', function () { highlight(i); });
      list.appendChild(li);
      return li;
    });
    wrap.appendChild(btn);
    wrap.appendChild(list);
    box.appendChild(wrap);

    function sync() {
      var sel = selected();
      var labels = options.filter(function (o) { return sel.indexOf(o.value) !== -1; }).map(function (o) { return o.label; });
      items.forEach(function (li, k) { li.setAttribute('aria-selected', sel.indexOf(options[k].value) !== -1 ? 'true' : 'false'); });
      valueEl.textContent = labels.length ? labels[0] + (labels.length > 1 ? ' +' + (labels.length - 1) : '') : options[0].label;
    }
    function highlight(i) {
      active = i;
      items.forEach(function (li, k) { li.classList.toggle('is-active', k === i); });
      if (i < 0) return;
      var li = items[i];
      list.setAttribute('aria-activedescendant', li.id);
      if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop;
      else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight;
    }
    // Left aligned under the button; right aligned if it would pass the container's edge.
    function open() {
      document.dispatchEvent(new CustomEvent('rd:dropdown-open', { detail: list }));
      list.classList.remove('is-right');
      list.hidden = false;
      var c = wrap.closest('.container');
      var edge = c ? c.getBoundingClientRect().right - (parseFloat(getComputedStyle(c).paddingRight) || 0) : window.innerWidth;
      if (list.getBoundingClientRect().right > edge) list.classList.add('is-right');
      btn.setAttribute('aria-expanded', 'true');
      var sel = selected(), first = 0;
      for (var k = 0; k < options.length; k++) if (sel.indexOf(options[k].value) !== -1) { first = k; break; }
      highlight(first);
      list.focus({ preventScroll: true });
    }
    function close(refocus) {
      if (list.hidden) return;
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (refocus) btn.focus({ preventScroll: true });
    }
    function choose(i) {
      pick(options[i].value);
      if (!multi) close(true);
    }
    btn.addEventListener('click', function () { if (list.hidden) open(); else close(true); });
    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
    });
    list.addEventListener('keydown', function (e) {
      var last = items.length - 1;
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight(Math.min(last, active + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(0, active - 1)); }
      else if (e.key === 'Home') { e.preventDefault(); highlight(0); }
      else if (e.key === 'End') { e.preventDefault(); highlight(last); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (active >= 0) choose(active); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
      else if (e.key === 'Tab') { close(false); }
    });
    list.addEventListener('blur', function () { setTimeout(function () { if (!wrap.contains(document.activeElement)) close(false); }, 0); });
    document.addEventListener('mousedown', function (e) { if (!wrap.contains(e.target)) close(false); });
    document.addEventListener('rd:dropdown-open', function (e) { if (e.detail !== list) close(false); });
    document.addEventListener('rd:dropdowns-close', function () { close(false); });
    return { sync: sync };
  }
  var compact = [];
  (function () {
    var row = document.querySelector('#filterNav .fn-row--bottom');
    if (!row) return;
    var box = document.createElement('div');
    box.className = 'fn-compact';
    row.insertBefore(box, row.querySelector('.fn-where'));
    function fromSelect(sel) { return sel ? [].map.call(sel.options, function (o) { return { value: o.value, label: o.textContent }; }) : []; }
    var what = catChips.filter(function (c) { return !c.hidden; }).map(function (c) { return { value: c.getAttribute('data-cat'), label: c.textContent }; });
    var who = [{ value: '', label: 'Anyone' }].concat(whoChips.map(function (c) { return { value: c.getAttribute('data-who'), label: c.textContent, sub: c.getAttribute('data-help') }; }));
    compact.push(makeDropdown(box, 'What', 'What', what, true,
      function () { return state.cat.length ? state.cat : ['']; },
      function (v) {
        if (!v) state.cat = [];
        else { var i = state.cat.indexOf(v); if (i === -1) state.cat.push(v); else state.cat.splice(i, 1); }
        update();
      }));
    compact.push(makeDropdown(box, 'Who', 'Situation', who, false,
      function () { return [state.who]; }, function (v) { state.who = v; update(); }));
    compact.push(makeDropdown(box, 'Where', 'Where', fromSelect(locationSelect), false,
      function () { return [state.region]; }, function (v) { state.region = v; update(true); }));
    compact.push(makeDropdown(box, 'Long', 'How long', fromSelect(durationSelect), false,
      function () { return [state.duration]; }, function (v) { state.duration = v; update(true); }));
  })();
  // Sticking or un-sticking closes any open list.
  document.addEventListener('filternav:change', closeDropdowns);

  // Everything that shows the state: chips, selects and the hero search.
  function syncControls() {
    catChips.forEach(function (chip) {
      var c = chip.getAttribute('data-cat');
      chip.setAttribute('aria-pressed', c ? state.cat.indexOf(c) !== -1 : state.cat.length === 0);
    });
    var horseOn = state.cat.indexOf('horse') !== -1;
    if (horseSub) horseSub.hidden = !horseOn;
    if (horseChip) horseChip.setAttribute('aria-expanded', horseOn ? 'true' : 'false');
    if (!horseOn) state.sub = '';
    subChips.forEach(function (chip) { chip.setAttribute('aria-pressed', chip.getAttribute('data-type') === state.sub ? 'true' : 'false'); });
    whoChips.forEach(function (chip) { chip.setAttribute('aria-pressed', chip.getAttribute('data-who') === state.who ? 'true' : 'false'); });
    if (locationSelect) locationSelect.value = state.region;
    if (durationSelect) durationSelect.value = state.duration;
    if (sortSelect) sortSelect.value = state.sort;
    if (heroWhat) heroWhat.value = state.cat.length === 1 ? state.cat[0] : '';
    if (heroWhere) heroWhere.value = state.region;
    if (heroWho) heroWho.value = state.who;
    compact.forEach(function (d) { d.sync(); });
    syncHelp();
  }

  function update(push) { syncControls(); writeURL(push); render(); }

  catChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var cat = chip.getAttribute('data-cat');
      if (!cat) state.cat = [];
      else {
        var i = state.cat.indexOf(cat);
        if (i === -1) state.cat.push(cat); else state.cat.splice(i, 1);
      }
      update();
    });
  });
  subChips.forEach(function (chip) {
    chip.addEventListener('click', function () { state.sub = chip.getAttribute('data-type') || ''; update(); });
  });
  // Situation: one at a time; pressing the chosen one again clears it.
  whoChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var who = chip.getAttribute('data-who');
      state.who = state.who === who ? '' : who;
      update();
    });
  });
  if (locationSelect) locationSelect.addEventListener('change', function () { state.region = locationSelect.value; update(true); });
  if (durationSelect) durationSelect.addEventListener('change', function () { state.duration = durationSelect.value; update(true); });
  if (sortSelect) sortSelect.addEventListener('change', function () {
    state.sort = SORTS.indexOf(sortSelect.value) >= 0 ? sortSelect.value : 'recommended';
    writeURL(false);
    applySort(true);
  });
  if (clearBtn) clearBtn.addEventListener('click', function () {
    state.cat = []; state.sub = ''; state.who = ''; state.region = ''; state.duration = '';
    update(true);
  });

  // The filter nav's top, as a page position, so the page can scroll to it.
  var slot = $('filterSlot');
  function headerH() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0; }
  function scrollToFilters() {
    if (!slot) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: slot.getBoundingClientRect().top + window.pageYOffset - headerH(), behavior: reduce ? 'auto' : 'smooth' });
  }

  // Hero search: sets the same filters, writes the URL and scrolls to the results.
  if (heroForm) heroForm.addEventListener('submit', function (e) {
    e.preventDefault();
    state.cat = heroWhat && heroWhat.value ? [heroWhat.value] : [];
    state.region = heroWhere ? heroWhere.value : '';
    state.who = heroWho ? heroWho.value : '';
    update(true);
    scrollToFilters();
    if (countEl) countEl.focus({ preventScroll: true });
  });
  // Phones, filter nav stuck: "Filters" brings the full filters back into view.
  var filtersBtn = $('filtersBtn');
  if (filtersBtn) filtersBtn.addEventListener('click', function () {
    scrollToFilters();
    var first = chipRow && chipRow.querySelector('.chip:not([hidden])');
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 400);
  });

  // "View on map": opens the panel and adds map=1 to the address, so the back button
  // closes it. Closing pops that entry when it's the one we added.
  var mapToggle = $('mapToggle');
  function setMap(on, focus) {
    if (!mapPanel) return;
    if (on) mapPanel.show(focus); else mapPanel.hide(focus);
  }
  if (mapToggle && mapPanel) {
    mapToggle.addEventListener('click', function () {
      if (mapPanel.isOpen()) { closeMap(); return; }
      state.map = true;
      writeURL(true, { rdMap: true });
      setMap(true, true);
    });
    mapPanel.onRequestClose = closeMap;
  }
  function closeMap() {
    state.map = false;
    if (history.state && history.state.rdMap) { history.back(); setMap(false, true); return; }
    writeURL(false);
    setMap(false, true);
  }

  if (countEl) countEl.setAttribute('tabindex', '-1');
  function fromURL() {
    readURL();
    syncControls();
    render();
    applySort(false);
    setMap(state.map, false);
  }
  fromURL();
  window.addEventListener('popstate', fromURL);
})();

// Filter nav: once its top reaches the header it's fixed there in its compact form
// (.is-stuck: labels hidden, tighter padding, a shadow; one row on phones), until the
// results end. The slot keeps the full height, so the page never jumps.
(function () {
  var slot = document.getElementById('filterSlot'), nav = document.getElementById('filterNav');
  var results = document.getElementById('browseResults');
  if (!slot || !nav || !results) return;
  var stuck = false, ticking = false, stuckH = 64;
  var phone = window.matchMedia('(max-width:767px)');
  function headerH() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0; }
  function set(on) {
    if (on === stuck) return;
    if (on) slot.style.height = slot.offsetHeight + 'px';
    nav.classList.toggle('is-stuck', on);
    if (!on) slot.style.height = '';
    else stuckH = nav.offsetHeight;
    stuck = on;
    document.dispatchEvent(new CustomEvent('filternav:change'));
  }
  // On phones the full filters are much taller than the one-row bar, so the bar only
  // sticks once they've scrolled up behind it; sticking at their top left an empty gap.
  function check() {
    ticking = false;
    var h = headerH(), r = slot.getBoundingClientRect();
    var past = phone.matches ? r.bottom < h + stuckH : r.top < h;
    set(past && results.getBoundingClientRect().bottom > h + nav.offsetHeight);
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(check); } }, { passive: true });
  window.addEventListener('resize', function () { set(false); check(); });
  check();
})();

// Card rails: Previous / Next step one screenful of cards, and each hides at its end.
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  [].forEach.call(document.querySelectorAll('.card-rail'), function (rail) {
    var btns = [].slice.call(document.querySelectorAll('.rail-btn[data-rail="' + rail.id + '"]'));
    function stepWidth() {
      var first = rail.children[0], cs = getComputedStyle(rail);
      if (!first) return rail.clientWidth;
      var gap = parseFloat(cs.columnGap) || 0, w = first.getBoundingClientRect().width + gap;
      var view = rail.clientWidth - (parseFloat(cs.paddingRight) || 0);
      return Math.max(1, Math.floor((view + gap) / w)) * w;
    }
    function update() {
      var max = rail.scrollWidth - rail.clientWidth - 2;
      var had = btns.filter(function (b) { return b === document.activeElement; })[0];
      btns.forEach(function (b) { b.hidden = +b.getAttribute('data-dir') < 0 ? rail.scrollLeft <= 2 : rail.scrollLeft >= max; });
      if (had && had.hidden) { var other = btns.filter(function (b) { return !b.hidden; })[0]; if (other) other.focus(); }
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        rail.scrollBy({ left: +b.getAttribute('data-dir') * stepWidth(), behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    var t = false;
    rail.addEventListener('scroll', function () { if (!t) { t = true; requestAnimationFrame(function () { t = false; update(); }); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
})();

// Wires a lead/sign-up form generically: every named field becomes a line (checkboxes
// with the same name are grouped onto one line), posted to Formspree when FORM_ENDPOINT
// is set, falling back to a mail draft to CONTACT_EMAIL otherwise.
function wireLeadForm(form) {
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    var btn = f.querySelector('button[type=submit]');
    var status = f.querySelector('.form-status');
    var subjectBase = f.getAttribute('data-subject') || 'RealDays enquiry';
    var titleField = f.elements['business'] || f.elements['name'];
    var subject = subjectBase + (titleField && titleField.value ? ', ' + titleField.value : '');
    var lines = [], grouped = {}, order = [];
    [].forEach.call(f.elements, function (el) {
      if (!el.name || el.name === '_gotcha' || el.type === 'submit' || el.type === 'button') return;
      var label = el.getAttribute('data-label') || el.name;
      if (el.type === 'checkbox') {
        if (!el.checked) return;
        if (!(label in grouped)) { grouped[label] = []; order.push(label); }
        grouped[label].push(el.value);
        return;
      }
      var v = (el.value || '').trim();
      if (v) lines.push(label + ': ' + v);
    });
    order.forEach(function (label) { lines.push(label + ': ' + grouped[label].join(', ')); });
    var body = lines.join('\n');
    function mailDraft() {
      window.location.href = 'mailto:' + CONTACT_EMAIL +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);
    }
    if (!FORM_ENDPOINT) return mailDraft();
    if (f._gotcha && f._gotcha.value) return; // spam bots fill the hidden field
    var data = new FormData(f);
    data.append('_subject', subject);
    if (f.elements['email']) data.append('_replyto', f.elements['email'].value);
    btn.disabled = true;
    if (status) status.textContent = 'Sending...';
    fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); })
      .then(function () {
        f.reset();
        if (status) status.textContent = f.getAttribute('data-success') || 'Thanks, that has reached us. We will reply by email.';
      })
      .catch(function () {
        if (status) status.textContent = 'That did not send, so we have opened an email for you instead.';
        mailDraft();
      })
      .then(function () { btn.disabled = false; });
  });
}
wireLeadForm(document.getElementById('lead'));
wireLeadForm(document.getElementById('bizSignup'));

document.querySelectorAll('a[href^="mailto:hello@example.com"]').forEach(function (a) {
  a.href = a.href.replace('hello@example.com', CONTACT_EMAIL);
});

// Homepage rows capped at 12 cards on mobile (styles.css): "See all" shows the rest.
document.querySelectorAll('.card-cap-more').forEach(function (btn) {
  var row = document.getElementById(btn.getAttribute('aria-controls'));
  if (!row || row.children.length <= 12) { btn.hidden = true; return; }
  btn.textContent = 'See all ' + row.children.length + ' experiences';
  btn.addEventListener('click', function () {
    row.classList.add('is-expanded');
    btn.setAttribute('aria-expanded', 'true');
    btn.hidden = true;
    var next = row.children[12] && row.children[12].querySelector('a') || row.children[12];
    if (next && next.focus) next.focus();
  });
});

// Homepage background video: loads and plays only when motion is allowed, fades in
// over its still once frames arrive, and the Pause button stops and restarts it.
(function () {
  var video = document.getElementById('heroVideo'), btn = document.getElementById('heroPause');
  if (!video) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  video.addEventListener('playing', function () { video.classList.add('is-playing'); });
  video.preload = 'auto';
  var started = video.play();
  if (started && started.catch) started.catch(function () { /* autoplay refused: the still stays */ });
  if (!btn) return;
  btn.hidden = false;
  btn.addEventListener('click', function () {
    var pause = !video.paused;
    if (pause) video.pause(); else video.play();
    btn.textContent = pause ? 'Play video' : 'Pause video';
  });
})();

// Mobile hamburger nav: toggles the full-width menu, swaps the icon via aria-expanded,
// and closes on a link tap or Escape. Same markup and behaviour on every page.
(function () {
  var toggle = document.getElementById('navToggle');
  var nav = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  if (!toggle || !nav) return;
  var main = document.getElementById('main');
  var footerEl = document.querySelector('footer');
  function close() {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menu');
    nav.classList.remove('is-open');
    document.documentElement.classList.remove('is-menu-open');
    if (main) main.removeAttribute('inert');
    if (footerEl) footerEl.removeAttribute('inert');
    toggle.focus();
  }
  function open() {
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    nav.classList.add('is-open');
    document.documentElement.classList.add('is-menu-open');
    if (main) main.setAttribute('inert', '');
    if (footerEl) footerEl.setAttribute('inert', '');
    var firstLink = nav.querySelector('.menu-panel a') || nav.querySelector('a');
    if (firstLink) firstLink.focus();
  }
  toggle.addEventListener('click', function () {
    if (nav.classList.contains('is-open')) close(); else open();
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) close();
  });
})();

var siteHeader = document.querySelector('.site-header');
function setHeaderOffset() {
  if (siteHeader) {
    document.documentElement.style.setProperty('--header-h', siteHeader.offsetHeight + 'px');
  }
}
setHeaderOffset();
window.addEventListener('resize', setHeaderOffset);


// Hero animation: people step up to the threshold one at a time, and the calendar
// shows only the slots that fit each of them before one is booked.
(function () {
  var svg = document.getElementById('heroAnim');
  if (!svg) return;
  var figs = [].slice.call(svg.querySelectorAll('.ha-fig'));
  var slots = [].slice.call(svg.querySelectorAll('.ha-slot'));
  var count = document.getElementById('haCount');
  var picks = [3, 8, 5]; // the slot each person books, in queue order
  var QUEUE = [146, 82, 18], DOOR = 238, GROUND = 384;
  var timers = [];
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function place(f, x, instant) {
    if (instant) f.style.transition = 'none';
    f.style.transform = 'translate(' + x + 'px,' + GROUND + 'px)';
    if (instant) { f.getBoundingClientRect(); f.style.transition = ''; }
  }
  function walk(f, x) { f.classList.add('walking'); place(f, x); setTimeout(function () { f.classList.remove('walking'); }, 1000); }
  function screen(level) {
    var fit = 0;
    slots.forEach(function (s, i) {
      if (s.classList.contains('is-booked')) return;
      var ok = level >= +s.getAttribute('data-req');
      if (ok) fit++;
      setTimeout(function () { s.classList.toggle('is-open', ok); s.classList.toggle('is-closed', !ok); }, i * 45);
    });
    count.textContent = fit + ' FIT';
  }
  function settle() {
    slots.forEach(function (s) { s.classList.remove('is-open', 'is-closed'); });
    count.textContent = slots.filter(function (s) { return !s.classList.contains('is-booked'); }).length + ' SLOTS';
  }
  function reset() {
    slots.forEach(function (s) { s.classList.remove('is-open', 'is-closed', 'is-booked'); });
    settle();
    figs.forEach(function (f, i) { f.classList.remove('walking'); f.style.opacity = 1; place(f, -70 - i * 66, true); });
  }
  function cycle() {
    timers = [];
    reset();
    at(60, function () { figs.forEach(function (f, i) { walk(f, QUEUE[i]); }); });
    figs.forEach(function (f, n) {
      var t = 1300 + n * 3900;
      at(t, function () {
        walk(f, DOOR);
        figs.forEach(function (g, i) { if (i > n) walk(g, QUEUE[i - n - 1]); });
      });
      at(t + 1050, function () { svg.classList.add('scan'); screen(+f.getAttribute('data-level')); });
      at(t + 2300, function () { slots[picks[n]].classList.remove('is-open'); slots[picks[n]].classList.add('is-booked'); });
      at(t + 3100, function () { svg.classList.remove('scan'); settle(); f.classList.add('walking'); place(f, DOOR + 30); f.style.opacity = 0; });
    });
    at(1300 + figs.length * 3900 + 1400, cycle);
  }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // One still frame: the second person at the door, their slots shown, one booked.
    figs.forEach(function (f, i) { place(f, i === 1 ? DOOR : i === 0 ? -200 : QUEUE[0], true); });
    svg.classList.add('scan');
    screen(3);
    slots[picks[1]].classList.remove('is-open');
    slots[picks[1]].classList.add('is-booked');
    return;
  }
  cycle();
})();

// Live demo carousel: the arrows step through the phones one at a time.
(function () {
  var track = document.getElementById('phoneTrack');
  if (!track) return;
  var prev = document.getElementById('phonePrev'), next = document.getElementById('phoneNext');
  function step() { return track.children[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0); }
  function update() {
    var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    prev.disabled = track.scrollLeft < 4;
    next.disabled = atEnd;
  }
  // Each phone holds a real 390px-wide booking page, scaled down to fit its frame.
  function fit() {
    [].forEach.call(track.querySelectorAll('.phone-frame'), function (f) { f.style.transform = 'scale(' + f.parentNode.clientWidth / 390 + ')'; });
  }
  fit();
  window.addEventListener('resize', fit);
  prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
  next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
  track.addEventListener('scroll', function () { window.requestAnimationFrame(update); });
  window.addEventListener('resize', update);
  update();
})();

// Floating "Book a free call" button: on once the hero is scrolled past, off while the contact form is on screen.
(function () {
  var btn = document.getElementById('floatCta');
  var hero = document.getElementById('top');
  var form = document.getElementById('interested') || document.getElementById('signup') || document.querySelector('footer');
  if (!btn || !hero || !form || !('IntersectionObserver' in window)) return;
  var heroIn = true, formIn = false;
  function sync() { btn.classList.toggle('on', !heroIn && !formIn); }
  new IntersectionObserver(function (e) { heroIn = e[0].isIntersecting; sync(); }).observe(hero);
  new IntersectionObserver(function (e) { formIn = e[0].isIntersecting; sync(); }).observe(form);
})();

// Hand-drawn hero: redraws each shape of #heroAnim with rough.js as pencil strokes and hatching,
// hides the clean originals, then lets the lines boil gently. Without rough.js the clean vector stays.
(function () {
  var svg = document.getElementById('heroAnim');
  if (!svg || !window.rough) return;
  var rc = rough.svg(svg), seed = 7;
  var NS = 'http://www.w3.org/2000/svg';
  function rr(x, y, w, h, r) {
    return 'M' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) +
      'V' + (y + h - r) + 'Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w - r) + ' ' + (y + h) +
      'H' + (x + r) + 'Q' + x + ' ' + (y + h) + ' ' + x + ' ' + (y + h - r) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Z';
  }
  // One pencil layer. colour is a CSS colour the layer inherits as currentColor, so tokens work.
  function draw(d, o, colour, cls) {
    var g = rc.path(d, Object.assign({ roughness: 1.1, bowing: 1.3, stroke: 'currentColor', strokeWidth: 2, seed: seed++ }, o));
    if (colour) g.style.color = colour;
    if (cls) g.setAttribute('class', cls);
    return g;
  }
  function circle(cx, cy, r) { return 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + 2 * r + ' 0a' + r + ' ' + r + ' 0 1 0 ' + -2 * r + ' 0Z'; }
  function swap(orig, layers) {
    layers.forEach(function (l) { orig.parentNode.insertBefore(l, orig); });
    orig.classList.add('ha-orig');
  }
  var q = function (s, r) { return (r || svg).querySelector(s); };
  var PAPER = 'var(--paper)', PANEL = 'var(--panel)', INK = 'var(--ink)';
  var hatch = { stroke: 'none', fill: 'currentColor', fillStyle: 'hachure', hachureGap: 6, fillWeight: 1.1, hachureAngle: -41 };
  var solid = { stroke: 'none', fill: 'currentColor', fillStyle: 'solid' };

  swap(q('.ha-ground'), [draw('M8 384H632', { strokeWidth: 2.2, roughness: 1.4 })]);
  swap(q('.ha-doorfill'), [draw('M203 117H273V384H203Z', Object.assign({}, hatch, { hachureGap: 8 }), null, 'ha-r-doorfill')]);
  swap(q('.ha-door'), [draw('M200 384V122Q200 114 208 114H268Q276 114 276 122V384', { strokeWidth: 3, fill: 'none' }, null, 'ha-r-door')]);
  swap(q('.ha-step'), [draw('M186 384H290V393H186Z', Object.assign({}, hatch, { hachureGap: 2.5, stroke: 'currentColor', strokeWidth: 1.5 }))]);
  swap(q('.ha-shadow'), [draw(rr(364, 132, 250, 250, 14), Object.assign({}, hatch, { hachureGap: 7 }), null, 'ha-r-shadow')]);
  swap(q('.ha-card'), [draw(rr(356, 122, 250, 250, 14), solid, PANEL), draw(rr(356, 122, 250, 250, 14), { strokeWidth: 2 })]);

  [].forEach.call(svg.querySelectorAll('.ha-slot'), function (slot) {
    var box = rr(0, 0, 64, 38, 8);
    swap(q('.ha-slot-bg', slot), [
      draw(box, Object.assign({}, hatch, { hachureGap: 5, fillWeight: 1 }), null, 'ha-r-closed'),
      draw(box, Object.assign({}, solid, { roughness: 1.4 }), 'var(--ink)', 'ha-r-booked'),
      draw(box, { strokeWidth: 1.6, roughness: 1 }, null, 'ha-r-line')
    ]);
  });

  [].forEach.call(svg.querySelectorAll('.ha-fig'), function (fig) {
    var art = q('g[transform]', fig);
    var level = fig.getAttribute('data-level');
    var parts = art.children;
    var legs = parts[0], body = parts[1], head = parts[2], badge = parts[3];
    var bodyD = 'M-17 -20C-17 -64 17 -64 17 -20Z';
    swap(legs, [draw('M-6 0V-24M6 0V-24', { strokeWidth: 2.4, roughness: 1.2 })]);
    var fill = level === '1' ? [] :
      level === '3' ? [draw(bodyD, { stroke: 'none', fill: 'currentColor', fillStyle: 'zigzag', hachureGap: 2.2, fillWeight: 1.4 })] :
      [draw(bodyD, Object.assign({}, hatch, { hachureGap: 4, fillWeight: .9 }))];
    swap(body, [draw(bodyD, solid, PAPER)].concat(fill, [draw(bodyD, { strokeWidth: 2 })]));
    swap(head, [draw(circle(0, -78, 13), solid, PAPER), draw(circle(0, -78, 13), { strokeWidth: 2 })]);
    swap(badge, [draw(rr(-22, -121, 44, 18, 9), solid, PAPER), draw(rr(-22, -121, 44, 18, 9), { strokeWidth: 1.3, roughness: .9 })]);
  });

  svg.classList.add('sketch');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var noise = document.getElementById('ha-noise'), n = 1;
  setInterval(function () { n = n % 3 + 1; noise.setAttribute('seed', n); }, 180);
})();

// Verticals scroller: moves only while the page itself is being scrolled, in the
// same direction as the scroll. Static whenever the user isn't scrolling, and
// static under reduced motion. Runs once per .vert-scroll instance (hero and
// /for-business/).
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.vert-scroll').forEach(function (scroll) {
    var track = scroll.querySelector('.vert-track');
    if (!track) return;

    var sets = track.querySelectorAll('.vert-set');
    if (sets[1]) sets[1].setAttribute('aria-hidden', 'true');

    if (reduceMotion) return;

    var halfWidth = 0;
    function measure() { halfWidth = track.scrollWidth / 2; }
    measure();
    window.addEventListener('resize', measure);

    var pos = 0, lastY = window.scrollY, queued = false;

    function render() {
      queued = false;
      track.style.transform = 'translateX(' + (-pos) + 'px)';
    }

    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (halfWidth > 0) {
        pos += (y - lastY) * 0.5;
        pos = ((pos % halfWidth) + halfWidth) % halfWidth;
      }
      lastY = y;
      if (!queued) {
        queued = true;
        requestAnimationFrame(render);
      }
    }, { passive: true });
  });
})();

// Phase 4: Salty Cowboy card image carousels. Dots and prev/next scroll one slide each,
// stopPropagation so the controls don't trigger the card's own link, and the sr-only
// live text announces "Photo X of N" for screen readers. No autoplay.
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.card__carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.card__track');
    var slides = track ? Array.prototype.slice.call(track.querySelectorAll('.card__slide')) : [];
    if (slides.length < 2) return; // one image means no controls

    var prev = carousel.querySelector('.card__nav--prev');
    var next = carousel.querySelector('.card__nav--next');
    var dotsWrap = carousel.querySelector('.card__dots');
    var srText = carousel.querySelector('.sr-only');
    var dots = slides.map(function (_, i) {
      var d = document.createElement('span');
      if (i === 0) d.className = 'is-active';
      dotsWrap.appendChild(d);
      return d;
    });

    function activeIndex() {
      var scrollLeft = track.scrollLeft, width = track.clientWidth || 1;
      return Math.round(scrollLeft / width);
    }
    function updateActive() {
      var i = Math.max(0, Math.min(slides.length - 1, activeIndex()));
      dots.forEach(function (d, j) { d.className = j === i ? 'is-active' : ''; });
      if (srText) srText.textContent = 'Photo ' + (i + 1) + ' of ' + slides.length;
    }
    function goTo(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    if (prev) prev.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      goTo(activeIndex() - 1);
    });
    if (next) next.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      goTo(activeIndex() + 1);
    });
    dots.forEach(function (d, i) {
      d.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); goTo(i); });
    });
    track.addEventListener('click', function (e) { e.stopPropagation(); });
    track.addEventListener('scroll', function () {
      clearTimeout(track._thScrollTimer);
      track._thScrollTimer = setTimeout(updateActive, 80);
    }, { passive: true });

    updateActive();
  });
})();

// Sticky "Get listed" bar on /for-business/: hidden until the hero scrolls
// out of view, hidden again once the signup form is in view or a field in it
// is focused, same show/hide pattern as the experience-page booking bar.
(function () {
  var bar = document.getElementById('businessStickyBar');
  var hero = document.getElementById('intro');
  if (!bar || !hero) return;

  var target = document.getElementById('interested');
  var heroVisible = true, targetVisible = false, fieldFocused = false;

  function syncPadding() {
    var hidden = bar.classList.contains('is-hidden');
    document.body.style.paddingBottom = hidden ? '0px' : bar.getBoundingClientRect().height + 'px';
  }
  function render() {
    bar.classList.toggle('is-hidden', heroVisible || targetVisible || fieldFocused);
    syncPadding();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting;
      render();
    }, { threshold: 0 }).observe(hero);
    if (target) {
      new IntersectionObserver(function (entries) {
        targetVisible = entries[0].isIntersecting;
        render();
      }, { threshold: 0.01 }).observe(target);
    }
  }

  document.addEventListener('focusin', function (e) {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) { fieldFocused = true; render(); }
  });
  document.addEventListener('focusout', function (e) {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) { fieldFocused = false; render(); }
  });

  window.addEventListener('resize', syncPadding);
  render();
})();

// /for-business/ "Jump to" links: the browser scrolls to the section (smoothly, unless
// reduced motion is on) and updates the address; its heading takes focus, so keyboard
// and screen reader users carry on from there.
(function () {
  [].forEach.call(document.querySelectorAll('.jump a[href^="#"]'), function (a) {
    a.addEventListener('click', function () {
      var section = document.getElementById(a.getAttribute('href').slice(1));
      var heading = section && section.querySelector('h2[tabindex="-1"]');
      // After the browser's own jump, which would otherwise reset focus.
      if (heading) setTimeout(function () { heading.focus({ preventScroll: true }); }, 0);
    });
  });
})();

// Homepage: a notice along the bottom that more experiences are coming, until "Got it".
(function () {
  var bar = document.getElementById('moreSoon'), ok = document.getElementById('moreSoonOk');
  var KEY = 'threshold-more-soon-dismissed';
  if (!bar || !ok) return;
  try { if (localStorage.getItem(KEY)) return; } catch (e) { /* show it */ }
  bar.hidden = false;
  ok.addEventListener('click', function () {
    bar.hidden = true;
    try { localStorage.setItem(KEY, '1'); } catch (e) { /* ignore */ }
  });
})();

// For businesses: the founding partner invite opens once, a few seconds in. "Apply" goes
// to the sign-up form (marked as a founding partner application) and it never comes back;
// "Maybe later", Esc or a click outside closes it for this visit.
(function () {
  var dlg = document.getElementById('foundingDialog');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  var KEY = 'threshold-founding-invite', apply = document.getElementById('foundingApply');
  var later = document.getElementById('foundingLater'), field = document.getElementById('leadFounding');
  try { if (localStorage.getItem(KEY) || sessionStorage.getItem(KEY)) return; } catch (e) { /* show it */ }
  function remember(store) { try { store.setItem(KEY, '1'); } catch (e) { /* ignore */ } }
  setTimeout(function () {
    if (document.querySelector('dialog[open]')) return;
    dlg.showModal();
  }, 4000);
  dlg.addEventListener('close', function () { remember(sessionStorage); });
  dlg.addEventListener('click', function (e) {
    if (e.target !== dlg) return;
    var r = dlg.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dlg.close();
  });
  if (later) later.addEventListener('click', function () { dlg.close(); });
  if (apply) apply.addEventListener('click', function (e) {
    e.preventDefault();
    remember(localStorage);
    if (field) field.value = 'Yes';
    dlg.close();
    var form = document.getElementById('interested'), first = document.querySelector('#lead input[name="business"]');
    if (form) form.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 400);
  });
})();
