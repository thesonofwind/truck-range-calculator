import requests
import streamlit as st
import matplotlib.pyplot as plt

# Function to fetch waypoints along a route using OSRM
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

# Function to fetch elevation data using Open Elevation API via POST request
def get_elevation_open_elevation(waypoints):
    """
    Fetch elevation data for waypoints using Open Elevation API.
    Args:
        waypoints (list): List of waypoints [(lat, lon), ...].
    Returns:
        list: List of elevations in meters.
    """
    locations = [{"latitude": lat, "longitude": lon} for lat, lon in waypoints]
    url = "https://api.open-elevation.com/api/v1/lookup"
    response = requests.post(url, json={"locations": locations})
    if response.status_code == 200:
        data = response.json()
        return [result["elevation"] for result in data["results"]]
    else:
        raise Exception(f"Error fetching elevation from Open Elevation: {response.status_code}")

# Function to calculate total elevation gain and loss
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

# Function to plot the elevation profile
def plot_elevation_profile(elevations):
    """
    Plot elevation profile along the route.
    Args:
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
    st.pyplot(plt)

# Streamlit Interface
st.title("Route Elevation Analysis")

# User Inputs
start_lat = st.number_input("Start Latitude", value=37.7749)
start_lon = st.number_input("Start Longitude", value=-122.4194)
end_lat = st.number_input("End Latitude", value=34.0522)
end_lon = st.number_input("End Longitude", value=-118.2437)

if st.button("Analyze Route"):
    try:
        start_point = (start_lat, start_lon)
        end_point = (end_lat, end_lon)

        # Fetch waypoints
        waypoints = get_route_waypoints_osrm(start_point, end_point)
        st.write(f"Waypoints: {len(waypoints)} points fetched.")

        # Fetch elevation data
        elevations = get_elevation_open_elevation(waypoints)
        st.write(f"Elevations fetched for {len(elevations)} points.")

        # Calculate elevation gain and loss
        total_gain, total_loss = calculate_elevation_gain_loss(elevations)
        st.write(f"Total Elevation Gain: {total_gain:.2f} meters")
        st.write(f"Total Elevation Loss: {total_loss:.2f} meters")

        # Plot elevation profile
        st.subheader("Elevation Profile")
        plot_elevation_profile(elevations)

    except Exception as e:
        st.error(f"An error occurred: {e}")
