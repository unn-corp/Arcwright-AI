# Location Updates and Authorization Recipes

## CoreLocation Modern API

### CLLocationUpdate.liveUpdates() (iOS 17+)

Replace `CLLocationManagerDelegate` callbacks with a single async sequence.
Each iteration yields a `CLLocationUpdate` containing an optional `CLLocation`.

```swift
import CoreLocation

@Observable
final class LocationTracker: @unchecked Sendable {
    var currentLocation: CLLocation?
    private var updateTask: Task<Void, Never>?

    func startTracking() {
        updateTask = Task {
            let updates = CLLocationUpdate.liveUpdates()
            for try await update in updates {
                guard let location = update.location else { continue }
                // Filter by horizontal accuracy
                guard location.horizontalAccuracy < 50 else { continue }
                await MainActor.run {
                    self.currentLocation = location
                }
            }
        }
    }

    func stopTracking() {
        updateTask?.cancel()
        updateTask = nil
    }
}
```

### CLServiceSession (iOS 18+)

Declare authorization requirements for a feature's lifetime. Hold a reference
to the session for as long as you need location services.

```swift
// When-in-use authorization with full accuracy preference
let session = CLServiceSession(
    authorization: .whenInUse,
    fullAccuracyPurposeKey: "NearbySearchPurpose"
)
// Hold `session` as a stored property; release it when done.
```

On iOS 18+, `CLLocationUpdate.liveUpdates()` and `CLMonitor` take an implicit
`CLServiceSession` if you do not create one explicitly. Create one explicitly
when you need `.always` authorization or full accuracy.

### Authorization Flow

```swift
// Info.plist keys (required):
// NSLocationWhenInUseUsageDescription
// NSLocationAlwaysAndWhenInUseUsageDescription (only if .always needed)

// Check authorization and guide user to Settings when denied
struct LocationPermissionView: View {
    @Environment(\.openURL) private var openURL

    var body: some View {
        ContentUnavailableView {
            Label("Location Access Denied", systemImage: "location.slash")
        } description: {
            Text("Enable location access in Settings to use this feature.")
        } actions: {
            Button("Open Settings") {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    openURL(url)
                }
            }
        }
    }
}
```

