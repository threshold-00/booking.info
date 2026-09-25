// Threshold, static site behaviour. Set your address here (used by the contact form and call link).
var CONTACT_EMAIL = 'rowenabaulch@outlook.com';

// Formspree form endpoint, e.g. 'https://formspree.io/f/abcdwxyz'. Empty means the form falls back to a mail draft.
var FORM_ENDPOINT = '';

document.getElementById('lead').addEventListener('submit', function (e) {
  e.preventDefault();
  var f = e.target;
  var btn = f.querySelector('button[type=submit]');
  var status = document.getElementById('leadStatus');
  var subject = 'Threshold enquiry, ' + (f.business.value || f.name.value);
  var lines = [
    'Name: ' + f.name.value,
    'Business: ' + f.business.value,
    'Email: ' + f.email.value
  ];
  var ref = f.referredBy.value.trim();
  if (ref) lines.push('Referred by: ' + ref);
  var body = lines.join('\n');
  function mailDraft() {
    window.location.href = 'mailto:' + CONTACT_EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }
  if (!FORM_ENDPOINT) return mailDraft();
  if (f._gotcha.value) return; // spam bots fill the hidden field
  var data = new FormData(f);
  data.append('_subject', subject);
  data.append('_replyto', f.email.value);
  btn.disabled = true;
  status.textContent = 'Sending...';
  fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
    .then(function (r) { if (!r.ok) throw new Error(r.status); })
    .then(function () {
      f.reset();
      status.textContent = 'Thanks, that has reached us. We will reply by email.';
    })
    .catch(function () {
      status.textContent = 'That did not send, so we have opened an email for you instead.';
      mailDraft();
    })
    .then(function () { btn.disabled = false; });
});

document.querySelectorAll('a[href^="mailto:hello@example.com"]').forEach(function (a) {
  a.href = a.href.replace('hello@example.com', CONTACT_EMAIL);
});

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
  var form = document.getElementById('interested');
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
