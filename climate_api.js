// climate_api.js

(function(window) {
  // Static seasonal fallback data
  const seasonalData = {
    Winter: { temp: -2, precipitation: 60, snow: 30, wind: 6 },
    Spring: { temp: 10, precipitation: 55, snow: 5,  wind: 5 },
    Summer: { temp: 22, precipitation: 40, snow: 0,  wind: 4 },
    Autumn: { temp:  8, precipitation: 70, snow: 10, wind: 5 }
  };

  // Fetch climate normals via Open-Meteo Climate API
  async function fetchClimateNormals(lat, lon) {
    const url =
      `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}` +
      `&start_year=1991&end_year=2020&monthly=true&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Climate API error: ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data.monthly) || data.monthly.length === 0) {
      throw new Error("Climate API returned no monthly data.");
    }

    const sum = data.monthly.reduce((acc, m) => ({
      temp:           acc.temp           + (m.temperature_2m_mean   || 0),
      precipitation:  acc.precipitation  + (m.precipitation_sum     || 0),
      snow:           acc.snow           + (m.snowfall_sum          || 0),
      wind:           acc.wind           + (m.windspeed_10m_mean    || 0)
    }), { temp:0, precipitation:0, snow:0, wind:0 });

    const count = data.monthly.length;
    return {
      temp:          sum.temp          / count,
      precipitation: sum.precipitation / count,
      snow:          sum.snow          / count,
      wind:          sum.wind          / count
    };
  }

  /**
   * Get route climate normals; fallback to seasonalData if API fails or season specified
   * waypoints: array of [lat, lon]
   * season: one of Winter, Spring, Summer, Autumn (optional)
   * samples: number of points to sample along route
   */
  async function getRouteClimate(waypoints, season=null, samples=10) {
    // If season selected, use static data
    if (season && seasonalData[season]) {
      return seasonalData[season];
    }

    // Otherwise attempt API, fallback on error
    try {
      const step = Math.max(1, Math.floor(waypoints.length / samples));
      let acc = { temp:0, precipitation:0, snow:0, wind:0 };
      let cnt = 0;
      for (let i=0; i<waypoints.length; i+=step) {
        const [lat, lon] = waypoints[i];
        const c = await fetchClimateNormals(lat, lon);
        acc.temp           += c.temp;
        acc.precipitation  += c.precipitation;
        acc.snow           += c.snow;
        acc.wind           += c.wind;
        cnt++;
      }
      if (cnt===0) throw new Error('No climate samples');
      return {
        temp:          acc.temp/cnt,
        precipitation: acc.precipitation/cnt,
        snow:          acc.snow/cnt,
        wind:          acc.wind/cnt
      };
    } catch(err) {
      console.warn('Climate API failed, using seasonal fallback', err);
      // If fallback season or average of all
      if (seasonalData[season]) return seasonalData[season];
      const all = Object.values(seasonalData);
      const sum = all.reduce((a,c)=>({
        temp: a.temp+c.temp,
        precipitation: a.precipitation+c.precipitation,
        snow: a.snow+c.snow,
        wind: a.wind+c.wind
      }), { temp:0, precipitation:0, snow:0, wind:0 });
      const n = all.length;
      return { temp:sum.temp/n, precipitation:sum.precipitation/n, snow:sum.snow/n, wind:sum.wind/n };
    }
  }

  window.getRouteClimate = getRouteClimate;
  window.getSeasonalWeather = season => seasonalData[season] || null;
})(window);