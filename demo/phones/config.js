// Loads one business per ?brand= for the phones on the Threshold home page, then embed.js,
// which walks the page to its step and locks it there.
(function () {
  var b = (/[?&]brand=([a-z]+)/.exec(location.search) || [])[1] || 'dive';
  var files = b === 'sc' ? ['configs/salty-cowboy.js'] : ['configs/demo-theme.js', 'configs/demo-dive.js', 'configs/brands.js'];
  files.push('configs/embed.js');
  files.forEach(function (f) { document.write('<script src="' + f + '"><\/script>'); });
})();
