# HealthKit Setup and Authorization

## Setup and Availability

### Project Configuration

1. Enable the HealthKit capability in Xcode (adds the entitlement)
2. Add `NSHealthShareUsageDescription` (read) and `NSHealthUpdateUsageDescription` (write) to Info.plist
3. For background delivery, enable the "Background Delivery" sub-capability

### Availability Check

Always check availability before accessing HealthKit. iPad and some devices do not support it.

```swift
import HealthKit

let healthStore = HKHealthStore()

guard HKHealthStore.isHealthDataAvailable() else {
    // HealthKit not available on this device (e.g., iPad)
    return
}
```

Create a single `HKHealthStore` instance and reuse it throughout your app. It is thread-safe.

## Authorization

Request only the types your app genuinely needs. App Review rejects apps that over-request.

```swift
func requestAuthorization() async throws {
    let typesToShare: Set<HKSampleType> = [
        HKQuantityType(.stepCount),
        HKQuantityType(.activeEnergyBurned)
    ]

    let typesToRead: Set<HKObjectType> = [
        HKQuantityType(.stepCount),
        HKQuantityType(.heartRate),
        HKQuantityType(.activeEnergyBurned),
        HKCharacteristicType(.dateOfBirth)
    ]

    try await healthStore.requestAuthorization(
        toShare: typesToShare,
        read: typesToRead
    )
}
```

### Checking Authorization Status

The app can only determine if it has **not yet requested** authorization. If the user denied access, HealthKit returns empty results rather than an error -- this is a privacy design.

```swift
let status = healthStore.authorizationStatus(
    for: HKQuantityType(.stepCount)
)

switch status {
case .notDetermined:
    // Haven't requested yet -- safe to call requestAuthorization
    break
case .sharingAuthorized:
    // User granted write access
    break
case .sharingDenied:
    // User denied write access (read denial is indistinguishable from "no data")
    break
@unknown default:
    break
}
```

