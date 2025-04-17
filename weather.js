// weather.js

(function(window) {
  // Seasonal average weather data
  const seasonalData = {
    Winter: { temp: -5, precipitation: 50, snow: 30, wind: 5 },
    Spring: { temp: 10, precipitation: 60, snow: 5, wind: 4 },
    Summer: { temp: 25, precipitation: 40, snow: 0, wind: 3 },
    Autumn: { temp: 15, precipitation: 70, snow: 10, wind: 4 }
  };

  /**
   * Return average weather stats for a given season.
   */
  function getSeasonalWeather(season) {
    return seasonalData[season] || seasonalData['Summer'];
  }

  /**
   * Calculate multiplicative impact factor from weather.
   * - Colder temp reduces battery efficiency: +0.5% per °C below 20
   * - Rain increases rolling resistance: +1% per 10 mm
   * - Snow increases rolling resistance: +2% per 10 mm
   * - Wind increases drag: +1% per 1 m/s
   */
  function calculateWeatherImpact(weather) {
    const tempDeficit = Math.max(0, 20 - weather.temp);
    const tempFactor = 1 + tempDeficit * 0.005;
    const rainFactor = 1 + (weather.precipitation / 10) * 0.01;
    const snowFactor = 1 + (weather.snow / 10) * 0.02;
    const windFactor = 1 + weather.wind * 0.01;
    return tempFactor * rainFactor * snowFactor * windFactor;
  }

  window.getSeasonalWeather = getSeasonalWeather;
  window.calculateWeatherImpact = calculateWeatherImpact;
})(window);
