// Threshold, static site behaviour. Set your address here (used by the contact form and call link).
var CONTACT_EMAIL = 'rowenabaulch@outlook.com';

// Formspree form endpoint, e.g. 'https://formspree.io/f/abcdwxyz'. Empty means the form falls back to a mail draft.
var FORM_ENDPOINT = '';

// Site-wide currency toggle. All experience prices are sourced in IDR; this converts
// them to AUD using a live rate (frankfurter.app, free, no key) cached in localStorage,
// with a fixed fallback rate if the fetch fails or hasn't run yet. The chosen currency
// and any element marked data-price-idr are kept in sync across every page via
// localStorage, since this is a static multi-page site with no shared app state.
window.ThCurrency = (function () {
  var CURRENCY_KEY = 'th_currency';
  var RATE_KEY = 'th_idr_aud_rate';
  var RATE_TS_KEY = 'th_idr_aud_rate_ts';
  var FALLBACK_RATE = 0.0001; // approx 1 IDR = 0.0001 AUD (about 10,000 IDR per AUD)
  var RATE_MAX_AGE = 1000 * 60 * 60 * 6; // refetch at most every 6 hours

  function getCurrency() {
    try { return localStorage.getItem(CURRENCY_KEY) || 'IDR'; } catch (e) { return 'IDR'; }
  }
  function setCurrency(c) {
    try { localStorage.setItem(CURRENCY_KEY, c); } catch (e) { /* ignore */ }
    render();
  }
  function getCachedRate() {
    try {
      var ts = Number(localStorage.getItem(RATE_TS_KEY) || 0);
      var rate = Number(localStorage.getItem(RATE_KEY));
      if (rate && Date.now() - ts < RATE_MAX_AGE) return rate;
    } catch (e) { /* ignore */ }
    return null;
  }
  function cacheRate(rate) {
    try {
      localStorage.setItem(RATE_KEY, String(rate));
      localStorage.setItem(RATE_TS_KEY, String(Date.now()));
    } catch (e) { /* ignore */ }
  }

  var rate = getCachedRate() || FALLBACK_RATE;
  var rateIsLive = !!getCachedRate();

  function fetchRate() {
    fetch('https://api.frankfurter.app/latest?from=IDR&to=AUD')
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); })
      .then(function (data) {
        var live = data && data.rates && data.rates.AUD;
        if (live) {
          rate = live;
          rateIsLive = true;
          cacheRate(live);
          render();
        }
      })
      .catch(function () { /* keep the fallback rate */ });
  }

  function formatIDR(amount) {
    return 'IDR ' + Math.round(amount).toLocaleString('en-US');
  }
  function formatAUD(amount) {
    var n = amount >= 100 ? Math.round(amount) : Math.round(amount * 100) / 100;
    return '$' + n.toLocaleString('en-US') + ' AUD' + (rateIsLive ? '' : ' (approx)');
  }

  function format(idrAmount, opts) {
    opts = opts || {};
    var text = getCurrency() === 'AUD' ? formatAUD(idrAmount * rate) : formatIDR(idrAmount);
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

  return { format: format, getCurrency: getCurrency, setCurrency: setCurrency, render: render };
})();


