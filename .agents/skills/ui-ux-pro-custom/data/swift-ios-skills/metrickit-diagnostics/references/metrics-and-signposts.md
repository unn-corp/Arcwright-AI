# MetricKit Metrics and Instrumentation

## Key Metrics

### Launch Time — MXAppLaunchMetric

```swift
if let launch = payload.applicationLaunchMetrics {
    let firstDraw = launch.histogrammedTimeToFirstDraw
    let optimized = launch.histogrammedOptimizedTimeToFirstDraw
    let resume = launch.histogrammedApplicationResumeTime
    let extended = launch.histogrammedExtendedLaunch
}
```

### Run Time — MXAppRunTimeMetric

```swift
if let runTime = payload.applicationTimeMetrics {
    let fg = runTime.cumulativeForegroundTime    // Measurement<UnitDuration>
    let bg = runTime.cumulativeBackgroundTime
    let bgAudio = runTime.cumulativeBackgroundAudioTime
    let bgLocation = runTime.cumulativeBackgroundLocationTime
}
```

### CPU, Memory, and Responsiveness

```swift
if let cpu = payload.cpuMetrics {
    let cpuTime = cpu.cumulativeCPUTime              // Measurement<UnitDuration>
}
if let memory = payload.memoryMetrics {
    let peakMemory = memory.peakMemoryUsage           // Measurement<UnitInformationStorage>
}
if let responsiveness = payload.applicationResponsivenessMetrics {
    let hangTime = responsiveness.histogrammedApplicationHangTime
}
if let animation = payload.animationMetrics {
    let scrollHitchRate = animation.scrollHitchTimeRatio  // Measurement<Unit>
}
```

### Network and Cellular

```swift
if let network = payload.networkTransferMetrics {
    let wifiUp = network.cumulativeWifiUpload          // Measurement<UnitInformationStorage>
    let wifiDown = network.cumulativeWifiDownload
    let cellUp = network.cumulativeCellularUpload
    let cellDown = network.cumulativeCellularDownload
}
```

### App Exit Metrics

```swift
if let exits = payload.applicationExitMetrics {
    let fg = exits.foregroundExitData
    let bg = exits.backgroundExitData
    // Inspect normal, abnormal, watchdog, memory, etc.
}
```

## Custom Signpost Metrics

Use `mxSignpost` with a MetricKit log handle to capture custom performance
intervals. These appear in the daily `MXMetricPayload` under `signpostMetrics`.

### Creating a Log Handle

```swift
let metricLog = MXMetricManager.makeLogHandle(category: "Networking")
```

### Emitting Signposts

```swift
import os

func fetchData() async throws -> Data {
    let signpostID = MXSignpostIntervalData.makeSignpostID(log: metricLog)

    mxSignpost(.begin, log: metricLog, name: "DataFetch", signpostID: signpostID)
    let data = try await URLSession.shared.data(from: url).0
    mxSignpost(.end, log: metricLog, name: "DataFetch", signpostID: signpostID)

    return data
}
```

### Reading Custom Metrics from Payload

```swift
if let signposts = payload.signpostMetrics {
    for metric in signposts {
        let name = metric.signpostName       // "DataFetch"
        let category = metric.signpostCategory // "Networking"
        let count = metric.totalCount
        if let intervalData = metric.signpostIntervalData {
            let avgMemory = intervalData.averageMemory
            let cumulativeCPUTime = intervalData.cumulativeCPUTime
        }
    }
}
```

> The system limits the number of custom signpost metrics per log to reduce
> on-device overhead. Reserve custom metrics for critical code paths.

## Extended Launch Measurement

Track post-first-draw setup work (loading databases, restoring state) as
part of the launch metric using extended launch measurement.

```swift
let taskID = MXLaunchTaskID("com.example.app.loadDatabase")

MXMetricManager.shared.extendLaunchMeasurement(forTaskID: taskID)
// Perform extended launch work...
await database.load()
MXMetricManager.shared.finishExtendedLaunchMeasurement(forTaskID: taskID)
```

Extended launch times appear under `histogrammedExtendedLaunch` in
`MXAppLaunchMetric`.

## Xcode Organizer Integration

Xcode Organizer shows the same MetricKit data aggregated across all users
who have opted in to share diagnostics. Use Organizer for trend analysis:

- **Metrics tab**: Battery, performance, and disk-write metrics over time
- **Regressions tab**: Automatic detection of metric regressions per version
- **Crashes tab**: Crash logs with symbolicated stack traces

MetricKit on-device collection complements Organizer by letting you route
raw data to your own backend for custom dashboards, alerting, and filtering
by user cohort.

