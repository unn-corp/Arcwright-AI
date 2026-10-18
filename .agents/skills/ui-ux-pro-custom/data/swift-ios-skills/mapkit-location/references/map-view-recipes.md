# SwiftUI Map Recipes

## SwiftUI Map View (iOS 17+)

```swift
import MapKit
import SwiftUI

struct PlaceMap: View {
    @State private var position: MapCameraPosition = .automatic

    var body: some View {
        Map(position: $position) {
            Marker("Apple Park", coordinate: applePark)
            Marker("Infinite Loop", systemImage: "building.2",
                   coordinate: infiniteLoop)
        }
        .mapStyle(.standard(elevation: .realistic))
        .mapControls {
            MapUserLocationButton()
            MapCompass()
            MapScaleView()
        }
    }
}
```

### Marker and Annotation

```swift
// Balloon marker -- simplest way to pin a location
Marker("Cafe", systemImage: "cup.and.saucer.fill", coordinate: cafeCoord)
    .tint(.brown)

// Annotation -- custom SwiftUI view at a coordinate
Annotation("You", coordinate: userCoord, anchor: .bottom) {
    Image(systemName: "figure.wave")
        .padding(6)
        .background(.blue.gradient, in: .circle)
        .foregroundStyle(.white)
}
```

### Overlays: Polyline, Polygon, Circle

```swift
Map {
    // Polyline from coordinates
    MapPolyline(coordinates: routeCoords)
        .stroke(.blue, lineWidth: 4)

    // Polygon (area highlight)
    MapPolygon(coordinates: parkBoundary)
        .foregroundStyle(.green.opacity(0.3))
        .stroke(.green, lineWidth: 2)

    // Circle (radius around a point)
    MapCircle(center: storeCoord, radius: 500)
        .foregroundStyle(.red.opacity(0.15))
        .stroke(.red, lineWidth: 1)
}
```

### Camera Position

`MapCameraPosition` controls what the map displays. Bind it to let the user
interact and to programmatically move the camera.

```swift
// Center on a region
@State private var position: MapCameraPosition = .region(
    MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.334, longitude: -122.009),
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )
)

// Follow user location
@State private var position: MapCameraPosition = .userLocation(fallback: .automatic)

// Specific camera angle (3D perspective)
@State private var position: MapCameraPosition = .camera(
    MapCamera(centerCoordinate: applePark, distance: 1000, heading: 90, pitch: 60)
)

// Frame specific items
position = .item(MKMapItem.forCurrentLocation())
position = .rect(MKMapRect(...))
```

### Map Style

```swift
.mapStyle(.standard)                                        // Default road map
.mapStyle(.standard(elevation: .realistic, showsTraffic: true))
.mapStyle(.imagery)                                         // Satellite
.mapStyle(.imagery(elevation: .realistic))                  // 3D satellite
.mapStyle(.hybrid)                                          // Satellite + labels
.mapStyle(.hybrid(elevation: .realistic, showsTraffic: true))
```

### Map Interaction Modes

```swift
.mapInteractionModes(.all)           // Default: pan, zoom, rotate, pitch
.mapInteractionModes(.pan)           // Pan only
.mapInteractionModes([.pan, .zoom])  // Pan and zoom
.mapInteractionModes([])             // Static map (no interaction)
```

### Map Selection

```swift
@State private var selectedMarker: MKMapItem?

Map(selection: $selectedMarker) {
    ForEach(places) { place in
        Marker(place.name, coordinate: place.coordinate)
            .tag(place.mapItem)     // Tag must match selection type
    }
}
.onChange(of: selectedMarker) { _, newValue in
    guard let item = newValue else { return }
    // React to selection
}
```

