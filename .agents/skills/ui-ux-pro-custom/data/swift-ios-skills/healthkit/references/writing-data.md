# Writing HealthKit Data

## Writing Data

Create `HKQuantitySample` objects and save them to the store.

```swift
func saveSteps(count: Double, start: Date, end: Date) async throws {
    let stepType = HKQuantityType(.stepCount)
    let quantity = HKQuantity(unit: .count(), doubleValue: count)

    let sample = HKQuantitySample(
        type: stepType,
        quantity: quantity,
        start: start,
        end: end
    )

    try await healthStore.save(sample)
}

```

Your app can only delete samples it created. Samples from other apps or Apple Watch are read-only.