// Explore nearby map (Leaflet, vendored in assets/leaflet/). Real listings only, no
// placeholder pins. Centres on the user's location when granted, falls back to the
// Mornington Peninsula, then fits bounds to whatever pins exist. Filter chips reuse the
// same category set and .opt styling as the Experiences section above, wired here to
// actually show/hide pins since this is the section the brief asked for real filtering on.
(function () {
  var mapEl = document.getElementById('exploreMap');
  if (!mapEl || typeof L === 'undefined') return;

  var FALLBACK_CENTER = [-38.373, 144.952]; // Mornington Peninsula

  // Real listings only. Add a pin here once a business goes live with a bookable page.
  var pins = [
    {
      cat: 'horse',
      name: 'Salty Cowboy, Bali',
      lat: -8.6500,
      lng: 115.2167,
      description: 'Horse riding on rescued horses. Beach rides, sunset rides and lessons for all levels.',
      priceIdr: 1250000,
      link: 'bali/salty-cowboy/'
    }
  ];

  // Custom ink SVG pin icon with --cleared active state
  function pinIcon(active) {
    return L.divIcon({
      className: 'th-pin' + (active ? ' is-active' : ''),
      html: '<svg viewBox="0 0 28 36" width="28" height="36" aria-hidden="true"><path d="M14 35s12-12.3 12-21A12 12 0 0 0 2 14c0 8.7 12 21 12 21z" fill="currentColor"/><circle cx="14" cy="14" r="4.5" fill="#f3f2ee"/></svg>',
      iconSize: [28, 36],
      iconAnchor: [14, 35],
      popupAnchor: [0, -30]
    });
  }

  // User location pin
  function userIcon() {
    return L.divIcon({ className: 'th-you', iconSize: [14, 14] });
  }

  var isMobile = window.matchMedia('(max-width:640px)').matches;
  var map = L.map(mapEl, { scrollWheelZoom: false, dragging: !isMobile, tap: !isMobile }).setView(FALLBACK_CENTER, 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var markers = pins.map(function (p) {
    var m = L.marker([p.lat, p.lng], { icon: pinIcon(false), title: p.name, keyboard: true });
    m.threshCat = p.cat;
    m.addTo(map);
    m.bindPopup(
      function () {
        return '<p class="pop-title">' + p.name + '</p>' +
          '<p class="pop-desc">' + p.description + '</p>' +
          '<p class="pop-price">' + window.ThCurrency.format(p.priceIdr, { prefix: 'from' }) + '</p>' +
          '<a class="pop-link" href="' + p.link + '">View listing &rarr;</a>';
      },
      { closeButton: true, maxWidth: 260 }
    );
    m.on('popupopen', function () { m.setIcon(pinIcon(true)); });
    m.on('popupclose', function () { m.setIcon(pinIcon(false)); });
    return m;
  });

  function fitToPins(extra) {
    var points = pins.map(function (p) { return [p.lat, p.lng]; });
    if (extra) points = points.concat([extra]);
    if (!points.length) return;
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 10 });
  }
  fitToPins();

  setTimeout(function () { map.invalidateSize(); }, 0);
  window.addEventListener('resize', function () {
    map.invalidateSize();
    var mobileNow = window.matchMedia('(max-width:640px)').matches;
    if (mobileNow) map.dragging.disable(); else map.dragging.enable();
  });

  var statusEl = document.getElementById('nearbyStatus');
  function setStatus(text) { if (statusEl) statusEl.textContent = text; }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (pos) {
      var userLatLng = [pos.coords.latitude, pos.coords.longitude];
      L.marker(userLatLng, { icon: userIcon() }).addTo(map).bindPopup('You are here');
      fitToPins(userLatLng);
      setStatus('Showing experiences near you');
    }, function () {
      setStatus('Showing all experiences. Enable location to see what is nearest.');
    }, { timeout: 6000 });
  } else {
    setStatus('Showing all experiences');
  }

})();

