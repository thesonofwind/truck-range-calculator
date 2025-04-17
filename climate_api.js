// climate_api.js

(function(window) {
  /**
   * Fetch historical climate normals (1991–2020) for a single lat/lon via Open‑Meteo API
   * Returns an object with arrays: time, temperature_2m_mean, precipitation_sum,
   * snowfall_sum, windspeed_10m_mean
   */
  async function fetchClimateNormals(lat, lon) {
    const vars = [
      'temperature_2m_mean',
      'precipitation_sum',
      'snowfall_sum',
      'windspeed_10m_mean'
    ];
    const url =
      `https://climate-api.open-meteo.com/v1/climate` +
      `?latitude=${lat}&longitude=${lon}` +
      `&start_year=1991&end_year=2020` +
      `&monthly=${vars.join(',')}` +
      `&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Climate API error: ${res.status}`);
    const data = await res.json();

    if (
      !data.monthly ||
      !Array.isArray(data.monthly.time) ||
      !Array.isArray(data.monthly.temperature_2m_mean)
    ) {
      throw new Error('Invalid climate data structure.');
    }
    return data.monthly;
  }

  /**
   * Compute average normals for the route and selected month
   * @param {Array<[lat,lon]>} waypoints
   * @param {number} month 1–12
   */
  async function getRouteClimate(waypoints, month, samples = 5) {
    const step = Math.max(1, Math.floor(waypoints.length / samples));
    let acc = { temp: 0, precipitation: 0, snow: 0, wind: 0 };
    let cnt = 0;

    for (let i = 0; i < waypoints.length; i += step) {
      const [lat, lon] = waypoints[i];
      const monthly = await fetchClimateNormals(lat, lon);
      const idx = monthly.time.findIndex(
        (t) => parseInt(t.split('-')[1], 10) === month
      );
      if (idx >= 0) {
        acc.temp          += (monthly.temperature_2m_mean[idx] || 0);
        acc.precipitation += (monthly.precipitation_sum[idx]   || 0);
        acc.snow          += (monthly.snowfall_sum[idx]        || 0);
        acc.wind          += (monthly.windspeed_10m_mean[idx]  || 0);
        cnt++;
      }
    }

    if (cnt === 0) throw new Error(`No climate data for month ${month}.`);
    return {
      temp:          acc.temp / cnt,
      precipitation: acc.precipitation / cnt,
      snow:          acc.snow / cnt,
      wind:          acc.wind / cnt
    };
  }

  window.getRouteClimate = getRouteClimate;
})(window);