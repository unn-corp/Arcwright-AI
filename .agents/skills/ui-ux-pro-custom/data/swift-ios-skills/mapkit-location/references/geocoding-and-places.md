# Geocoding and Place Descriptors

## Geocoding

### CLGeocoder (iOS 8+)

```swift
let geocoder = CLGeocoder()

// Forward geocoding: address string -> coordinates
let placemarks = try await geocoder.geocodeAddressString("1 Apple Park Way, Cupertino")
if let location = placemarks.first?.location {
    print(location.coordinate) // CLLocationCoordinate2D
}

// Reverse geocoding: coordinates -> placemark
let location = CLLocation(latitude: 37.3349, longitude: -122.0090)
let placemarks = try await geocoder.reverseGeocodeLocation(location)
if let placemark = placemarks.first {
    let address = [placemark.name, placemark.locality, placemark.administrativeArea]
        .compactMap { $0 }
        .joined(separator: ", ")
}
```

### MKGeocodingRequest and MKReverseGeocodingRequest (iOS 26+)

New MapKit-native geocoding that returns `MKMapItem` with richer data and
`MKAddress` / `MKAddressRepresentations` for flexible address formatting.

```swift
@available(iOS 26, *)
func reverseGeocode(location: CLLocation) async throws -> MKMapItem? {
    guard let request = MKReverseGeocodingRequest(location: location) else {
        return nil
    }
    let mapItems = try await request.mapItems
    return mapItems.first
}

@available(iOS 26, *)
func forwardGeocode(address: String) async throws -> [MKMapItem] {
    guard let request = MKGeocodingRequest(addressString: address) else { return [] }
    return try await request.mapItems
}
```

## PlaceDescriptor (iOS 26+)

Create rich place references from coordinates or addresses without needing a
Place ID. Requires `import GeoToolbox`.

```swift
@available(iOS 26, *)
func lookupPlace(name: String, coordinate: CLLocationCoordinate2D) async throws -> MKMapItem {
    let descriptor = PlaceDescriptor(
        representations: [.coordinate(coordinate)],
        commonName: name
    )
    let request = MKMapItemRequest(placeDescriptor: descriptor)
    return try await request.mapItem
}
```

