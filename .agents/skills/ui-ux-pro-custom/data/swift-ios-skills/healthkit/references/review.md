# HealthKit Review and Sources

## Common Mistakes

### 1. Over-requesting data types

DON'T -- request everything:
```swift
// App Review will reject this
let allTypes: Set<HKObjectType> = [
    HKQuantityType(.stepCount),
    HKQuantityType(.heartRate),
    HKQuantityType(.bloodGlucose),
    HKQuantityType(.bodyMass),
    HKQuantityType(.oxygenSaturation),
    // ...20 more types the app never uses
]
```

DO -- request only what you use:
```swift
let neededTypes: Set<HKObjectType> = [
    HKQuantityType(.stepCount),
    HKQuantityType(.activeEnergyBurned)
]
```

### 2. Not handling authorization denial

DON'T -- assume data will be returned:
```swift
func getSteps() async throws -> Double {
    let result = try await query.result(for: healthStore)
    return result!.sumQuantity()!.doubleValue(for: .count()) // Crashes if denied
}
```

DO -- handle nil gracefully:
```swift
func getSteps() async throws -> Double {
    let result = try await query.result(for: healthStore)
    return result?.sumQuantity()?.doubleValue(for: .count()) ?? 0
}
```

### 3. Assuming HealthKit is always available

DON'T -- skip the check:
```swift
let store = HKHealthStore() // Crashes on iPad
try await store.requestAuthorization(toShare: types, read: types)
```

DO -- guard availability:
```swift
guard HKHealthStore.isHealthDataAvailable() else {
    showUnsupportedDeviceMessage()
    return
}
```

### 4. Running heavy queries on the main thread

DON'T -- use old callback-based queries on main thread. DO -- use async descriptors:
```swift
// Bad: HKSampleQuery with callback on main thread
// Good: async descriptor
func loadAllData() async throws -> [HKQuantitySample] {
    let descriptor = HKSampleQueryDescriptor(
        predicates: [.quantitySample(type: stepType)],
        sortDescriptors: [SortDescriptor(\.endDate, order: .reverse)],
        limit: 100
    )
    return try await descriptor.result(for: healthStore)
}
```

### 5. Forgetting to call completionHandler in observer queries

DON'T -- skip the completion handler:
```swift
let query = HKObserverQuery(sampleType: type, predicate: nil) { _, handler, _ in
    processNewData()
    // Forgot to call handler() -- system won't schedule next delivery
}
```

DO -- always call it:
```swift
let query = HKObserverQuery(sampleType: type, predicate: nil) { _, handler, _ in
    defer { handler() }
    processNewData()
}
```

### 6. Using wrong statistics options for the data type

DON'T -- use cumulative sum on discrete types:
```swift
// Heart rate is discrete, not cumulative -- this returns nil
let query = HKStatisticsQueryDescriptor(
    predicate: heartRatePredicate,
    options: .cumulativeSum
)
```

DO -- match options to data type:
```swift
// Use discrete options for discrete types
let query = HKStatisticsQueryDescriptor(
    predicate: heartRatePredicate,
    options: .discreteAverage
)
```

## Review Checklist

- [ ] `HKHealthStore.isHealthDataAvailable()` checked before any HealthKit access
- [ ] Only necessary data types requested in authorization
- [ ] `Info.plist` includes `NSHealthShareUsageDescription` and/or `NSHealthUpdateUsageDescription`
- [ ] HealthKit capability enabled in Xcode project
- [ ] Authorization denial handled gracefully (nil results, not crashes)
- [ ] Single `HKHealthStore` instance reused (not created per query)
- [ ] Async query descriptors used instead of callback-based queries
- [ ] Heavy queries not blocking main thread
- [ ] Statistics options match data type (cumulative vs. discrete)
- [ ] Background delivery paired with `HKObserverQuery` and `completionHandler` called
- [ ] Background delivery entitlement enabled if using `enableBackgroundDelivery`
- [ ] Workout sessions properly ended and builder finalized
- [ ] Write operations only for sample types the app created

## References

- Extended patterns (workouts, anchored queries, SwiftUI integration): [healthkit-patterns.md](healthkit-patterns.md)
- [HealthKit framework](https://sosumi.ai/documentation/healthkit)
- [HKHealthStore](https://sosumi.ai/documentation/healthkit/hkhealthstore)
- [HKSampleQueryDescriptor](https://sosumi.ai/documentation/healthkit/hksamplequerydescriptor)
- [HKStatisticsQueryDescriptor](https://sosumi.ai/documentation/healthkit/hkstatisticsquerydescriptor)
- [HKStatisticsCollectionQueryDescriptor](https://sosumi.ai/documentation/healthkit/hkstatisticscollectionquerydescriptor)
- [HKWorkoutSession](https://sosumi.ai/documentation/healthkit/hkworkoutsession)
- [HKLiveWorkoutBuilder](https://sosumi.ai/documentation/healthkit/hkliveworkoutbuilder)
- [Setting up HealthKit](https://sosumi.ai/documentation/healthkit/setting-up-healthkit)
- [Authorizing access to health data](https://sosumi.ai/documentation/healthkit/authorizing-access-to-health-data)
