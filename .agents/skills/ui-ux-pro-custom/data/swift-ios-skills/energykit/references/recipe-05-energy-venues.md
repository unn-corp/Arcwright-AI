## Energy Venues

An `EnergyVenue` represents a physical location registered for energy management.

```swift
// List all venues
func listVenues() async throws -> [EnergyVenue] {
    try await EnergyVenue.venues()
}

// Get a specific venue by ID
func getVenue(id: UUID) async throws -> EnergyVenue {
    try await EnergyVenue.venue(for: id)
}

// Get a venue matching a HomeKit home
func getVenueForHome(homeID: UUID) async throws -> EnergyVenue {
    try await EnergyVenue.venue(matchingHomeUniqueIdentifier: homeID)
}
```

### Venue Properties

```swift
let venue = try await EnergyVenue.venue(for: venueID)
print("Venue ID: \(venue.id)")
print("Venue name: \(venue.name)")
```
