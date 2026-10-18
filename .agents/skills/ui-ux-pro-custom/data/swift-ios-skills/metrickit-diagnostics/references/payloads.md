# MetricKit Payload Handling

## Receiving Metric Payloads

`MXMetricPayload` arrives approximately once per 24 hours containing
aggregated metrics. The array may contain multiple payloads if prior
deliveries were missed.

```swift
func didReceive(_ payloads: [MXMetricPayload]) {
    for payload in payloads {
        let begin = payload.timeStampBegin
        let end = payload.timeStampEnd
        let version = payload.latestApplicationVersion

        // Persist raw JSON before processing
        let jsonData = payload.jsonRepresentation()
        persistPayload(jsonData, from: begin, to: end)

        processMetrics(payload)
    }
}
```

**Availability**: `MXMetricPayload` — iOS 13.0+, macOS 10.15+, visionOS 1.0+

## Receiving Diagnostic Payloads

`MXDiagnosticPayload` delivers crash, hang, CPU exception, disk-write, and
app-launch diagnostics. On iOS 15+ and macOS 12+, diagnostics arrive
immediately rather than bundled with the daily report.

```swift
func didReceive(_ payloads: [MXDiagnosticPayload]) {
    for payload in payloads {
        let jsonData = payload.jsonRepresentation()
        persistPayload(jsonData)

        if let crashes = payload.crashDiagnostics {
            for crash in crashes {
                handleCrash(crash)
            }
        }
        if let hangs = payload.hangDiagnostics {
            for hang in hangs {
                handleHang(hang)
            }
        }
        if let diskWrites = payload.diskWriteExceptionDiagnostics {
            for diskWrite in diskWrites {
                handleDiskWrite(diskWrite)
            }
        }
        if let cpuExceptions = payload.cpuExceptionDiagnostics {
            for cpuException in cpuExceptions {
                handleCPUException(cpuException)
            }
        }
        if let launchDiags = payload.appLaunchDiagnostics {
            for launchDiag in launchDiags {
                handleSlowLaunch(launchDiag)
            }
        }
    }
}
```

**Availability**: `MXDiagnosticPayload` — iOS 14.0+, macOS 12.0+, visionOS 1.0+

## Exporting and Uploading Payloads

Both payload types conform to `NSSecureCoding` and provide
`jsonRepresentation()` for easy serialization.

```swift
func persistPayload(_ jsonData: Data, from: Date? = nil, to: Date? = nil) {
    let fileName = "metrics_\(ISO8601DateFormatter().string(from: Date())).json"
    let url = FileManager.default.temporaryDirectory.appending(path: fileName)
    try? jsonData.write(to: url)
}

func uploadPayloads(_ jsonData: Data) {
    Task.detached(priority: .utility) {
        var request = URLRequest(url: URL(string: "https://api.example.com/metrics")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = jsonData
        _ = try? await URLSession.shared.data(for: request)
    }
}
```

### Retrieving Past Payloads

If the subscriber was not registered when payloads arrived, retrieve them
using `pastPayloads` and `pastDiagnosticPayloads`. These return reports
generated since the last allocation of the shared manager.

```swift
let pastMetrics = MXMetricManager.shared.pastPayloads
let pastDiags = MXMetricManager.shared.pastDiagnosticPayloads
```

