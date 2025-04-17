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

  // Total distance (m) along waypoints
  function totalDistance(waypoints) {
    let d = 0;
    for (let i = 1; i < waypoints.length; i++) {
      d += haversine(
        waypoints[i-1][0], waypoints[i-1][1],
        waypoints[i][0],   waypoints[i][1]
      );
    }
    return d;
  }

  /**
   * Calculate energy consumption (Joules) for an EV truck over a route,
   * including regenerative braking recovery.
   *
   * @param {Array} waypoints       Array of [lat, lon] pairs.
   * @param {Array} elevations      Array of elevations (m) at each waypoint.
   * @param {Object} opts           Optional parameters:
   *    mass (kg), speed_kmh (km/h), Crr, Cd, A, rho, eff, regenEff
   *    defaults: mass=30000, speed_kmh=72, Crr=0.007, Cd=0.6, A=8,
   *              rho=1.225, eff=0.9, regenEff=0.6
   * @returns {Object} {
   *    Ejoules: total Joules consumed,
   *    distance_m: total route length (m),
   *    kWh_per_km: consumption in kWh/km,
   *    params: used parameters
   * }
   */
  function calculateEnergy(waypoints, elevations, opts = {}) {
    const p = {
      mass: opts.mass || 30000,
      g: 9.81,
      Crr: opts.Crr || 0.007,
      Cd: opts.Cd || 0.6,
      A: opts.A || 8,
      rho: opts.rho || 1.225,
      speed: ((opts.speed_kmh || 72) / 3.6), // km/h to m/s
      eff: opts.eff || 0.9,
      regenEff: opts.regenEff != null ? opts.regenEff : 0.6
    };

    // distance
    const D = totalDistance(waypoints);

    // elevation gain & loss
    let gain = 0, loss = 0;
    for (let i = 1; i < elevations.length; i++) {
      const dH = elevations[i] - elevations[i-1];
      if (dH > 0) gain += dH;
      else loss += Math.abs(dH);
    }

    // gravitational term net of regen
    const Egrav = p.mass * p.g * (gain - p.regenEff * loss);
    // rolling resistance
    const Eroll = p.Crr * p.mass * p.g * D;
    // aerodynamic drag
    const Edrag = 0.5 * p.rho * p.Cd * p.A * p.speed**2 * D;
    // total with drivetrain efficiency
    const Etotal = (Egrav + Eroll + Edrag) / p.eff;

    // kWh per km
    const kWh = Etotal / 3.6e6;
    const km = D / 1000;
    const kWhpkm = kWh / km;

    return {
      Ejoules: Etotal,
      distance_m: D,
      kWh_per_km: kWhpkm,
      params: p
    };
  }

  window.calculateEnergy = calculateEnergy;
})(window);
