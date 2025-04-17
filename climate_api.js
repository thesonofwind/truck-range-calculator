// climate_api.js

(function(window) {
  /**
   * Fetch historical climate normals (1991-2020) for a coordinate
   * using Open-Meteo Climate API
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<Object>} {temp, precipitation, snow, wind}
   */
  async function fetchClimateNormals(lat, lon) {
    const url = `https://climate-api.open-meteo.com/v1/climate` +
                `?latitude=${lat}&longitude=${lon}` +
                `&start_year=1991&end_year=2020&monthly=true&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Climate API error: ${res.status}`);
    const data = await res.json();
    // data.monthly: array of 12: tavg, prcp_norm, snow_norm, wspd_norm
    const sum = data.monthly.reduce((acc, m) => ({
      temp: acc.temp + m.tavg,
      precipitation: acc.precipitation + m.prcp_norm,
      snow: acc.snow + m.snow_norm,
      wind: acc.wind + m.wspd_norm
    }), { temp: 0, precipitation: 0, snow: 0, wind: 0 });
    const count = data.monthly.length;
    return {
      temp: sum.temp / count,
      precipitation: sum.precipitation / count,
      snow: sum.snow / count,
      wind: sum.wind / count
    };
  }

  /**
   * Get average climate normals along a route by sampling waypoints
   * @param {Array} waypoints [[lat,lon],...]
   * @param {number} samples number of samples
   * @returns {Promise<Object>} {temp, precipitation, snow, wind}
   */
  async function getRouteClimate(waypoints, samples = 10) {
    const step = Math.max(1, Math.floor(waypoints.length / samples));
    let sum = { temp: 0, precipitation: 0, snow: 0, wind: 0 };
    let count = 0;
    for (let i = 0; i < waypoints.length; i += step) {
      const [lat, lon] = waypoints[i];
      const c = await fetchClimateNormals(lat, lon);
      sum.temp += c.temp;
      sum.precipitation += c.precipitation;
      sum.snow += c.snow;
      sum.wind += c.wind;
      count++;
    }
    return {
      temp: sum.temp / count,
      precipitation: sum.precipitation / count,
      snow: sum.snow / count,
      wind: sum.wind / count
    };
  }

  window.getRouteClimate = getRouteClimate;
})(window);
