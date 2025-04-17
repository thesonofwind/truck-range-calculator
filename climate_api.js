// climate_api.js

(function(window) {
  /**
   * Monthly variables to fetch from Open-Meteo Climate API
   */
  const monthlyVariables = [
    "temperature_2m_mean",
    "precipitation_sum",
    "snowfall_sum",
    "windspeed_10m_mean"
  ];

  /**
   * Fetch historical climate normals (1991–2020) for a single lat/lon.
   * Returns an array of 12 objects, one per month, each containing
   * fields: month, temperature_2m_mean, precipitation_sum,
   * snowfall_sum, windspeed_10m_mean
   */
  async function fetchClimateNormals(lat, lon) {
    const vars = monthlyVariables.join(",");
    const url =
      `https://climate-api.open-meteo.com/v1/climate` +
      `?latitude=${lat}&longitude=${lon}` +
      `&start_year=1991&end_year=2020` +
      `&monthly=${vars}` +
      `&timezone=UTC`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Climate API error: ${res.status}`);
    const data = await res.json();
    if (!data.monthly || !Array.isArray(data.monthly)) {
      throw new Error("Invalid climate data structure.");
    }
    return data.monthly;
  }

  /**
   * Compute average normals for the route and selected month.
   * waypoints: Array of [lat, lon]
   * month:      Integer 1–12
   * Returns:    {temp, precipitation, snow, wind}
   */
  async function getRouteClimate(waypoints, month) {
    // Sample up to 5 points along route
    const samples = Math.min(5, waypoints.length);
    const step = Math.floor(waypoints.length / samples) || 1;
    let acc = { temp: 0, precipitation: 0, snow: 0, wind: 0 };
    let cnt = 0;

    for (let i = 0; i < waypoints.length; i += step) {
      const [lat, lon] = waypoints[i];
      const monthly = await fetchClimateNormals(lat, lon);
      const entry = monthly.find(m => m.month === month);
      if (entry) {
        acc.temp          += entry.temperature_2m_mean || 0;
        acc.precipitation += entry.precipitation_sum  || 0;
        acc.snow          += entry.snowfall_sum       || 0;
        acc.wind          += entry.windspeed_10m_mean || 0;
        cnt++;
      }
    }

    if (cnt === 0) throw new Error("No climate data for selected month.");
    return {
      temp:          acc.temp / cnt,
      precipitation: acc.precipitation / cnt,
      snow:          acc.snow / cnt,
      wind:          acc.wind / cnt
    };
  }

  window.getRouteClimate = getRouteClimate;
})(window);

=== index.html ===
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Route Elevation & Energy Analysis</title>
  <link rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    body { font-family: sans-serif; max-width: 900px; margin: auto; padding: 1em; }
    #map { width: 100%; height: 400px; margin-bottom: 1em; }
    fieldset { border:1px solid #ccc; padding:0.8em; margin-top:1em; }
    legend { font-weight: bold; }
    form div { margin-bottom: 0.8em; }
    label { display:inline-block; width:180px; vertical-align: top; }
    input, select { width:120px; }
    #results p { margin:0.2em 0; }
    #elevationChart { margin-top:1em; }
  </style>
</head>
<body>
  <h1>Route Elevation & Energy Analysis</h1>

  <div id="map"></div>
  <div>
    <label><input type="radio" name="mode" value="start" checked /> Start</label>
    <label><input type="radio" name="mode" value="end" /> End</label>
  </div>

  <form id="route-form">
    <fieldset>
      <legend>Route Coordinates</legend>
      <div><label for="start-lat">Start Latitude:</label>
        <input id="start-lat" type="number" step="any" value="37.7749" /></div>
      <div><label for="start-lon">Start Longitude:</label>
        <input id="start-lon" type="number" step="any" value="-122.4194" /></div>
      <div><label for="end-lat">End Latitude:</label>
        <input id="end-lat" type="number" step="any" value="34.0522" /></div>
      <div><label for="end-lon">End Longitude:</label>
        <input id="end-lon" type="number" step="any" value="-118.2437" /></div>
    </fieldset>

    <fieldset>
      <legend>Weather Settings</legend>
      <div><label for="month">Month:</label>
        <select id="month">
          <option value="1">January</option>
          <option value="2">February</option>
          <option value="3">March</option>
          <option value="4">April</option>
          <option value="5">May</option>
          <option value="6">June</option>
          <option value="7">July</option>
          <option value="8">August</option>
          <option value="9">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
      </div>
    </fieldset>

    <fieldset>
      <legend>Truck & Energy Parameters</legend>
      <div><label for="mass">Mass (kg):</label>
        <input id="mass" type="number" step="1" value="30000" /></div>
      <div>
