# MetricKit Call Stack Trees

## Call Stack Trees

`MXCallStackTree` is attached to each diagnostic (crash, hang, CPU exception,
disk write, app launch). Use `jsonRepresentation()` to extract and symbolicate.

```swift
func handleCrash(_ crash: MXCrashDiagnostic) {
    let tree = crash.callStackTree
    let treeJSON = tree.jsonRepresentation()

    let exceptionType = crash.exceptionType
    let signal = crash.signal
    let reason = crash.terminationReason

    uploadDiagnostic(
        type: "crash",
        exceptionType: exceptionType,
        signal: signal,
        reason: reason,
        callStack: treeJSON
    )
}

func handleHang(_ hang: MXHangDiagnostic) {
    let tree = hang.callStackTree
    let duration = hang.hangDuration  // Measurement<UnitDuration>
    uploadDiagnostic(type: "hang", duration: duration, callStack: tree.jsonRepresentation())
}
```

The JSON structure contains an array of call stack frames with binary name,
offset, and address. Symbolicate using `atos` or upload dSYMs to your
analytics service.

**Availability**: `MXCallStackTree` — iOS 14.0+, macOS 12.0+, visionOS 1.0+

