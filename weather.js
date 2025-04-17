// weather.js

(function(window) {
  /**
   * Calculate weather impact factor based on averaged climate normals
   * @param {Object} climate {temp, precipitation, snow, wind}
   * @returns {number} factor to multiply base energy by
   */
  function calculateWeatherImpact(climate) {
    // Temperature: deficit below 20°C increases consumption
    const tempDeficit = Math.max(0, 20 - climate.temp);
    const tempFactor = 1 + tempDeficit * 0.005;
    // Precipitation and snow increase rolling resistance
    const rainFactor = 1 + (climate.precipitation / 10) * 0.01;
    const snowFactor = 1 + (climate.snow / 10) * 0.02;
    // Wind adds to aerodynamic drag
    const windFactor = 1 + climate.wind * 0.01;
    return tempFactor * rainFactor * snowFactor * windFactor;
  }

  window.calculateWeatherImpact = calculateWeatherImpact;
})(window);
