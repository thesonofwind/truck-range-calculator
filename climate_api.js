// climate_api.js

(function(window) {
  /**
   * Fetch climate normals (1991‑2020) for a single lat/lon.
   * Returns {temp, precipitation, snow, wind}
   */
  async function fetchClimateNormals(lat, lon) {
    const url =
      `https://climate-api.open-meteo.com/v1/climate` +
      `?latitude=${lat}&longitude=${lon}` +
      `&start_year=1991&end_year=2020&monthly=true&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Climate API error: ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data.monthly) || data.monthly.length === 0) {
      throw new Error("No monthly climate data returned.");
    }

    const sum = data.monthly.reduce(
      (acc, m) => ({
        temp: acc.temp + (m.tavg || 0),
        precipitation: acc.precipitation + (m.prcp_norm || 0),
        snow: acc.snow + (m.snow_norm || 0),
        wind: acc.wind + (m.wspd_norm || 0)
      }),
      { temp: 0, precipitation: 0, snow: 0, wind: 0 }
    );

    const count = data.monthly.length;
    return {
      temp: sum.temp / count,
      precipitation: sum.precipitation / count,
      snow: sum.snow / count,
      wind: sum.wind / count
    };
  }

  /**
   * Sample N points along the route and average their normals.
   */
  async function getRouteClimate(waypoints, samples = 10) {
    const step = Math.max(1, Math.floor(waypoints.length / samples));
    let acc = { temp: 0, precipitation: 0, snow: 0, wind: 0 };
    let cnt = 0;

    for (let i = 0; i < waypoints.length; i += step) {
      const [lat, lon] = waypoints[i];
      const c = await fetchClimateNormals(lat, lon);
      acc.temp += c.temp;
      acc.precipitation += c.precipitation;
      acc.snow += c.snow;
      acc.wind += c.wind;
      cnt++;
    }

    if (cnt === 0) throw new Error("No samples for climate.");
    return {
      temp: acc.temp / cnt,
      precipitation: acc.precipitation / cnt,
      snow: acc.snow / cnt,
      wind: acc.wind / cnt
    };
  }

  window.getRouteClimate = getRouteClimate;
})(window);
