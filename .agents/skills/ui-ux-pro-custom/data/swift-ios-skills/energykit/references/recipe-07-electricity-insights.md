## Electricity Insights

Query historical energy and runtime data for devices using
`ElectricityInsightService`.

```swift
func queryEnergyInsights(deviceID: String, venueID: UUID) async throws {
    let query = ElectricityInsightQuery(
        options: [.cleanliness, .tariff],
        range: DateInterval(
            start: Calendar.current.date(byAdding: .day, value: -7, to: Date())!,
            end: Date()
        ),
        granularity: .daily,
        flowDirection: .imported
    )

    let service = ElectricityInsightService.shared
    let stream = try await service.energyInsights(
        forDeviceID: deviceID, using: query, atVenue: venueID
    )

    for await record in stream {
        if let total = record.totalEnergy { print("Total: \(total)") }
        if let cleaner = record.dataByGridCleanliness?.cleaner {
            print("Cleaner: \(cleaner)")
        }
    }
}
```

Use `runtimeInsights(forDeviceID:using:atVenue:)` for runtime data instead
of energy. Granularity options: `.hourly`, `.daily`, `.weekly`, `.monthly`,
`.yearly`. See `energykit-patterns.md` for full insight examples.
