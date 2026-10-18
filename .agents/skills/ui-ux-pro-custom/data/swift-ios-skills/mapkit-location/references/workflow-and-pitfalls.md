# Map and Location Workflow and Pitfalls

## Workflow

### 1. Add a map with markers or annotations

1. Import `MapKit`.
2. Create a `Map` view with optional `MapCameraPosition` binding.
3. Add `Marker`, `Annotation`, `MapPolyline`, `MapPolygon`, or `MapCircle`
   inside the `MapContentBuilder` closure.
4. Configure map style with `.mapStyle()`.
5. Add map controls with `.mapControls { }`.
6. Handle selection with a `selection:` binding.

### 2. Track user location

1. Add `NSLocationWhenInUseUsageDescription` to Info.plist.
2. On iOS 18+, create a `CLServiceSession` to manage authorization.
3. Iterate `CLLocationUpdate.liveUpdates()` in a `Task`.
4. Filter updates by distance or accuracy before updating the UI.
5. Stop the task when location tracking is no longer needed.

### 3. Search for places

1. Configure `MKLocalSearchCompleter` for autocomplete suggestions.
2. Debounce user input (at least 300ms) before setting the query.
3. Convert selected completion to `MKLocalSearch.Request` for full results.
4. Display results as markers or in a list.

### 4. Get directions and display a route

1. Create an `MKDirections.Request` with source and destination `MKMapItem`.
2. Set `transportType` (`.automobile`, `.walking`, `.transit`, `.cycling`).
3. Await `MKDirections.calculate()`.
4. Draw the route with `MapPolyline(route.polyline)`.

### 5. Review existing map/location code

Run through the Review Checklist at the end of this file.

## Common Mistakes

**DON'T:** Request `.authorizedAlways` upfront — users distrust broad permissions.
**DO:** Start with `.requestWhenInUseAuthorization()`, escalate to `.always` only when the user enables a background feature.

**DON'T:** Use `CLLocationManagerDelegate` for simple location fetches on iOS 17+.
**DO:** Use `CLLocationUpdate.liveUpdates()` async stream for cleaner, more concise code.

**DON'T:** Keep location updates running when the map/view is not visible (drains battery).
**DO:** Use `.task { }` in SwiftUI so updates cancel automatically on disappear.

**DON'T:** Force-unwrap `CLPlacemark` properties — they are all optional.
**DO:** Use nil-coalescing: `placemark.locality ?? "Unknown"`.

**DON'T:** Fire `MKLocalSearchCompleter` queries on every keystroke.
**DO:** Debounce with `.task(id: searchText)` + `Task.sleep(for: .milliseconds(300))`.

**DON'T:** Silently fail when location authorization is denied.
**DO:** Detect `.denied` status and show an alert with a Settings deep link.

**DON'T:** Assume geocoding always succeeds — handle empty results and network errors.

## Review Checklist

Use [the entrypoint checklist](../SKILL.md#review-checklist) for final verification.

