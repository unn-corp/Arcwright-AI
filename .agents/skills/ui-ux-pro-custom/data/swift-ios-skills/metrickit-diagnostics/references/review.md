# MetricKit Review and Sources

## Common Mistakes

### DON'T: Subscribe to MXMetricManager too late

The system may deliver pending payloads shortly after launch. Subscribing
late (e.g., in a view controller) risks missing them entirely.

```swift
// WRONG — subscribing in a view controller
override func viewDidLoad() {
    super.viewDidLoad()
    MXMetricManager.shared.add(self)
}

// CORRECT — subscribe in application(_:didFinishLaunchingWithOptions:)
func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions opts: [UIApplication.LaunchOptionsKey: Any]?
) -> Bool {
    MXMetricManager.shared.add(metricsSubscriber)
    return true
}
```

### DON'T: Ignore MXDiagnosticPayload

Only handling `MXMetricPayload` means you miss crash, hang, and disk-write
diagnostics — the most actionable data MetricKit provides.

```swift
// WRONG — only implementing metric callback
func didReceive(_ payloads: [MXMetricPayload]) { /* ... */ }

// CORRECT — implement both callbacks
func didReceive(_ payloads: [MXMetricPayload]) { /* ... */ }
func didReceive(_ payloads: [MXDiagnosticPayload]) { /* ... */ }
```

### DON'T: Process payloads without persisting first

The system delivers each payload once. If your subscriber crashes during
processing, the data is lost permanently.

```swift
// WRONG — process inline, crash loses data
func didReceive(_ payloads: [MXDiagnosticPayload]) {
    for p in payloads {
        riskyProcessing(p)  // If this crashes, payload is gone
    }
}

// CORRECT — persist raw JSON first, then process
func didReceive(_ payloads: [MXDiagnosticPayload]) {
    for p in payloads {
        let json = p.jsonRepresentation()
        try? json.write(to: localCacheURL())   // Safe on disk
        Task.detached { self.processAsync(json) }
    }
}
```

### DON'T: Do heavy work synchronously in didReceive

The callback runs on an arbitrary thread. Blocking it with heavy processing
or synchronous network calls delays delivery of subsequent payloads.

```swift
// WRONG — synchronous upload in callback
func didReceive(_ payloads: [MXMetricPayload]) {
    for p in payloads {
        let data = p.jsonRepresentation()
        URLSession.shared.uploadTask(with: request, from: data).resume()  // sync wait
    }
}

// CORRECT — persist and dispatch async
func didReceive(_ payloads: [MXMetricPayload]) {
    for p in payloads {
        let json = p.jsonRepresentation()
        persistLocally(json)
        Task.detached(priority: .utility) {
            await self.uploadToBackend(json)
        }
    }
}
```

### DON'T: Expect immediate data in development

MetricKit aggregates data over 24-hour windows. Payloads do not arrive
immediately after instrumenting. Use Xcode Organizer or simulated payloads
for faster iteration during development.

## Review Checklist

- [ ] `MXMetricManager.shared.add(subscriber)` called in `application(_:didFinishLaunchingWithOptions:)` or `App.init`
- [ ] Subscriber conforms to `MXMetricManagerSubscriber` and inherits `NSObject`
- [ ] Both `didReceive(_: [MXMetricPayload])` and `didReceive(_: [MXDiagnosticPayload])` implemented
- [ ] Raw `jsonRepresentation()` persisted to disk before processing
- [ ] Heavy processing dispatched asynchronously off the callback thread
- [ ] `MXCallStackTree` JSON uploaded with dSYMs for symbolication
- [ ] Custom signpost metrics limited to critical code paths
- [ ] `pastPayloads` and `pastDiagnosticPayloads` checked on launch for missed deliveries
- [ ] Extended launch tasks call both `extendLaunchMeasurement` and `finishExtendedLaunchMeasurement`
- [ ] Analytics backend accepts and stores MetricKit JSON format
- [ ] Xcode Organizer reviewed for regression trends alongside on-device data

## References

- [MetricKit framework](https://sosumi.ai/documentation/metrickit)
- [MXMetricManager](https://sosumi.ai/documentation/metrickit/mxmetricmanager)
- [MXMetricManagerSubscriber](https://sosumi.ai/documentation/metrickit/mxmetricmanagersubscriber)
- [MXMetricPayload](https://sosumi.ai/documentation/metrickit/mxmetricpayload)
- [MXDiagnosticPayload](https://sosumi.ai/documentation/metrickit/mxdiagnosticpayload)
- [MXCallStackTree](https://sosumi.ai/documentation/metrickit/mxcallstacktree)
- [MXSignpostMetric](https://sosumi.ai/documentation/metrickit/mxsignpostmetric)
- [MXAppLaunchMetric](https://sosumi.ai/documentation/metrickit/mxapplaunchmetric)
- [MXAppRunTimeMetric](https://sosumi.ai/documentation/metrickit/mxappruntimemetric)
- [MXCrashDiagnostic](https://sosumi.ai/documentation/metrickit/mxcrashdiagnostic)
- [Analyzing the performance of your shipping app](https://sosumi.ai/documentation/xcode/analyzing-the-performance-of-your-shipping-app)
