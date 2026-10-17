// Loaded by the demo copy of the engine in place of a single business config.
// Reads ?vertical=water|dive|studio, then loads the shared demo theme and that operator's config.
// A vertical not yet built falls back to the first ready one. Add a name to READY when its file lands.
(function () {
  var READY = ["dive"];
  var m = /[?&]vertical=([a-z]+)/.exec(window.location.search);
  var v = m && READY.indexOf(m[1]) !== -1 ? m[1] : READY[0];
  document.write('<script src="configs/demo-theme.js"><\/script><script src="configs/demo-' + v + '.js"><\/script>');
})();
