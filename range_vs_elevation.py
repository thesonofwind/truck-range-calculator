import streamlit as st
import matplotlib.pyplot as plt

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
    # Base energy consumption
    base_energy = base_consumption * route_distance
    
    # Energy consumption due to payload
    payload_energy = payload_weight * 0.02 * route_distance  # Assuming 0.02 kWh/ton-km
    
    # Energy consumption due to elevation
    total_weight_kg = (payload_weight + truck_empty_weight) * 1000
    uphill_energy = elevation_gain * 9.81 * total_weight_kg / 3.6e6  # in kWh
    downhill_recovery = elevation_loss * 9.81 * total_weight_kg * regen_efficiency / 3.6e6
    
    # Environmental adjustments
    environmental_adjustment = wind_adjustment + temp_adjustment
    
    # Total consumption
    total_energy_consumption = (
        base_energy + payload_energy + uphill_energy - downhill_recovery
        + aux_power + environmental_adjustment
    )
    
    # Calculate range
    range_km = battery_capacity / total_energy_consumption * route_distance
    return range_km


def plot_range_vs_elevation_delta():
    """
    Plot estimated range vs. delta elevation (elevation_gain - elevation_loss).
    """
    # Parameters
    battery_capacity = 500  # kWh
    base_consumption = 1.2  # kWh/km
    route_distance = 100  # km
    payload_weight = 20  # tons
    regen_efficiency = 0.7
    aux_power = 10  # kWh
    wind_adjustment = 5  # kWh
    temp_adjustment = 5  # kWh
    truck_empty_weight = 10  # tons
    
    # Delta elevation range (-500 to +500 meters with step size of 10 meters)
    min_delta_elevation = -500
    max_delta_elevation = 500
    step = 10

    delta_elevations = range(min_delta_elevation, max_delta_elevation + step, step)
    ranges = []

    # Calculate range for each delta elevation
    for delta_elevation in delta_elevations:
        elevation_gain = max(delta_elevation, 0)  # Positive delta for gain
        elevation_loss = -min(delta_elevation, 0)  # Positive delta for loss
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
    
    # Plot the results
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(delta_elevations, ranges, label="Estimated Range", marker="o")
    ax.axvline(0, color="gray", linestyle="--", label="No Elevation Change")
    ax.set_title("Estimated Range vs. Delta Elevation")
    ax.set_xlabel("Delta Elevation (m) [Gain - Loss]")
    ax.set_ylabel("Estimated Range (km)")
    ax.grid(True)
    ax.legend()
    st.pyplot(fig)  # Display the plot in Streamlit


# Streamlit App
st.title("Truck Range Calculator with Elevation Impact")

st.write("This tool calculates the estimated range of a truck and visualizes the impact of elevation changes on the range.")

if st.button("Generate Range vs. Elevation Delta Plot"):
    st.write("Generating the plot...")
    plot_range_vs_elevation_delta()