// Homepage search, category chips, horse sub-chips and region toggle (#browse). Filters
// the experience cards in place with AND logic (search text AND category AND sub-type
// AND region), never navigates, and syncs state to the URL so a link like
// /?region=bali#browse opens pre-filtered. With no filters active, the grouped default
// view (#browseDefault) shows; any filter switches to the flat results grid (#browseGrid).
(function () {
  var grid = document.getElementById('browseGrid');
  var defaultView = document.getElementById('browseDefault');
  if (!grid) return;

  var chipRow = document.getElementById('chipRow');
  var horseSub = document.getElementById('horseSub');
  var regionGroup = document.getElementById('regionGroup');
  var countEl = document.getElementById('browseCount');
  var emptyEl = document.getElementById('browseEmpty');
  var clearBtn = document.getElementById('clearFilters');

  var cards = [].slice.call(grid.querySelectorAll('.x-card, .sc-card'));
  var realCards = cards.filter(function (c) { return !c.hasAttribute('data-placeholder'); });
  var catChips = chipRow ? [].slice.call(chipRow.querySelectorAll('.cat-chip')) : [];
  var horseChip = catChips.filter(function (c) { return c.getAttribute('data-cat') === 'horse'; })[0];
  var subChips = horseSub ? [].slice.call(horseSub.querySelectorAll('.sub-chip')) : [];
  var regionRadios = regionGroup ? [].slice.call(regionGroup.querySelectorAll('.region-radio')) : [];
  var seeAllBtns = [].slice.call(document.querySelectorAll('.see-all'));

  var state = { cat: '', sub: '', region: '' };

  function readURL() {
    var params = new URLSearchParams(window.location.search);
    state.cat = params.get('cat') || '';
    state.sub = params.get('sub') || '';
    state.region = params.get('region') || '';
  }

  function writeURL() {
    var params = new URLSearchParams(window.location.search);
    ['cat', 'sub', 'region'].forEach(function (key) {
      if (state[key]) params.set(key, state[key]); else params.delete(key);
    });
    var qs = params.toString();
    var url = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
    history.replaceState(null, '', url);
  }

  function cardMatches(card, opts) {
    opts = opts || {};
    if (!opts.ignoreCat && state.cat) {
      var cats = (card.getAttribute('data-cat') || '').split(/\s+/);
      if (cats.indexOf(state.cat) === -1) return false;
    }
    if (!opts.ignoreSub && state.sub) {
      if (card.getAttribute('data-type') !== state.sub) return false;
    }
    if (state.region) {
      if (card.getAttribute('data-region') !== state.region) return false;
    }
    return true;
  }

  function hasActiveFilters() {
    return !!(state.cat || state.sub || state.region);
  }

  // Sub-chip counts reflect the currently visible horse cards, respecting region and
  // search but not the sub-chip selection itself, per the brief.
  function updateSubCounts() {
    if (!subChips.length) return;
    var horseCards = realCards.filter(function (card) {
      var cats = (card.getAttribute('data-cat') || '').split(/\s+/);
      if (cats.indexOf('horse') === -1) return false;
      return cardMatches(card, { ignoreCat: true, ignoreSub: true });
    });
    subChips.forEach(function (chip) {
      var type = chip.getAttribute('data-type');
      var n = type ? horseCards.filter(function (c) { return c.getAttribute('data-type') === type; }).length : horseCards.length;
      var base = chip.getAttribute('data-label') || chip.textContent.replace(/\s*\(\d+\)\s*$/, '');
      chip.setAttribute('data-label', base);
      chip.textContent = base + ' (' + n + ')';
    });
  }

  function render() {
    var active = hasActiveFilters();

    if (defaultView) defaultView.hidden = active;
    grid.hidden = !active;

    var visibleReal = 0;
    cards.forEach(function (card) {
      var isPlaceholder = card.hasAttribute('data-placeholder');
      if (isPlaceholder) {
        card.hidden = active;
        return;
      }
      var match = active ? cardMatches(card) : false;
      card.hidden = !match;
      if (match) visibleReal++;
    });

    if (countEl) {
      var count = active ? visibleReal : realCards.length;
      var label = count === 1 ? '1 experience' : count + ' experiences';
      if (state.region === 'bali') label += ' in Bali';
      else if (state.region === 'mornington') label += ' in Victoria, Australia';
      countEl.textContent = '';
      countEl.appendChild(document.createTextNode(label));
      if (count === 0) {
        countEl.appendChild(document.createTextNode(' · '));
        var seeAllLink = document.createElement('button');
        seeAllLink.type = 'button';
        seeAllLink.className = 'see-all';
        seeAllLink.textContent = 'See all experiences';
        seeAllLink.addEventListener('click', clearFilters);
        countEl.appendChild(seeAllLink);
      }
    }

    if (emptyEl) {
      var showEmpty = active && visibleReal === 0;
      emptyEl.hidden = !showEmpty;
    }

    updateSubCounts();
  }

  function setSub(sub) {
    state.sub = sub || '';
    subChips.forEach(function (chip) {
      chip.setAttribute('aria-pressed', chip.getAttribute('data-type') === state.sub ? 'true' : 'false');
    });
    writeURL();
    render();
  }

  function showHorseSub(show) {
    if (!horseSub) return;
    horseSub.hidden = !show;
    if (horseChip) horseChip.setAttribute('aria-expanded', show ? 'true' : 'false');
    if (!show) setSub('');
  }

  function setCat(cat) {
    state.cat = cat || '';
    catChips.forEach(function (chip) {
      chip.setAttribute('aria-pressed', chip.getAttribute('data-cat') === state.cat ? 'true' : 'false');
    });
    showHorseSub(state.cat === 'horse');
    writeURL();
    render();
  }

  function setRegion(region) {
    state.region = region || '';
    regionRadios.forEach(function (radio) {
      radio.setAttribute('aria-checked', radio.getAttribute('data-region') === state.region ? 'true' : 'false');
    });
    writeURL();
    render();
  }

  catChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var cat = chip.getAttribute('data-cat');
      setCat(state.cat === cat && cat ? '' : cat);
      if (chip === horseChip) chip.focus();
    });
  });

  subChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      setSub(chip.getAttribute('data-type'));
    });
  });

  regionRadios.forEach(function (radio, i) {
    radio.addEventListener('click', function () {
      setRegion(radio.getAttribute('data-region'));
    });
    radio.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var next = e.key === 'ArrowRight' ? (i + 1) % regionRadios.length : (i - 1 + regionRadios.length) % regionRadios.length;
      regionRadios[next].focus();
      setRegion(regionRadios[next].getAttribute('data-region'));
    });
  });

  seeAllBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.getAttribute('data-cat') || '';
      var sub = btn.getAttribute('data-sub') || '';
      state.cat = cat;
      catChips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', chip.getAttribute('data-cat') === cat ? 'true' : 'false');
      });
      showHorseSub(cat === 'horse');
      state.sub = sub;
      subChips.forEach(function (chip) {
        chip.setAttribute('aria-pressed', chip.getAttribute('data-type') === sub ? 'true' : 'false');
      });
      writeURL();
      render();
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var browseSection = document.getElementById('browse');
      if (browseSection) browseSection.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
      if (countEl) countEl.focus();
    });
  });

  function clearFilters() {
    state = { cat: '', sub: '', region: '' };
    catChips.forEach(function (chip) { chip.setAttribute('aria-pressed', chip.getAttribute('data-cat') === '' ? 'true' : 'false'); });
    regionRadios.forEach(function (radio) { radio.setAttribute('aria-checked', radio.getAttribute('data-region') === '' ? 'true' : 'false'); });
    showHorseSub(false);
    writeURL();
    render();
  }

  if (clearBtn) clearBtn.addEventListener('click', clearFilters);

  readURL();
  catChips.forEach(function (chip) {
    chip.setAttribute('aria-pressed', chip.getAttribute('data-cat') === state.cat ? 'true' : 'false');
  });
  showHorseSub(state.cat === 'horse');
  subChips.forEach(function (chip) {
    chip.setAttribute('aria-pressed', chip.getAttribute('data-type') === state.sub ? 'true' : 'false');
  });
  regionRadios.forEach(function (radio) {
    radio.setAttribute('aria-checked', radio.getAttribute('data-region') === state.region ? 'true' : 'false');
  });
  if (countEl) countEl.setAttribute('tabindex', '-1');
  render();
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
    var subjectBase = f.getAttribute('data-subject') || 'Threshold enquiry';
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

