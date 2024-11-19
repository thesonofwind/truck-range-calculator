import streamlit as st

def calculate_truck_range(
    battery_capacity, base_consumption, route_distance,
    payload_weight, elevation_gain, elevation_loss,
    regen_efficiency, aux_power, wind_adjustment,
    temp_adjustment, truck_empty_weight
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

# Streamlit Interface
st.title("Truck Range Calculator")

# Input Fields
battery_capacity = st.number_input("Battery Capacity (kWh)", value=500.0, step=10.0)
base_consumption = st.number_input("Base Consumption (kWh/km)", value=1.2, step=0.1)
route_distance = st.number_input("Route Distance (km)", value=100.0, step=10.0)
payload_weight = st.number_input("Payload Weight (tons)", value=20.0, step=1.0)
elevation_gain = st.number_input("Elevation Gain (meters)", value=500.0, step=50.0)
elevation_loss = st.number_input("Elevation Loss (meters)", value=300.0, step=50.0)
regen_efficiency = st.number_input("Regenerative Efficiency (fraction)", value=0.7, step=0.05)
aux_power = st.number_input("Auxiliary Power Usage (kWh)", value=10.0, step=1.0)
wind_adjustment = st.number_input("Wind Adjustment (kWh)", value=5.0, step=1.0)
temp_adjustment = st.number_input("Temperature Adjustment (kWh)", value=5.0, step=1.0)
truck_empty_weight = st.number_input("Truck Empty Weight (tons)", value=10.0, step=1.0)

# Calculate and Display Range
if st.button("Calculate Range"):
    range_km = calculate_truck_range(
        battery_capacity, base_consumption, route_distance, payload_weight,
        elevation_gain, elevation_loss, regen_efficiency, aux_power,
        wind_adjustment, temp_adjustment, truck_empty_weight
    )
    st.success(f"Estimated range of the truck: {range_km:.2f} km")
