// climate_api.js

(function(window) {
  /**
   * Fetch historical climate normals (1991–2020) for a single lat/lon via Open‑Meteo API
   * Returns an object `monthly` with arrays for:
   *   - month [1..12]
   *   - temperature_2m_mean
   *   - precipitation_sum
   *   - snowfall_sum
   *   - windspeed_10m_mean
   */
  async function fetchClimateNormals(lat, lon) {
    const params = [
      'temperature_2m_mean',
      'precipitation_sum',
      'snowfall_sum',
      'windspeed_10m_mean'
    ];
    const query = params.map(v => `monthly=${v}`).join('&');
    const url =
      `https://climate-api.open-meteo.com/v1/climate` +
      `?latitude=${lat}&longitude=${lon}` +
      `&start_year=1991&end_year=2020&${query}&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Climate API error: ${res.status}`);
    const data = await res.json();
    if (!data.monthly || !Array.isArray(data.monthly.month)) {
      throw new Error('Invalid climate data structure.');
    }
    return data.monthly;
  }

  /**
   * Compute average normals for the route and selected month.
   * @param {Array<[number,number]>} waypoints Array of [lat, lon]
   * @param {number} month Integer 1–12
   * @returns {Promise<{temp:number, precipitation:number, snow:number, wind:number}>}
   */
  async function getRouteClimate(waypoints, month) {
    const samples = Math.min(5, waypoints.length);
    const step = Math.floor(waypoints.length / samples) || 1;
    let acc = { temp: 0, precipitation: 0, snow: 0, wind: 0 };
    let cnt = 0;

    for (let i = 0; i < waypoints.length; i += step) {
      const [lat, lon] = waypoints[i];
      const m = await fetchClimateNormals(lat, lon);
      const idx = month - 1;
      acc.temp          += m.temperature_2m_mean[idx]    ?? 0;
      acc.precipitation += m.precipitation_sum[idx]       ?? 0;
      acc.snow          += m.snowfall_sum[idx]            ?? 0;
      acc.wind          += m.windspeed_10m_mean[idx]      ?? 0;
      cnt++;
    }

    if (cnt === 0) throw new Error('No climate data for selected month.');
    return {
      temp:          acc.temp / cnt,
      precipitation: acc.precipitation / cnt,
      snow:          acc.snow / cnt,
      wind:          acc.wind / cnt
    };
  }

  window.getRouteClimate = getRouteClimate;
})(window);