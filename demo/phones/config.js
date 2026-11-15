// Loads one business per ?brand= for the phones on the RealDays home page, then embed.js,
// which walks the page to its step and locks it there.
(function () {
  var b = (/[?&]brand=([a-z]+)/.exec(location.search) || [])[1] || 'dive';
  // Salty Cowboy's phone (?brand=sc) came off with Bali (Ro, 14 Nov 2026).
  var files = ['configs/demo-theme.js', 'configs/demo-dive.js', 'configs/brands.js'];
  files.push('configs/embed.js');
  files.forEach(function (f) { document.write('<script src="' + f + '"><\/script>'); });
})();
