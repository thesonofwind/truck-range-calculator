// weather.js

(function(window) {
  /**
   * Calculate weather impact multiplier from climate normals.
   * climate: {temp, precipitation, snow, wind}
   */
  function calculateWeatherImpact(climate) {
    const tempDeficit = Math.max(0, 20 - climate.temp);
    const tempFactor   = 1 + tempDeficit * 0.005;
    const rainFactor   = 1 + (climate.precipitation / 10) * 0.01;
    const snowFactor   = 1 + (climate.snow / 10) * 0.02;
    const windFactor   = 1 + climate.wind * 0.01;
    return tempFactor * rainFactor * snowFactor * windFactor;
  }

  window.calculateWeatherImpact = calculateWeatherImpact;
})(window);
