# MetricKit Subscriber Lifecycle

## Subscriber Setup

Register a subscriber as early as possible — ideally in
`application(_:didFinishLaunchingWithOptions:)` or `App.init`. MetricKit
starts accumulating reports after the first access to `MXMetricManager.shared`.

```swift
import MetricKit

final class MetricsSubscriber: NSObject, MXMetricManagerSubscriber {
    static let shared = MetricsSubscriber()

    func subscribe() {
        MXMetricManager.shared.add(self)
    }

    func unsubscribe() {
        MXMetricManager.shared.remove(self)
    }

    func didReceive(_ payloads: [MXMetricPayload]) {
        // Handle daily metrics
    }

    func didReceive(_ payloads: [MXDiagnosticPayload]) {
        // Handle diagnostics (crashes, hangs, disk writes)
    }
}
```

### UIKit Registration

```swift
func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
) -> Bool {
    MetricsSubscriber.shared.subscribe()
    return true
}
```

### SwiftUI Registration

```swift
@main
struct MyApp: App {
    init() {
        MetricsSubscriber.shared.subscribe()
    }
    var body: some Scene {
        WindowGroup { ContentView() }
    }
}
```

