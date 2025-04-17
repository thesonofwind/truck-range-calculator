// weather.js

(function(window) {
  /**
   * Compute weather impact multiplier from climate normals.
   * climate: {temp, precipitation, snow, wind}
   */
  function calculateWeatherImpact(climate) {
    const tempDeficit = Math.max(0, 20 - climate.temp);
    const tempFactor   = 1 + 0.005 * tempDeficit;
    const rainFactor   = 1 + 0.01 * (climate.precipitation / 10);
    const snowFactor   = 1 + 0.02 * (climate.snow / 10);
    const windFactor   = 1 + 0.01 * climate.wind;
    return tempFactor * rainFactor * snowFactor * windFactor;
  }

  window.calculateWeatherImpact = calculateWeatherImpact;
})(window);
