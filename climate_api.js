// climate_api.js

(function(window) {
  /**
   * Fetch historical climate normals (1991-2020) for a coordinate
   * using Open-Meteo Climate API
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<Object>} {temp, precipitation, snow, wind}
   */
  async function fetchClimateNormals(lat, lon) {
    const url = `https://climate-api.open-meteo.com/v1/climate` +
                `?latitude=${lat}&longitude=${lon}` +
                `&start_year=1991&end_year=2020&monthly=true&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Climate API error: ${res.status}`);
    const data = await res.json();
    // Guard against missing monthly field
    if (!Array.isArray(data.monthly) || data.monthly.length === 0) {
      throw new Error('Climate API returned no monthly data for the given location.');
    }
    // Sum and average monthly normals
    const sum = data.monthly.reduce((acc, m) => ({
      temp: acc.temp + (m.tavg ?? 0),
      precipitation: acc.precipitation + (m.prcp_norm ?? 0),
      snow: acc.snow + (m.snow_norm ?? 0),
      wind: acc.wind + (m.wspd_norm ?? 0)
    }), { temp: 0, precipitation: 0, snow: 0, wind: 0 });
    const count = data.monthly.length;
    return {
      temp: sum.temp / count,
      precipitation: sum.precipitation / count,
      snow: sum.snow / count,
      wind: sum.wind / count
    };
  }

  /**
   * Get average climate normals along a route by sampling waypoints
   * @param {Array} waypoints [[lat,lon],...]
   * @param {number} samples number of samples
   * @returns {Promise<Object>} {temp, precipitation, snow, wind}
   */
  async function getRouteClimate(waypoints, samples = 10) {
    const step = Math.max(1, Math.floor(waypoints.length / samples));
    let sum = { temp: 0, precipitation: 0, snow: 0, wind: 0 };
    let count = 0;
    for (let i = 0; i < waypoints.length; i += step) {
      const [lat, lon] = waypoints[i];
      const c = await fetchClimateNormals(lat, lon);
      sum.temp += c.temp;
      sum.precipitation += c.precipitation;
      sum.snow += c.snow;
      sum.wind += c.wind;
      count++;
    }
    if (count === 0) throw new Error('No valid waypoints to sample climate data.');
    return {
      temp: sum.temp / count,
      precipitation: sum.precipitation / count,
      snow: sum.snow / count,
      wind: sum.wind / count
    };
  }

  window.getRouteClimate = getRouteClimate;
})(window);

