// climate_api.js

(function(window) {
  /**
   * Fetch historical climate normals (1991–2020) for a single lat/lon via Open‑Meteo API
   * Returns data.monthly array with fields month, temperature_2m_mean, precipitation_sum, snowfall_sum, windspeed_10m_mean
   */
  async function fetchClimateNormals(lat, lon) {
    const url =
      `https://climate-api.open-meteo.com/v1/climate` +
      `?latitude=${lat}&longitude=${lon}` +
      `&start_year=1991&end_year=2020&monthly=true&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Climate API error: ${res.status}`);
    const data = await res.json();
    if (!data.monthly || !Array.isArray(data.monthly)) {
      throw new Error("Invalid climate data structure.");
    }
    return data.monthly;
  }

  /**
   * Compute average normals for the route and selected month
   * @param {Array<[lat,lon]>} waypoints
   * @param {number} month 1–12
   * @returns {Promise<{temp, precipitation, snow, wind}>}
   */
  async function getRouteClimate(waypoints, month) {
    const samples = Math.min(5, waypoints.length);
    const step = Math.floor(waypoints.length / samples) || 1;
    let acc = { temp: 0, precipitation: 0, snow: 0, wind: 0 };
    let cnt = 0;

    for (let i = 0; i < waypoints.length; i += step) {
      const [lat, lon] = waypoints[i];
      const monthly = await fetchClimateNormals(lat, lon);
      const entry = monthly.find(m => m.month === month);
      if (entry) {
        acc.temp          += entry.temperature_2m_mean   || 0;
        acc.precipitation += entry.precipitation_sum     || 0;
        acc.snow          += entry.snowfall_sum          || 0;
        acc.wind          += entry.windspeed_10m_mean    || 0;
        cnt++;
      }
    }

    if (cnt === 0) throw new Error("No climate data for selected month.");
    return {
      temp:          acc.temp / cnt,
      precipitation: acc.precipitation / cnt,
      snow:          acc.snow / cnt,
      wind:          acc.wind / cnt
    };
  }

  window.getRouteClimate = getRouteClimate;
})(window);
