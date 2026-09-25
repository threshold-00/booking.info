// Runs inside each phone on the Threshold home page. Walks the booking page to one step,
// then locks it there: answers, dates and times stay tappable, anything that would leave
// the page (back, book, continue, pay, jump to another activity) is stopped with a note.
(function () {
  var C = window.THRESHOLD_CONFIG;
  var brand = (/[?&]brand=([a-z]+)/.exec(location.search) || [])[1] || 'dive';
  // Never let an embedded page log a booking anywhere, whatever the config says.
  if (C && C.endpoints) C.endpoints = Object.assign({}, C.endpoints, { log: Object.assign({}, C.endpoints.log, { url: '' }), calendar: null });

  var hide = document.createElement('style');
  hide.textContent = 'html.staging body{visibility:hidden}' +
    '.embed-note{position:fixed;left:50%;bottom:22px;transform:translate(-50%,12px);opacity:0;transition:opacity .25s,transform .25s;z-index:99999;' +
    'background:rgba(20,20,20,.92);color:#fff;font:500 13px/1.3 -apple-system,Helvetica,Arial,sans-serif;padding:10px 14px;border-radius:10px;white-space:nowrap;pointer-events:none}' +
    '.embed-note.on{opacity:1;transform:translate(-50%,0)}';
  document.head.appendChild(hide);
  document.documentElement.classList.add('staging');

  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function wait(fn) {
    return new Promise(function (res, rej) {
      var t0 = Date.now();
      (function poll() { var v = fn(); if (v) return res(v); if (Date.now() - t0 > 6000) return rej(new Error('embed: step timed out')); setTimeout(poll, 60); })();
    });
  }
  async function tap(fn) { var el = await wait(fn); el.click(); await sleep(120); return el; }
  async function type(fn, text) {
    var el = await wait(fn);
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    await sleep(80);
  }
  var byText = function (sel, text, root) { return function () { return $$(sel, root).filter(function (e) { return e.textContent.trim() === text; })[0]; }; };
  var nth = function (sel, i, root) { return function () { return $$(sel, root)[i]; }; };
  var rider = function () { return $$('.rider-card')[0]; };
  var pillIn = function (group, i) { return function () { var g = rider() && $$('.field-pills', rider())[group]; return g && $$('.field-pill', g)[i]; }; };
  var pillText = function (group, text) { return function () { var g = rider() && $$('.field-pills', rider())[group]; return g && byText('.field-pill', text, g)(); }; };

  async function open(cat, act) {
    await tap(function () { var c = $$('.cat-card')[cat]; return c && c.querySelector('.cat-next-btn'); });
    await tap(function () { var a = $$('.act-card')[act]; return a && a.querySelector('.act-book-btn'); });
  }
  async function dateAndTime() {
    await tap(function () { return $$('.cal-day.available')[0]; });
    await tap(function () { return $$('.time-card').filter(function (c) { return !c.classList.contains('taken'); })[0]; });
  }
  async function onePerson(name) {
    var one = byText('.control-card .pill', '1')();
    if (one) { one.click(); await sleep(120); }
    await type(function () { return rider() && rider().querySelector('input[type=text]'); }, name);
  }
  function scrollToHeading(re, offset) {
    var h = $$('h3').filter(function (h) { return re.test(h.textContent); })[0];
    if (h) window.scrollTo(0, h.getBoundingClientRect().top + window.scrollY - offset);
  }

  var STAGES = {
    sc: async function () {
      await open(0, 0);
      await dateAndTime();
      await onePerson('Ana');
      await tap(pillText(0, 'Over 75 kg'));
      await tap(pillText(1, 'Beginner'));
      scrollToHeading(/^2\./, 16);
    },
    dive: async function () {
      await open(1, 1);
      var sync = await wait(function () { return document.querySelector('.cal-sync-line'); });
      await tap(function () { return $$('.cal-day.available')[0]; });
      window.scrollTo(0, sync.getBoundingClientRect().top + window.scrollY - 150);
    },
    studio: async function () {
      await open(0, 1); await dateAndTime(); await onePerson('Maya');
      await tap(pillIn(0, 0));
      scrollToHeading(/Book a date and time/, 60);
    },
    climb: async function () {
      await open(0, 1); await dateAndTime(); await onePerson('Sam');
      await tap(pillIn(0, 1));
      scrollToHeading(/Book a date and time/, 60);
    },
    dog: async function () {
      await open(0, 0); await dateAndTime(); await onePerson('Biscuit');
      await tap(pillText(0, 'No'));
      scrollToHeading(/Book a date and time/, 60);
    },
    tattoo: async function () {
      await open(0, 1); await dateAndTime(); await onePerson('Jo');
      await tap(pillText(0, 'Yes'));
      await tap(pillIn(1, 0));
      scrollToHeading(/Book a date and time/, 60);
    }
  };

  // Anything that would take the visitor off this one page.
  var LEAVE = '.back-link, .cta, .act-book-btn, .cat-card, .cat-next-btn, .ww-link, .wa-btn, .reset-link, .hint-link, a[href]';
  var note, noteTimer;
  function say(text) {
    if (!note) { note = document.createElement('div'); note.className = 'embed-note'; document.body.appendChild(note); }
    note.textContent = text;
    note.classList.add('on');
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () { note.classList.remove('on'); }, 1800);
  }
  function lock() {
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest(LEAVE)) { e.preventDefault(); e.stopPropagation(); say('This demo stays on one page'); }
    }, true);
  }

  window.addEventListener('DOMContentLoaded', function () {
    (STAGES[brand] || STAGES.dive)()
      .catch(function (err) { console.warn(err.message); })
      .then(function () { lock(); document.documentElement.classList.remove('staging'); });
  });
})();
