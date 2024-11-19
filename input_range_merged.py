import streamlit as st
import matplotlib.pyplot as plt

# Function to calculate truck range
def calculate_truck_range(
    battery_capacity=500,  # kWh
    base_consumption=1.2,  # kWh/km
    route_distance=100,  # km
    payload_weight=20,  # tons
    elevation_gain=500,  # meters
    elevation_loss=300,  # meters
    regen_efficiency=0.7,  # Fraction
    aux_power=10,  # kWh
    wind_adjustment=5,  # kWh
    temp_adjustment=5,  # kWh,
    truck_empty_weight=10  # tons
):
    base_energy = base_consumption * route_distance
    payload_energy = payload_weight * 0.02 * route_distance
    total_weight_kg = (payload_weight + truck_empty_weight) * 1000
    uphill_energy = elevation_gain * 9.81 * total_weight_kg / 3.6e6
    downhill_recovery = elevation_loss * 9.81 * total_weight_kg * regen_efficiency / 3.6e6
    environmental_adjustment = wind_adjustment + temp_adjustment
    total_energy_consumption = (
        base_energy + payload_energy + uphill_energy - downhill_recovery
        + aux_power + environmental_adjustment
    )
    return battery_capacity / total_energy_consumption * route_distance


# Function to plot range vs. elevation delta
def plot_range_vs_elevation_delta(
    battery_capacity=500,  # kWh
    base_consumption=1.2,  # kWh/km
    route_distance=100,  # km
    payload_weight=20,  # tons
    regen_efficiency=0.7,  # Fraction
    aux_power=10,  # kWh
    wind_adjustment=5,  # kWh
    temp_adjustment=5,  # kWh,
    truck_empty_weight=10  # tons
):
    # Delta elevation range (-500 to +500 meters with step size of 10 meters)
    min_delta_elevation = -500
    max_delta_elevation = 500
    step = 10

    delta_elevations = range(min_delta_elevation, max_delta_elevation + step, step)
    ranges = []

    for delta_elevation in delta_elevations:
        elevation_gain = max(delta_elevation, 0)
        elevation_loss = -min(delta_elevation, 0)
        estimated_range = calculate_truck_range(
            battery_capacity=battery_capacity,
            base_consumption=base_consumption,
            route_distance=route_distance,
            payload_weight=payload_weight,
            elevation_gain=elevation_gain,
            elevation_loss=elevation_loss,
            regen_efficiency=regen_efficiency,
            aux_power=aux_power,
            wind_adjustment=wind_adjustment,
            temp_adjustment=temp_adjustment,
            truck_empty_weight=truck_empty_weight,
        )
        ranges.append(estimated_range)
    
    # Plotting the results
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(delta_elevations, ranges, label="Estimated Range", marker="o")
    ax.axvline(0, color="gray", linestyle="--", label="No Elevation Change")
    ax.set_title("Estimated Range vs. Delta Elevation")
    ax.set_xlabel("Delta Elevation (m) [Gain - Loss]")
    ax.set_ylabel("Estimated Range (km)")
    ax.grid(True)
    ax.legend()
    st.pyplot(fig)


# Streamlit App
st.title("Truck Range Calculator")

# Sidebar Navigation
mode = st.sidebar.selectbox(
    "Choose Mode",
    ("Manual Input Mode", "Plotting Mode")
)

# Inputs for manual calculation (shared by both modes)
st.sidebar.header("Manual Inputs")
battery_capacity = st.sidebar.number_input("Battery Capacity (kWh)", value=500.0, step=10.0)
base_consumption = st.sidebar.number_input("Base Consumption (kWh/km)", value=1.2, step=0.1)
route_distance = st.sidebar.number_input("Route Distance (km)", value=100.0, step=10.0)
payload_weight = st.sidebar.number_input("Payload Weight (tons)", value=20.0, step=1.0)
regen_efficiency = st.sidebar.number_input("Regenerative Efficiency (fraction)", value=0.7, step=0.05)
aux_power = st.sidebar.number_input("Auxiliary Power Usage (kWh)", value=10.0, step=1.0)
wind_adjustment = st.sidebar.number_input("Wind Adjustment (kWh)", value=5.0, step=1.0)
temp_adjustment = st.sidebar.number_input("Temperature Adjustment (kWh)", value=5.0, step=1.0)
truck_empty_weight = st.sidebar.number_input("Truck Empty Weight (tons)", value=10.0, step=1.0)

if mode == "Manual Input Mode":
    st.header("Manual Input Mode")
    elevation_gain = st.number_input("Elevation Gain (meters)", value=500.0, step=50.0)
    elevation_loss = st.number_input("Elevation Loss (meters)", value=300.0, step=50.0)

    if st.button("Calculate Range"):
        range_km = calculate_truck_range(
            battery_capacity, base_consumption, route_distance, payload_weight,
            elevation_gain, elevation_loss, regen_efficiency, aux_power,
            wind_adjustment, temp_adjustment, truck_empty_weight
        )
        st.success(f"Estimated range of the truck: {range_km:.2f} km")

elif mode == "Plotting Mode":
    st.header("Plotting Mode")
    st.write("This mode visualizes the estimated range vs. elevation delta.")
    if st.button("Generate Plot"):
        plot_range_vs_elevation_delta(
            battery_capacity=battery_capacity,
            base_consumption=base_consumption,
            route_distance=route_distance,
            payload_weight=payload_weight,
            regen_efficiency=regen_efficiency,
            aux_power=aux_power,
            wind_adjustment=wind_adjustment,
            temp_adjustment=temp_adjustment,
            truck_empty_weight=truck_empty_weight,
        )
