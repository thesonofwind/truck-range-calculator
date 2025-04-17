// climate_api.js

(function(window) {
  /**
   * Fetch daily data for one year and month at a point
   * using the Open-Meteo Archive API.
   */
  async function fetchYearMonth(lat, lon, year, month) {
    const mm = String(month).padStart(2, '0');
    const start = `${year}-${mm}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end   = `${year}-${mm}-${lastDay}`;

    const url =
      `https://archive-api.open-meteo.com/v1/archive?` +
      `latitude=${lat}&longitude=${lon}` +
      `&start_date=${start}&end_date=${end}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum` +
      `&hourly=windspeed_10m&timezone=UTC`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Archive API ${year}: ${res.status}`);
    return await res.json();
  }

  /**
   * Compute 30-year normals for a route and month.
   * waypoints: [[lat,lon], ...]
   * month: 1-12
   * opts: {startYear, endYear, samples}
   */
  async function getRouteClimate(waypoints, month, opts = {}) {
    const { startYear = 1991, endYear = 2020, samples = 5 } = opts;
    const step = Math.max(1, Math.floor(waypoints.length / samples));
    const pts = waypoints.filter((_, i) => i % step === 0);

    let sumTemp = 0, countTemp = 0;
    let sumPr  = 0, sumSnow = 0;
    let sumWind= 0, countWind = 0;
    const years = endYear - startYear + 1;

    for (const [lat, lon] of pts) {
      for (let y = startYear; y <= endYear; y++) {
        const data = await fetchYearMonth(lat, lon, y, month);
        // daily arrays
        data.daily.time.forEach((d, i) => {
          const tmax = data.daily.temperature_2m_max[i] || 0;
          const tmin = data.daily.temperature_2m_min[i] || 0;
          sumTemp += (tmax + tmin) / 2;
          countTemp++;
          sumPr   += data.daily.precipitation_sum[i] || 0;
          sumSnow += data.daily.snowfall_sum[i]     || 0;
        });
        // hourly wind
        data.hourly.time.forEach((ts, i) => {
          const date = new Date(ts);
          if (date.getUTCMonth()+1 === month) {
            sumWind += data.hourly.windspeed_10m[i] || 0;
            countWind++;
          }
        });
      }
    }

    if (countTemp === 0) throw new Error(`No data for month ${month}`);
    return {
      temp:          sumTemp / countTemp,
      precipitation: sumPr   / (pts.length * years),
      snow:          sumSnow / (pts.length * years),
      wind:          sumWind / countWind
    };
  }

  window.getRouteClimate = getRouteClimate;
})(window);