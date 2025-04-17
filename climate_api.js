// climate_api.js

(function(window) {
  // Fetch daily data for one year+month using Open‑Meteo Archive API
  async function fetchYearMonth(lat, lon, year, month) {
    const mm    = String(month).padStart(2, '0');
    const start = `${year}-${mm}-01`;
    const end   = `${year}-${mm}-${new Date(year, month, 0).getDate()}`;
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
   * Compute 30‑year normals for a route+month.
   * waypoints: [[lat,lon],…], month:1–12, opts:{startYear,endYear,samples}
   */
  async function getRouteClimate(waypoints, month, opts={}) {
    const { startYear=1991, endYear=2020, samples=5 } = opts;
    const step = Math.max(1, Math.floor(waypoints.length / samples));
    const pts  = waypoints.filter((_,i) => i % step === 0);
    const years = endYear - startYear + 1;

    let sumT=0, cntT=0, sumPr=0, sumSn=0, sumW=0, cntW=0;

    for (const [lat,lon] of pts) {
      for (let y=startYear; y<=endYear; y++) {
        const data = await fetchYearMonth(lat, lon, y, month);
        // daily avg temp, precip, snow
        data.daily.time.forEach((_,i)=> {
          const tmax = data.daily.temperature_2m_max[i] || 0;
          const tmin = data.daily.temperature_2m_min[i] || 0;
          sumT += (tmax + tmin)/2; cntT++;
          sumPr += data.daily.precipitation_sum[i] || 0;
          sumSn += data.daily.snowfall_sum[i]     || 0;
        });
        // hourly wind
        data.hourly.time.forEach((ts,i)=>{
          const d = new Date(ts);
          if (d.getUTCMonth()+1 === month) {
            sumW += data.hourly.windspeed_10m[i] || 0;
            cntW++;
          }
        });
      }
    }

    if (!cntT) throw new Error(`No historical data for month ${month}`);
    return {
      temp:          sumT / cntT,
      precipitation: sumPr / (pts.length * years),
      snow:          sumSn / (pts.length * years),
      wind:          sumW / cntW
    };
  }

  window.getRouteClimate = getRouteClimate;
})(window);
