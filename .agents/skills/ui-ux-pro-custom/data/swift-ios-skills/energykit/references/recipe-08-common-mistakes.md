## Common Mistakes

### DON'T: Forget the EnergyKit entitlement

Without the entitlement, all EnergyKit calls fail silently or throw errors.

```swift
// WRONG: No entitlement configured
let service = ElectricityGuidance.sharedService  // Will fail

// CORRECT: Add com.apple.developer.energykit to entitlements
// Then use the service
let service = ElectricityGuidance.sharedService
```

### DON'T: Ignore unsupported regions

EnergyKit is not available in all regions. Handle the `.unsupportedRegion`
and `.guidanceUnavailable` errors.

```swift
// WRONG: Assume guidance is always available
for try await guidance in service.guidance(using: query, at: venueID) {
    updateUI(guidance)
}

// CORRECT: Handle region-specific errors
do {
    for try await guidance in service.guidance(using: query, at: venueID) {
        updateUI(guidance)
    }
} catch let error as EnergyKitError {
    switch error {
    case .unsupportedRegion:
        showUnsupportedRegionMessage()
    case .guidanceUnavailable:
        showGuidanceUnavailableMessage()
    case .venueUnavailable:
        showNoVenueMessage()
    case .permissionDenied:
        showPermissionDeniedMessage()
    case .serviceUnavailable:
        retryLater()
    case .rateLimitExceeded:
        backOff()
    default:
        break
    }
}
```

### DON'T: Discard the guidance token

The `guidanceToken` links load events to the guidance that influenced them.
Always store and pass it through to load event submissions.

```swift
// WRONG: Ignore the guidance token
for try await guidance in guidanceStream {
    startCharging()
}

// CORRECT: Store the token for load events
for try await guidance in guidanceStream {
    let token = guidance.guidanceToken
    startCharging(followingGuidanceToken: token)
}
```

### DON'T: Submit load events without a session lifecycle

Always submit `.begin`, then `.active` updates, then `.end` events.

```swift
// WRONG: Only submit one event
let event = ElectricVehicleLoadEvent(/* state: .active */)
try await venue.submitEvents([event])

// CORRECT: Full session lifecycle
try await venue.submitEvents([beginEvent])
// ... periodic active events ...
try await venue.submitEvents([activeEvent])
// ... when done ...
try await venue.submitEvents([endEvent])
```

### DON'T: Query guidance without a venue

EnergyKit requires a venue ID. List venues first and select the appropriate one.

```swift
// WRONG: Use a hardcoded UUID
let fakeID = UUID()
service.guidance(using: query, at: fakeID)  // Will fail

// CORRECT: Discover venues first
let venues = try await EnergyVenue.venues()
guard let venue = venues.first else {
    showNoVenueSetup()
    return
}
let guidanceStream = service.guidance(using: query, at: venue.id)
```
