# HealthKit Background Delivery

## Background Delivery

Register for background updates so your app is launched when new data arrives. Requires the background delivery entitlement.

```swift
func enableStepCountBackgroundDelivery() async throws {
    let stepType = HKQuantityType(.stepCount)

    try await healthStore.enableBackgroundDelivery(
        for: stepType,
        frequency: .hourly
    )
}
```

**Pair with an `HKObserverQuery`** to handle notifications. Always call the completion handler:

```swift
let observerQuery = HKObserverQuery(
    sampleType: HKQuantityType(.stepCount),
    predicate: nil
) { query, completionHandler, error in
    defer { completionHandler() }  // Must call to signal done
    guard error == nil else { return }
    // Fetch new data, update UI, etc.
}
healthStore.execute(observerQuery)
```

**Frequencies:** `.immediate`, `.hourly`, `.daily`, `.weekly`

Call `enableBackgroundDelivery` once (e.g., at app launch). The system persists the registration.

