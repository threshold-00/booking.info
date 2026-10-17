// The one neutral Threshold theme shared by the three demo configs, built from the site's tokens
// (site/styles.css). A designer restyles all three demos by editing this one object.
// Plain data. A demo config loads AFTER this file and reads DEMO_THEME as a top-level const, so
// Phase 3's Apps Script can concatenate the two files and never needs the browser.
// Site tokens: --ink #17171a, --paper #f3f2ee, --panel #f7f6f3, --cleared #1f6f45, --line rgba(23,23,26,0.14).
// Every other shade is the ink or the paper at a lower alpha, so nothing here invents a new hue,
// with one exception: the site has no warning colour, so "warn" is a placeholder amber for Ro to choose.
// "sunken" (--sand) is not a background tint in this engine: every use in index.html is a text or
// icon colour on a dark fill (selected pills, the active category tab, calendar day numbers, time
// cards, the hero heading). It has to read as light-on-dark, so it is set to the paper tone, not a
// low-alpha wash. Confirmed by grep: no rule in index.html uses --sand as a background.
const DEMO_THEME = {
  colours: {
    ink: "#17171a",
    ink2: "#17171a",
    inkSoft: "rgba(23,23,26,0.7)",
    muted: "rgba(23,23,26,0.55)",
    paper: "#f3f2ee",
    paperAlt: "#f7f6f3",
    sunken: "#f3f2ee",
    line: "rgba(23,23,26,0.14)",
    lineStrong: "rgba(23,23,26,0.28)",
    accent: "#17171a",
    accentOnDark: "#f3f2ee",
    leaf: "#17171a",
    dark: "#17171a",
    onDark: "#f3f2ee",
    shade: "#1f6f45",
    ok: "#1f6f45",
    okSurface: "rgba(31,111,69,0.12)",
    warn: "#8a5a14",
    warnSurface: "rgba(138,90,20,0.12)",
    chrome: "#17171a",
    loadingBg: "#17171a",
    loadingText: "#f3f2ee",
    loadingRing: "rgba(243,242,238,0.18)"
  },
  fonts: {
    display: "'Neue Haas Grotesk Display Pro', 'Neue Haas Grotesk', 'Helvetica Neue', Helvetica, sans-serif",
    body: "'Chivo Mono', monospace",
    mono: "'IBM Plex Mono', monospace",
    href: "https://fonts.googleapis.com/css2?family=Chivo+Mono:wght@400&family=IBM+Plex+Mono:wght@400;500&display=swap"
  },
  type: { bodyTransform: "none" },
  radius: { card: 0, control: 0, pill: 0 }
};
