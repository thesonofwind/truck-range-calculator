// energy.js

(function(window) {
  // Haversine formula to compute distance between two [lat,lon] in meters
  function haversine(lat1, lon1, lat2, lon2) {
    const toRad = x => x * Math.PI / 180;
    const R = 6371000; // earth radius in m
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2)**2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  // Sum up segment distances
  function totalDistance(waypoints) {
    let d = 0;
    for (let i = 1; i < waypoints.length; i++) {
      d += haversine(
        waypoints[i-1][0], waypoints[i-1][1],
        waypoints[i][0],   waypoints[i][1]
      );
    }
    return d; // in meters
  }

  /**
   * Calculate energy consumption (Joules) for an EV truck over a route.
   *
   * @param {Array} waypoints  Array of [lat, lon] pairs.
   * @param {Array} elevations Array of elevations (m) at each waypoint.
   * @param {Object} opts      Optional parameters:
   *    mass               (kg) default 30000 :contentReference[oaicite:0]{index=0}
   *    rollingResistance  (unitless) Crr default 0.007 :contentReference[oaicite:1]{index=1}
   *    dragCoef           (unitless) Cd default 0.6 :contentReference[oaicite:2]{index=2}
   *    frontalArea        (m²) default 8
   *    airDensity         (kg/m³) default 1.225
   *    speed              (m/s) default 20 (≈ 72 km/h)
   *    drivetrainEff      (0–1) default 0.9
   *
   * @returns {Object} { Ejoules, distance_m, params }
   */
  function calculateEnergy(waypoints, elevations, opts={}) {
    const p = {
      mass: opts.mass             || 30000,
      g:    9.81,
      rollingResistance: opts.rollingResistance || 0.007,
      dragCoef:          opts.dragCoef          || 0.6,
      frontalArea:       opts.frontalArea       || 8,
      airDensity:        opts.airDensity        || 1.225,
      speed:             opts.speed             || 20,
      drivetrainEff:     opts.drivetrainEff     || 0.9
    };

    // 1) total distance
    const D = totalDistance(waypoints); // m

    // 2) elevation gain
    let gain = 0;
    for (let i = 1; i < elevations.length; i++) {
      const dH = elevations[i] - elevations[i-1];
      if (dH > 0) gain += dH;
    }

    // 3) potential energy: m * g * Δh
    const Egrav = p.mass * p.g * gain;

    // 4) rolling resistance: Crr * m * g * D
    const Eroll = p.rollingResistance * p.mass * p.g * D;

    // 5) aerodynamic drag: ½ * ρ * Cd * A * v² * D
    const Edrag = 0.5 * p.airDensity * p.dragCoef * p.frontalArea * (p.speed**2) * D;

    // 6) total, accounting for drivetrain efficiency
    const Etotal = (Egrav + Eroll + Edrag) / p.drivetrainEff;

    return {
      Ejoules:    Etotal,
      distance_m: D,
      params:     p
    };
  }

  // Expose globally
  window.calculateEnergy = calculateEnergy;

})(window);
