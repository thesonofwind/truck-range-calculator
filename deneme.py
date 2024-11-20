import requests

def get_route_waypoints_osrm(start, end):
    """
    Fetch waypoints along a route using OSRM.
    Args:
        start (tuple): Starting point (latitude, longitude).
        end (tuple): Ending point (latitude, longitude).
    Returns:
        list: List of waypoints [(lat, lon), ...].
    """
    start_coord = f"{start[1]},{start[0]}"  # lon,lat
    end_coord = f"{end[1]},{end[0]}"        # lon,lat
    url = f"http://router.project-osrm.org/route/v1/driving/{start_coord};{end_coord}?overview=full&geometries=geojson"
    
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        route = data["routes"][0]["geometry"]["coordinates"]
        return [(lat, lon) for lon, lat in route]  # Flip lon,lat to lat,lon
    else:
        raise Exception(f"Error fetching route from OSRM: {response.status_code}")

def get_elevation_open_elevation(waypoints):
    """
    Fetch elevation data for waypoints using Open Elevation API via POST request.
    Args:
        waypoints (list): List of waypoints [(lat, lon), ...].
    Returns:
        list: List of elevations in meters.
    """
    # Prepare the locations data
    locations = [{"latitude": lat, "longitude": lon} for lat, lon in waypoints]
    url = "https://api.open-elevation.com/api/v1/lookup"
    response = requests.post(url, json={"locations": locations})
    if response.status_code == 200:
        data = response.json()
        return [result["elevation"] for result in data["results"]]
    else:
        raise Exception(f"Error fetching elevation from Open Elevation: {response.status_code}")

# Example Usage
if __name__ == "__main__":
    start_point = (37.7749, -122.4194)  # San Francisco
    end_point = (34.0522, -118.2437)    # Los Angeles

    try:
        # Step 1: Get waypoints using OSRM
        waypoints = get_route_waypoints_osrm(start_point, end_point)
        print(f"Waypoints: {waypoints}...")  # Print the waypoints 

        # Step 2: Get elevation data for waypoints
        elevations = get_elevation_open_elevation(waypoints)
        print(f"Elevations: {elevations}...")  # Print the elevations 
    except Exception as e:
        print(f"Error: {e}")
def calculate_elevation_gain_loss(elevations):
    """
    Calculate total elevation gain and loss.
    Args:
        elevations (list): List of elevations in meters.
    Returns:
        tuple: (total_gain, total_loss) in meters.
    """
    total_gain = 0
    total_loss = 0
    for i in range(1, len(elevations)):
        diff = elevations[i] - elevations[i - 1]
        if diff > 0:
            total_gain += diff
        else:
            total_loss += abs(diff)
    return total_gain, total_loss

# Calculate and print gain/loss
total_gain, total_loss = calculate_elevation_gain_loss(elevations)
print(f"Total Elevation Gain: {total_gain:.2f} meters")
print(f"Total Elevation Loss: {total_loss:.2f} meters")

import matplotlib.pyplot as plt

# Plot the elevation profile
def plot_elevation_profile(waypoints, elevations):
    """
    Plot elevation profile along the route.
    Args:
        waypoints (list): List of waypoints [(lat, lon), ...].
        elevations (list): List of elevations corresponding to waypoints.
    """
    distances = list(range(len(elevations)))  # Simulated distances (e.g., index as step)
    plt.figure(figsize=(10, 5))
    plt.plot(distances, elevations, label="Elevation (m)", color="blue")
    plt.title("Elevation Profile Along the Route")
    plt.xlabel("Waypoint Index")
    plt.ylabel("Elevation (meters)")
    plt.grid(True)
    plt.legend()
    plt.show()

# Call the plotting function
plot_elevation_profile(waypoints, elevations)