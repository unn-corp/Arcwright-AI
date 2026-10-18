# Background Task Configuration and Registration

## Info.plist Configuration

Every task identifier **must** be declared in `Info.plist` under
`BGTaskSchedulerPermittedIdentifiers`, or `submit(_:)` throws
`BGTaskScheduler.Error.Code.notPermitted`.

```xml
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>com.example.app.refresh</string>
    <string>com.example.app.db-cleanup</string>
    <string>com.example.app.export</string>
</array>
```

Also enable the required `UIBackgroundModes`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>       <!-- Required for BGAppRefreshTask -->
    <string>processing</string>  <!-- Required for BGProcessingTask -->
</array>
```

In Xcode: target > Signing & Capabilities > Background Modes > enable
"Background fetch" and "Background processing".

## BGTaskScheduler Registration

Register handlers **before** app launch completes. In UIKit, register in
`application(_:didFinishLaunchingWithOptions:)`. In SwiftUI, register in the
`App` initializer.

### UIKit Registration

```swift
import BackgroundTasks

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.example.app.refresh",
            using: nil  // nil = main queue
        ) { task in
            self.handleAppRefresh(task: task as! BGAppRefreshTask)
        }

        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.example.app.db-cleanup",
            using: nil
        ) { task in
            self.handleDatabaseCleanup(task: task as! BGProcessingTask)
        }

        return true
    }
}
```

### SwiftUI Registration

```swift
import SwiftUI
import BackgroundTasks

@main
struct MyApp: App {
    init() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: "com.example.app.refresh",
            using: nil
        ) { task in
            BackgroundTaskManager.shared.handleAppRefresh(
                task: task as! BGAppRefreshTask
            )
        }
    }

    var body: some Scene {
        WindowGroup { ContentView() }
    }
}
```

