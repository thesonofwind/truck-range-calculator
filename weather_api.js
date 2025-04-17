// weather_api.js

(function(window) {
  /**
   * Fetch current weather from OpenWeatherMap for a given coordinate
   * @param {number} lat - latitude
   * @param {number} lon - longitude
   * @param {string} apiKey - your OpenWeatherMap API key
   * @returns {Promise<Object>} weather data with temp, rain, snow, wind
   */
  async function fetchWeather(lat, lon, apiKey) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}` +
                `&units=metric&appid=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
    const data = await res.json();
    return {
      temp: data.main.temp,
      precipitation: data.rain?.['1h'] || 0,
      snow: data.snow?.['1h'] || 0,
      wind: data.wind.speed
    };
  }

  /**
   * Get average weather along route by sampling waypoints
   * @param {Array} waypoints [[lat,lon],...]
   * @param {string} apiKey
   * @param {number} samples - number of samples (default 10)
   * @returns {Promise<Object>} averaged weather
   */
  async function getRouteWeather(waypoints, apiKey, samples = 10) {
    const step = Math.max(1, Math.floor(waypoints.length / samples));
    let sum = { temp: 0, precipitation: 0, snow: 0, wind: 0 };
    let count = 0;
    for (let i = 0; i < waypoints.length; i += step) {
      const [lat, lon] = waypoints[i];
      const w = await fetchWeather(lat, lon, apiKey);
      sum.temp += w.temp;
      sum.precipitation += w.precipitation;
      sum.snow += w.snow;
      sum.wind += w.wind;
      count++;
    }
    return {
      temp: sum.temp / count,
      precipitation: sum.precipitation / count,
      snow: sum.snow / count,
      wind: sum.wind / count
    };
  }

  window.getRouteWeather = getRouteWeather;
})(window);
