// Analytics wrapper for the booking flow. Until Ro picks GA4 or Plausible, track()
// only logs to the console. Server-side state in the database is the source of
// truth for counts (places left, confirmed bookings), never this client log.
(function () {
  function readUTM() {
    try {
      var stored = sessionStorage.getItem("bk_utm");
      if (stored) return JSON.parse(stored);
      var params = new URLSearchParams(location.search);
      var utm = {
        utm_source: params.get("utm_source") || null,
        utm_medium: params.get("utm_medium") || null,
        utm_campaign: params.get("utm_campaign") || null
      };
      if (utm.utm_source || utm.utm_medium || utm.utm_campaign) {
        sessionStorage.setItem("bk_utm", JSON.stringify(utm));
      }
      return utm;
    } catch (e) {
      return { utm_source: null, utm_medium: null, utm_campaign: null };
    }
  }

  function track(event, props) {
    var utm = readUTM();
    var payload = Object.assign(
      {
        business_id: null,
        experience_id: null,
        price_aud: null,
        region: null,
        is_demo: true
      },
      utm,
      props || {}
    );
    // eslint-disable-next-line no-console
    console.log("[track]", event, payload);
  }

  window.ThresholdTrack = { track: track };
})();