// Mobile hamburger nav: toggles the full-width menu, swaps the icon via aria-expanded,
// and closes on a link tap or Escape. Same markup and behaviour on every page.
(function () {
  var toggle = document.getElementById('navToggle');
  var nav = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  if (!toggle || !nav) return;
  function close() {
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  }
  function open() {
    toggle.setAttribute('aria-expanded', 'true');
    nav.classList.add('is-open');
  }
  toggle.addEventListener('click', function () {
    if (nav.classList.contains('is-open')) close(); else open();
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
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

var lt = document.getElementById('localTime');
if (lt) {
  lt.textContent = 'Local time ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

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
      draw(box, Object.assign({}, solid, { roughness: 1.4 }), 'var(--cleared)', 'ha-r-booked'),
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

// Verticals scroller: moves left by default, and reverses to move right while the page
// itself is being scrolled upward. Pauses on hover or keyboard focus, static under
// reduced motion. Runs once per .vert-scroll instance (hero and /for-business/).
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

    var SPEED = 34; // px per second
    var dir = 1; // 1 = leftward (default), -1 = rightward
    var lastScrollY = window.scrollY;
    var scrollTimer;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      if (y > lastScrollY + 1) dir = 1;
      else if (y < lastScrollY - 1) dir = -1;
      lastScrollY = y;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () { dir = 1; }, 1200); // drift back to the default direction once scrolling stops
    }, { passive: true });

    var hovered = false, focused = false;
    scroll.addEventListener('mouseenter', function () { hovered = true; });
    scroll.addEventListener('mouseleave', function () { hovered = false; });
    scroll.addEventListener('focusin', function () { focused = true; });
    scroll.addEventListener('focusout', function () { focused = false; });

    var pos = 0, last = null;
    function frame(t) {
      if (last === null) last = t;
      var dt = (t - last) / 1000;
      last = t;
      if (!hovered && !focused && halfWidth > 0) {
        pos += dir * SPEED * dt;
        pos = ((pos % halfWidth) + halfWidth) % halfWidth;
        track.style.transform = 'translateX(' + (-pos) + 'px)';
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
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
