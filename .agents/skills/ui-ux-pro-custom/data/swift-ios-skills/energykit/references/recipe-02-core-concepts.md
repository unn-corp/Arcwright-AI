## Core Concepts

EnergyKit provides two main capabilities:

1. **Electricity Guidance** -- time-weighted forecasts telling apps when
   electricity is cleaner or cheaper, so devices can shift or reduce consumption
2. **Load Events** -- telemetry from devices (EV chargers, HVAC) submitted back
   to the system to track how well the app follows guidance

### Key Types

| Type | Role |
|---|---|
| `ElectricityGuidance` | Forecast data with weighted time intervals |
| `ElectricityGuidance.Service` | Interface for obtaining guidance data |
| `ElectricityGuidance.Query` | Query specifying shift or reduce action |
| `ElectricityGuidance.Value` | A time interval with a rating (0.0-1.0) |
| `EnergyVenue` | A physical location (home) registered for energy management |
| `ElectricVehicleLoadEvent` | Load event for EV charger telemetry |
| `ElectricHVACLoadEvent` | Load event for HVAC system telemetry |
| `ElectricityInsightService` | Service for querying energy/runtime insights |
| `ElectricityInsightRecord` | Historical energy data broken down by cleanliness/tariff |
| `ElectricityInsightQuery` | Query for historical insight data |

### Suggested Actions

| Action | Use Case |
|---|---|
| `.shift` | Devices that can move consumption to a different time (EV charging) |
| `.reduce` | Devices that can lower consumption without stopping (HVAC setback) |
