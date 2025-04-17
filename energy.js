// energy.js

(function(window) {
  // Haversine formula: distance (m) between two lat/lon points
  function haversine(lat1, lon1, lat2, lon2) {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  // Sum total distance (m)
  function totalDistance(waypoints) {
    let dist = 0;
    for (let i = 1; i < waypoints.length; i++) {
      dist += haversine(
        waypoints[i-1][0], waypoints[i-1][1],
        waypoints[i][0],   waypoints[i][1]
      );
    }
    return dist;
  }

  /**
   * Calculate base energy (J) without weather.
   * opts: {mass, speed_kmh, Crr, Cd, A, rho, eff, regenEff}
   */
  function calculateEnergy(waypoints, elevations, opts={}) {
    const p = {
      mass: opts.mass || 30000,
      g: 9.81,
      Crr: opts.Crr || 0.007,
      Cd: opts.Cd || 0.6,
      A: opts.A || 8,
      rho: opts.rho || 1.225,
      speed: (opts.speed_kmh || 72) / 3.6,
      eff: opts.eff || 0.9,
      regenEff: opts.regenEff != null ? opts.regenEff : 0.6
    };

    const D = totalDistance(waypoints);
    let gain = 0, loss = 0;
    for (let i = 1; i < elevations.length; i++) {
      const dH = elevations[i] - elevations[i-1];
      if (dH > 0) gain += dH;
      else loss += Math.abs(dH);
    }

    const Egrav = p.mass * p.g * (gain - p.regenEff * loss);
    const Eroll = p.Crr * p.mass * p.g * D;
    const Edrag = 0.5 * p.rho * p.Cd * p.A * p.speed**2 * D;
    const Etotal = (Egrav + Eroll + Edrag) / p.eff;

    const kWh = Etotal / 3.6e6;
    const km = D / 1000;
    const kWhPerKm = kWh / km;

    return { Ejoules: Etotal, distance_m: D, kWh_per_km: kWhPerKm };
  }

  window.calculateEnergy = calculateEnergy;
})(window);