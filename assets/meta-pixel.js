// Meta Pixel for getrealdays.com (Ro, 13 Nov 2026), so Meta ads can be measured and improved.
// app.js loads this file on every page. It only runs for real visitors on customer pages:
//   - not on team visits (?team=1, remembered for the session), the same rule as the visit counts;
//   - not off getrealdays.com (local previews, *.pages.dev, *.workers.dev);
//   - not on demo, internal or business pages (/demo/, /sitev2/, /design-system/, /preview-local/, /for-business/).
// Other scripts send events with RealDaysPixel(kind, name, params, eventId), or push the same
// arguments onto window._rdpx before this file has loaded. Booking events carry an event id
// ('lead-<ref>'), so Meta counts each one once even though the booking service also sends it
// through the Conversions API. Never send names, emails, phone numbers or answers from here.
(function () {
  var PIXEL_ID = '3207020569492409';
  var queue = (window._rdpx = window._rdpx || []);
  if (window.RealDaysPixel && window.RealDaysPixel.loaded) return;

  function off() {
    var team = false;
    try {
      team = new URLSearchParams(location.search).get('team') === '1';
      if (team) sessionStorage.setItem('th_team', '1');
      team = team || sessionStorage.getItem('th_team') === '1';
    } catch (e) {}
    if (team) return true;
    if (!/(^|\.)getrealdays\.com$/.test(location.hostname)) return true;
    return /^\/(demo|sitev2|design-system|preview-local|for-business)(\/|$)/.test(location.pathname);
  }

  function noop() {}
  noop.loaded = true;
  if (off()) { queue.length = 0; window.RealDaysPixel = noop; return; }

  /* Meta's standard base code. */
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
    t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');

  function send(kind, name, params, eventId) {
    if (kind !== 'track' && kind !== 'trackCustom') return;
    try { window.fbq(kind, name, params || {}, eventId ? { eventID: eventId } : undefined); } catch (e) {}
  }
  send.loaded = true;
  window.RealDaysPixel = send;
  while (queue.length) send.apply(null, queue.shift());
})();
