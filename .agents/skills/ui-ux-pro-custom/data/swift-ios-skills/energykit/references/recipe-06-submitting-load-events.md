## Submitting Load Events

Report device consumption data back to the system. This helps the system
improve future guidance accuracy.

### EV Charger Load Events

```swift
func submitEVChargingEvent(
    at venue: EnergyVenue,
    guidanceToken: UUID,
    deviceID: String
) async throws {
    let session = ElectricVehicleLoadEvent.Session(
        id: UUID(),
        state: .begin,
        guidanceState: ElectricVehicleLoadEvent.Session.GuidanceState(
            wasFollowingGuidance: true,
            guidanceToken: guidanceToken
        )
    )

    let measurement = ElectricVehicleLoadEvent.ElectricalMeasurement(
        stateOfCharge: 45,
        direction: .imported,
        power: Measurement(value: 7.2, unit: .kilowatts),
        energy: Measurement(value: 0, unit: .kilowattHours)
    )

    let event = ElectricVehicleLoadEvent(
        timestamp: Date(),
        measurement: measurement,
        session: session,
        deviceID: deviceID
    )

    try await venue.submitEvents([event])
}
```

### HVAC Load Events

```swift
func submitHVACEvent(
    at venue: EnergyVenue,
    guidanceToken: UUID,
    stage: Int,
    deviceID: String
) async throws {
    let session = ElectricHVACLoadEvent.Session(
        id: UUID(),
        state: .active,
        guidanceState: ElectricHVACLoadEvent.Session.GuidanceState(
            wasFollowingGuidance: true,
            guidanceToken: guidanceToken
        )
    )

    let measurement = ElectricHVACLoadEvent.ElectricalMeasurement(stage: stage)

    let event = ElectricHVACLoadEvent(
        timestamp: Date(),
        measurement: measurement,
        session: session,
        deviceID: deviceID
    )

    try await venue.submitEvents([event])
}
```

### Session States

| State | When to Use |
|---|---|
| `.begin` | Device starts consuming electricity |
| `.active` | Device is actively consuming (periodic updates) |
| `.end` | Device stops consuming electricity |
