// Threshold, static site behaviour. Set your address here (used by the contact form and call link).
var CONTACT_EMAIL = 'rowenabaulch@outlook.com';

var SESSIONS = [
  { name: 'Intro session, 60 min', meta: 'ALL LEVELS / ANY GROUP SIZE', minLevel: 0, maxGroup: 3 },
  { name: 'Private session, 45 min', meta: 'ALL LEVELS / UP TO 2 PEOPLE', minLevel: 0, maxGroup: 2 },
  { name: 'Guided session, 90 min', meta: 'INTERMEDIATE+ / UP TO 4 PEOPLE', minLevel: 1, maxGroup: 2 },
  { name: 'Small group session, 60 min', meta: 'INTERMEDIATE+ / UP TO 2 PEOPLE', minLevel: 1, maxGroup: 1 },
  { name: 'Advanced session, 2 hr', meta: 'ADVANCED / UP TO 2 PEOPLE', minLevel: 2, maxGroup: 1 }
];
var LEVELS = ['First time', 'Some experience', 'Advanced'];
var GROUPS = ['1 to 2 people', '3 to 4 people', '5 or more'];

var state = { level: 0, group: 1, showHidden: true };

function options(el, labels, active, onPick) {
  el.innerHTML = '';
  labels.forEach(function (label, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.textContent = label;
    b.setAttribute('aria-pressed', String(i === active));
    b.addEventListener('click', function () { onPick(i); });
    el.appendChild(b);
  });
}

function render() {
  var evaluated = SESSIONS.map(function (s) {
    return { s: s, ok: state.level >= s.minLevel && state.group <= s.maxGroup };
  });
  var cleared = evaluated.filter(function (r) { return r.ok; });
  var shown = state.showHidden ? evaluated : cleared;

  document.getElementById('resultLine').textContent = cleared.length + ' of 5 sessions fit this user';
  document.getElementById('sessions').innerHTML = shown.map(function (r) {
    var tag = r.ok
      ? '<span style="font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;padding:7px 11px;color:#f6f7f3;background:var(--cleared);white-space:nowrap;">Cleared</span>'
      : '<span style="font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;padding:7px 11px;color:rgba(23,23,26,.55);background:rgba(23,23,26,.07);white-space:nowrap;">Hidden</span>';
    return '<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;align-items:center;padding:18px 20px;border-bottom:1px solid rgba(23,23,26,.08);opacity:' + (r.ok ? 1 : 0.45) + ';">' +
      '<div><p class="display" style="font-size:18px;line-height:21.6px;letter-spacing:-.01em;margin:0 0 5px;color:' + (r.ok ? 'var(--ink)' : 'rgba(23,23,26,.55)') + ';text-decoration:' + (r.ok ? 'none' : 'line-through') + ';">' + r.s.name + '</p>' +
      '<p style="font-family:var(--mono);font-size:11px;letter-spacing:.08em;margin:0;color:rgba(23,23,26,.5);">' + r.s.meta + '</p></div>' + tag + '</div>';
  }).join('');
  document.getElementById('toggle').textContent = state.showHidden ? 'Hide what does not fit' : 'Reveal what was filtered out';

  options(document.getElementById('levels'), LEVELS, state.level, function (i) { state.level = i; render(); });
  options(document.getElementById('groups'), GROUPS, state.group - 1, function (i) { state.group = i + 1; render(); });
}

document.getElementById('toggle').addEventListener('click', function () {
  state.showHidden = !state.showHidden;
  render();
});

document.getElementById('lead').addEventListener('submit', function (e) {
  e.preventDefault();
  var f = e.target;
  var body = [
    'Name: ' + f.name.value,
    'Business: ' + f.business.value,
    'What they run: ' + f.what.value,
    'Email: ' + f.email.value
  ].join('\n');
  window.location.href = 'mailto:' + CONTACT_EMAIL +
    '?subject=' + encodeURIComponent('Threshold enquiry, ' + (f.business.value || f.name.value)) +
    '&body=' + encodeURIComponent(body);
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

render();
