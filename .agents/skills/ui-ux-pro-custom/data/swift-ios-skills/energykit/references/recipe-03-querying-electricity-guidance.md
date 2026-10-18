## Querying Electricity Guidance

Use `ElectricityGuidance.Service` to get a forecast stream for a venue.

```swift
import EnergyKit

func observeGuidance(venueID: UUID) async throws {
    let query = ElectricityGuidance.Query(suggestedAction: .shift)
    let service = ElectricityGuidance.sharedService  // Verify access pattern against Xcode 26 SDK

    let guidanceStream = service.guidance(using: query, at: venueID)

    for try await guidance in guidanceStream {
        print("Guidance token: \(guidance.guidanceToken)")
        print("Interval: \(guidance.interval)")
        print("Venue: \(guidance.energyVenueID)")

        // Check if rate plan information is available
        if guidance.options.contains(.guidanceIncorporatesRatePlan) {
            print("Rate plan data incorporated")
        }
        if guidance.options.contains(.locationHasRatePlan) {
            print("Location has a rate plan")
        }

        processGuidanceValues(guidance.values)
    }
}
```
