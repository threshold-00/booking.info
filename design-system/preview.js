(function () {
  'use strict';

  var STORAGE_KEY = 'ds-preview';
  var root = document.documentElement;

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  function saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }

  var state = Object.assign({ mono: 'chivo', corners: 'pill', reducedMotion: false }, loadState());

  function applyMono(value) {
    root.style.setProperty('--mono', value === 'plex' ? "'IBM Plex Mono',ui-monospace,monospace" : "'Chivo Mono',ui-monospace,monospace");
  }

  function applyCorners(value) {
    var map = { pill: 'var(--r-pill)', '2px': 'var(--r-2)', square: 'var(--r-0)' };
    root.style.setProperty('--r-control', map[value] || map.pill);
  }

  function applyReducedMotion(on) {
    root.classList.toggle('ds-reduced-motion', !!on);
  }

  function applyAll() {
    applyMono(state.mono);
    applyCorners(state.corners);
    applyReducedMotion(state.reducedMotion);
    syncControls();
  }

  function syncControls() {
    document.querySelectorAll('input[name="ds-mono"]').forEach(function (el) {
      el.checked = el.value === state.mono;
    });
    document.querySelectorAll('input[name="ds-corners"]').forEach(function (el) {
      el.checked = el.value === state.corners;
    });
    var rm = document.getElementById('ds-reduced-motion');
    if (rm) rm.checked = !!state.reducedMotion;
  }

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.name === 'ds-mono') {
      state.mono = t.value;
      applyMono(state.mono);
      saveState(state);
    } else if (t.name === 'ds-corners') {
      state.corners = t.value;
      applyCorners(state.corners);
      saveState(state);
    } else if (t.id === 'ds-reduced-motion') {
      state.reducedMotion = t.checked;
      applyReducedMotion(state.reducedMotion);
      saveState(state);
    }
  });

  applyAll();

  /* Marquee pause, mirrors the live site's sessionStorage-backed toggle. */
  document.querySelectorAll('[data-marquee-demo]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!pressed));
      btn.textContent = pressed ? 'Pause' : 'Play';
    });
  });

  /* ---- Contrast table (WCAG 2.1 relative luminance, alpha composited) ---- */

  function parseColor(str) {
    var el = document.createElement('div');
    el.style.color = str;
    document.body.appendChild(el);
    var computed = getComputedStyle(el).color;
    document.body.removeChild(el);
    var m = computed.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    var parts = m[1].split(',').map(function (s) { return parseFloat(s); });
    return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
  }

  function composite(fg, bg) {
    var a = fg.a;
    return {
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1
    };
  }

  function relLuminance(c) {
    function chan(v) {
      v = v / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }
    var r = chan(c.r), g = chan(c.g), b = chan(c.b);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastRatio(fgStr, bgStr) {
    var fg = parseColor(fgStr);
    var bg = parseColor(bgStr);
    if (!fg || !bg) return null;
    var composited = fg.a < 1 ? composite(fg, bg) : fg;
    var l1 = relLuminance(composited);
    var l2 = relLuminance(bg);
    var lighter = Math.max(l1, l2);
    var darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function renderContrastTable() {
    var table = document.getElementById('ds-contrast-table');
    if (!table) return;
    var rows = table.querySelectorAll('[data-fg][data-bg]');
    rows.forEach(function (row) {
      var fg = row.getAttribute('data-fg');
      var bg = row.getAttribute('data-bg');
      var large = row.getAttribute('data-large') === 'true';
      var ui = row.getAttribute('data-ui') === 'true';
      var ratio = contrastRatio(fg, bg);
      var ratioCell = row.querySelector('.ds-ratio');
      var resultCell = row.querySelector('.ds-result');
      if (!ratio) {
        if (ratioCell) ratioCell.textContent = 'n/a';
        return;
      }
      var threshold = ui ? 3 : (large ? 3 : 4.5);
      var pass = ratio >= threshold;
      if (ratioCell) ratioCell.textContent = ratio.toFixed(2) + ':1';
      if (resultCell) {
        resultCell.textContent = pass ? 'Pass' : 'Fail';
        resultCell.classList.toggle('ds-pass', pass);
        resultCell.classList.toggle('ds-fail', !pass);
      }
    });
  }

  renderContrastTable();
})();