=== index.html ===
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Route Elevation & Energy Analysis</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    body { font-family: sans-serif; max-width: 900px; margin: auto; padding: 1em; }
    #map { width: 100%; height: 400px; margin-bottom: 1em; }
    fieldset { border: 1px solid #ccc; padding: 0.8em; margin-top: 1em; }
    legend { font-weight: bold; }
    form div { margin-bottom: 0.8em; }
    label { display: inline-block; width: 180px; }
    input[type="number"] { width: 120px; }
    #results p { margin: 0.2em 0; }
    #elevationChart { margin-top: 1em; }
  </style>
</head>
<body>
  <h1>Route Elevation & Energy Analysis</h1>

  <!-- Map and mode selector -->
  <div id="map"></div>
  <div>
    <label><input type="radio" name="mode" value="start" checked> Select Start</label>
    <label><input type="radio" name="mode" value="end"> Select End</label>
  </div>

  <!-- Form for inputs -->
  <form id="route-form">
    <fieldset>
      <legend>Route Coordinates</legend>
      <div>
        <label for="start-lat">Start Latitude:</label>
        <input id="start-lat" name="start-lat" type="number" step="any" value="37.7749">
      </div>
      <div>
        <label for="start-lon">Start Longitude:</label>
        <input id="start-lon" name="start-lon" type="number" step="any" value="-122.4194">
      </div>
      <div>
        <label for="end-lat">End Latitude:</label>
        <input id="end-lat" name="end-lat" type="number" step="any" value="34.0522">
      </div>
      <div>
        <label for="end-lon">End Longitude:</label>
        <input id="end-lon" name="end-lon" type="number" step="any" value="-118.2437">
      </div>
    </fieldset>

    <fieldset>
      <legend>Truck Energy Parameters</legend>
      <div>
        <label for="mass">Mass (kg):</label>
        <input id="mass" name="mass" type="number" step="1" value="30000">
      </div>
      <div>
        <label for="speed_kmh">Speed (km/h):</label>
        <input id="speed_kmh" name="speed_kmh" type="number" step="0.1" value="72">
        <small>(converted internally to m/s)</small>
      </div>
      <div>
        <label for="Crr">Rolling Resistance (Crr):</label>
        <input id="Crr" name="Crr" type="number" step="0.001" value="0.007">
      </div>
      <div>
        <label for="Cd">Drag Coefficient (Cd):</label>
        <input id="Cd" name="Cd" type="number" step="0.01" value="0.6">
      </div>
      <div>
        <label for="A">Frontal Area (m²):</label>
        <input id="A" name="A" type="number" step="0.1" value="8">
      </div>
      <div>
        <label for="rho">Air Density (kg/m³):</label>
        <input id="rho" name="rho" type="number" step="0.01" value="1.225">
      </div>
      <div>
        <label for="eff">Drivetrain Eff. (0–1):</label>
        <input id="eff" name="eff" type="number" step="0.01" value="0.9">
      </div>
      <div>
        <label for="regenEff">Regen Eff. (0–1):</label>
        <input id="regenEff" name="regenEff" type="number" step="0.01" value="0.6">
      </div>
    </fieldset>

    <button type="submit">Analyze Route & Energy</button>
  </form>

  <!-- Results and chart -->
  <div id="results"></div>
  <canvas id="elevationChart" width="800" height="400"></canvas>

  <!-- External JS libraries -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <!-- Project JS modules -->
  <script src="energy.js"></script>
  <script src="weather.js"></script>
  <script src="climate_api.js"></script>

  <script>
    // Initialize Leaflet map
    const map = L.map('map').setView([37.7749, -122.4194], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let startMarker, endMarker, routeLine;

    // Map click handler to set start/end
    map.on('click', e => {
      const { lat, lng } = e.latlng;
      const mode = document.querySelector('input[name="mode"]:checked').value;
      if (mode === 'start') {
        if (startMarker) map.removeLayer(startMarker);
        startMarker = L.marker([lat, lng]).addTo(map).bindPopup('Start').openPopup();
        document.getElementById('start-lat').value = lat.toFixed(6);
        document.getElementById('start-lon').value = lng.toFixed(6);
      } else {
        if (endMarker) map.removeLayer(endMarker);
        endMarker = L.marker([lat, lng]).addTo(map).bindPopup('End').openPopup();
        document.getElementById('end-lat').value = lat.toFixed(6);
        document.getElementById('end-lon').value = lng.toFixed(6);
      }
    });

    // Fetch route geometry, elevations, calculate energy & climate
    document.getElementById('route-form').addEventListener('submit', async e => {
      e.preventDefault();
      const sLat = +e.target['start-lat'].value;
      const sLon = +e.target['start-lon'].value;
      const eLat = +e.target['end-lat'].value;
      const eLon = +e.target['end-lon'].value;
      const params = {
        mass: +e.target['mass'].value,
        speed_kmh: +e.target['speed_kmh'].value,
        Crr: +e.target['Crr'].value,
        Cd: +e.target['Cd'].value,
        A: +e.target['A'].value,
        rho: +e.target['rho'].value,
        eff: +e.target['eff'].value,
        regenEff: +e.target['regenEff'].value
      };
      const out = document.getElementById('results');
      out.innerHTML = '<p>Calculating…</p>';

      try {
        // 1. Route waypoints
        const waypoints = await (async (lat1, lon1, lat2, lon2) => {
          const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`OSRM error: ${res.status}`);
          const data = await res.json();
          return data.routes[0].geometry.coordinates.map(pt => [pt[1], pt[0]]);
        })(sLat, sLon, eLat, eLon);

        // Draw polyline
        if (routeLine) map.removeLayer(routeLine);
        routeLine = L.polyline(waypoints, { color: 'blue', weight: 4 }).addTo(map);
        map.fitBounds(routeLine.getBounds());

        // 2. Elevations
        const elevations = await (async wpts => {
          const locs = wpts.map(([lat,lon]) => ({ latitude: lat, longitude: lon }));
          const r = await fetch('https://api.open-elevation.com/api/v1/lookup', {
            method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ locations: locs })
          });
          if (!r.ok) throw new Error(`Elevation API error: ${r.status}`);
          const d = await r.json();
          return d.results.map(r => r.elevation);
        })(waypoints);

        // Display route and elevation stats
        const { gain, loss } = (() => {
          let g=0,l=0;
          for(let i=1;i<elevations.length;i++){
            const d=elevations[i]-elevations[i-1]; if(d>0) g+=d; else l+=Math.abs(d);
          }
          return { gain:g, loss:l };
        })();
        out.innerHTML = `<p>Waypoints: ${waypoints.length}</p>` +
                        `<p>Elevations: ${elevations.length}</p>` +
                        `<p>Gain: ${gain.toFixed(1)} m, Loss: ${loss.toFixed(1)} m</p>`;

        // 3. Base energy
        const base = calculateEnergy(waypoints, elevations, params);

        // 4. Climate normals
        const climate = await getRouteClimate(waypoints);
        out.innerHTML += `<p>Avg Temp: ${climate.temp.toFixed(1)} °C, Precip: ${climate.precipitation.toFixed(1)} mm, Snow: ${climate.snow.toFixed(1)} mm, Wind: ${climate.wind.toFixed(1)} m/s</p>`;

        // 5. Weather-adjusted energy
        const factor = calculateWeatherImpact(climate);
        const adjustedJ = base.Ejoules * factor;
        const totalkWh = adjustedJ / 3.6e6;
        const distKm = base.distance_m / 1000;
        const cpkm = (totalkWh / distKm).toFixed(3);

        out.innerHTML += `<p>Climate-Adjusted Energy: ${totalkWh.toFixed(2)} kWh</p>` +
                         `<p><strong>Consumption:</strong> ${cpkm} kWh/km</p>`;

        // 6. Plot elevation
        (function(elevs){
          const ctx = document.getElementById('elevationChart').getContext('2d');
          const labels = elevs.map((_,i)=>i);
          if(chart) chart.destroy();
          chart = new Chart(ctx, { type:'line', data:{ labels, datasets:[{ label:'Elevation (m)', data:elevs, fill:false, tension:0.1 }]}, options:{ scales:{ x:{ title:{ display:true, text:'Waypoint Index'} }, y:{ title:{ display:true, text:'Elevation (m')} } } } });
        })(elevations);

      } catch(err) {
        out.innerHTML = `<p style="color:red">Error: ${err.message}</p>`;
        console.error(err);
      }
    });
  </script>
</body>
</html>
