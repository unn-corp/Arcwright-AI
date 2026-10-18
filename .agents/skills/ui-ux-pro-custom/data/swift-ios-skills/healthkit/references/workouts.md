# HealthKit Workout Sessions

## Workout Sessions

Use `HKWorkoutSession` and `HKLiveWorkoutBuilder` to track live workouts. Available on watchOS 2+ and iOS 17+.

```swift
func startWorkout() async throws {
    let configuration = HKWorkoutConfiguration()
    configuration.activityType = .running
    configuration.locationType = .outdoor

    let session = try HKWorkoutSession(
        healthStore: healthStore,
        configuration: configuration
    )
    session.delegate = self

    let builder = session.associatedWorkoutBuilder()
    builder.dataSource = HKLiveWorkoutDataSource(
        healthStore: healthStore,
        workoutConfiguration: configuration
    )

    session.startActivity(with: Date())
    try await builder.beginCollection(at: Date())
}

func endWorkout(
    session: HKWorkoutSession,
    builder: HKLiveWorkoutBuilder
) async throws {
    session.end()
    try await builder.endCollection(at: Date())
    try await builder.finishWorkout()
}
```

For full workout lifecycle management including pause/resume, delegate handling, and multi-device mirroring, see [extended patterns](healthkit-patterns.md).

