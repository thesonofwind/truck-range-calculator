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
        raise Exception("Error fetching route from OSRM.")

def get_elevation_open_elevation(waypoints):
    """
    Fetch elevation data for waypoints using Open Elevation API.
    Args:
        waypoints (list): List of waypoints [(lat, lon), ...].
    Returns:
        list: List of elevations in meters.
    """
    elevations = []
    for lat, lon in waypoints:
        url = f"https://api.open-elevation.com/api/v1/lookup?locations={lat},{lon}"
        response = requests.get(url)
        if response.status_code == 200:
            elevation = response.json()["results"][0]["elevation"]
            elevations.append(elevation)
        else:
            raise Exception("Error fetching elevation from Open Elevation.")
    return elevations

# Example Usage
if __name__ == "__main__":
    start_point = (37.7749, -122.4194)  # San Francisco
    end_point = (34.0522, -118.2437)    # Los Angeles

    try:
        # Get waypoints using OSRM
        waypoints = get_route_waypoints_osrm(start_point, end_point)
        print(f"Waypoints: {waypoints}")

        # Get elevation data for waypoints
        elevations = get_elevation_open_elevation(waypoints)
        print(f"Elevations: {elevations}")
    except Exception as e:
        print(f"Error: {e}")
