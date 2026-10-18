---
name: mapkit-location
description: "Implement maps, annotations, search, directions, geocoding, or location tracking with MapKit and Core Location. Use for location permissions, accuracy, updates, region monitoring, and map interaction."
---

# MapKit and CoreLocation

Build map-based and location-aware features targeting iOS 17+ with SwiftUI
MapKit and modern CoreLocation async APIs. Use `Map` with `MapContentBuilder`
for views, `CLLocationUpdate.liveUpdates()` for streaming location, and
`CLMonitor` for geofencing.

See `references/mapkit-patterns.md` for extended MapKit patterns and
`references/corelocation-patterns.md` for CoreLocation patterns.

## Decisions and constraints

- Target iOS 17+ for SwiftUI `Map` and `CLLocationUpdate.liveUpdates()`.
  `CLServiceSession` requires iOS 18+; MapKit-native geocoding, cycling directions,
  and `PlaceDescriptor` require iOS 26+. Place descriptors require `GeoToolbox`.
- Add `NSLocationWhenInUseUsageDescription` with a specific reason before
  tracking. Request when-in-use access first; escalate to always only when the
  user enables a background feature, with
  `NSLocationAlwaysAndWhenInUseUsageDescription`. Handle denial with a Settings
  deep link.
- Hold a `CLServiceSession` for the feature's lifetime and release it when done.
  On iOS 18+, live updates and `CLMonitor` use an implicit session if none is
  supplied; create one explicitly for always authorization or full accuracy.
- Filter location updates for the required accuracy or distance. Cancel tracking
  when no longer needed, including when its view disappears. Keep location UI
  updates and annotation view models isolated to `@MainActor`.
- Debounce search input by at least 300ms. Handle geocoding network errors and
  empty results; placemark properties are optional. Use stable annotation IDs.
- Keep a `CLMonitor` instance alive and limit it to 20 conditions. Background
  location uses `CLBackgroundActivitySession`.

## Load the relevant topic

Read only the recipe needed for the current change.

| Task | Reference |
|---|---|
| Map content, camera, style, interaction, controls or selection | [Map view recipes](references/map-view-recipes.md) |
| Live location, authorization sessions and permission UI | [Location recipes](references/location-recipes.md) |
| Forward/reverse geocoding or place descriptors | [Geocoding and places](references/geocoding-and-places.md) |
| Autocomplete, search, routes, ETA or cycling | [Search and directions](references/search-and-directions.md) |
| Full implementation sequence or common mistakes | [Workflow and pitfalls](references/workflow-and-pitfalls.md) |
| Clustering, Look Around, snapshots or extended map patterns | [Extended MapKit patterns](references/mapkit-patterns.md) |
| Geofencing, background tracking or location testing | [Extended CoreLocation patterns](references/corelocation-patterns.md) |

## Review Checklist

- [ ] Info.plist has `NSLocationWhenInUseUsageDescription` with specific reason
- [ ] Authorization denial handled with Settings deep link
- [ ] `CLLocationUpdate` task cancelled when not needed (battery)
- [ ] Location accuracy appropriate for the use case
- [ ] Map annotations use `Identifiable` data with stable IDs
- [ ] Geocoding errors handled (network failure, no results)
- [ ] Search completer input debounced
- [ ] `CLMonitor` limited to 20 conditions, instance kept alive
- [ ] Background location uses `CLBackgroundActivitySession`
- [ ] Map tested with VoiceOver
- [ ] Map annotation view models and location UI updates are `@MainActor`-isolated

## References

- `references/mapkit-patterns.md` — Map setup, annotations, search, routes, clustering, Look Around, snapshots.
- `references/corelocation-patterns.md` — CLLocationUpdate, CLMonitor, CLServiceSession, background location, testing.
