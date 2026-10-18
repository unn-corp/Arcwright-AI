# Place Search and Directions

## Search

### MKLocalSearchCompleter (Autocomplete)

```swift
@Observable
final class SearchCompleter: NSObject, MKLocalSearchCompleterDelegate {
    var results: [MKLocalSearchCompletion] = []
    var query: String = "" { didSet { completer.queryFragment = query } }

    private let completer = MKLocalSearchCompleter()

    override init() {
        super.init()
        completer.delegate = self
        completer.resultTypes = [.address, .pointOfInterest]
    }

    func completerDidUpdateResults(_ completer: MKLocalSearchCompleter) {
        results = completer.results
    }

    func completer(_ completer: MKLocalSearchCompleter, didFailWithError error: Error) {
        results = []
    }
}
```

### MKLocalSearch (Full Search)

```swift
func search(for completion: MKLocalSearchCompletion) async throws -> [MKMapItem] {
    let request = MKLocalSearch.Request(completion: completion)
    request.resultTypes = [.pointOfInterest, .address]
    let search = MKLocalSearch(request: request)
    let response = try await search.start()
    return response.mapItems
}

// Search by natural language query within a region
func searchNearby(query: String, region: MKCoordinateRegion) async throws -> [MKMapItem] {
    let request = MKLocalSearch.Request()
    request.naturalLanguageQuery = query
    request.region = region
    let search = MKLocalSearch(request: request)
    let response = try await search.start()
    return response.mapItems
}
```

## Directions

```swift
func getDirections(from source: MKMapItem, to destination: MKMapItem,
                   transport: MKDirectionsTransportType = .automobile) async throws -> MKRoute? {
    let request = MKDirections.Request()
    request.source = source
    request.destination = destination
    request.transportType = transport
    let directions = MKDirections(request: request)
    let response = try await directions.calculate()
    return response.routes.first
}
```

### Display Route on Map

```swift
@State private var route: MKRoute?

Map {
    if let route {
        MapPolyline(route.polyline)
            .stroke(.blue, lineWidth: 5)
    }
    Marker("Start", coordinate: startCoord)
    Marker("End", coordinate: endCoord)
}
.task {
    route = try? await getDirections(from: startItem, to: endItem)
}
```

### ETA Calculation

```swift
func getETA(from source: MKMapItem, to destination: MKMapItem) async throws -> TimeInterval {
    let request = MKDirections.Request()
    request.source = source
    request.destination = destination
    let directions = MKDirections(request: request)
    let response = try await directions.calculateETA()
    return response.expectedTravelTime
}
```

### Cycling Directions (iOS 26+)

```swift
@available(iOS 26, *)
func getCyclingDirections(to destination: MKMapItem) async throws -> MKRoute? {
    let request = MKDirections.Request()
    request.source = MKMapItem.forCurrentLocation()
    request.destination = destination
    request.transportType = .cycling
    let directions = MKDirections(request: request)
    let response = try await directions.calculate()
    return response.routes.first
}
```

