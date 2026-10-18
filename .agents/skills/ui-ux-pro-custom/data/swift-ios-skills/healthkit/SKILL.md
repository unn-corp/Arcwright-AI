---
name: healthkit
description: "Query, save, or observe HealthKit data, including authorization, statistics, background delivery, and workout-related samples. Use when working with Apple Health data rather than generic fitness calculations."
---

# HealthKit

Read and write health and fitness data from the Apple Health store. Covers authorization, queries, writing samples, background delivery, and workout sessions. Targets Swift 6.2 / iOS 26+.

## Working rules

- Check `HKHealthStore.isHealthDataAvailable()` before access; reuse one store.
- Enable the HealthKit capability and applicable read/write usage descriptions.
  Request only the types the feature uses. Write authorization status does not
  reveal read permission; handle empty or nil results without assuming denial.
- Prefer async query descriptors and bounded reads; keep heavy work off the main
  thread. Use cumulative statistics for cumulative types and discrete statistics
  for discrete types; choose units that match the sample.
- Delete only samples the app created. For background delivery, enable its
  entitlement, pair it with an observer query, and complete every observer callback.
- End workout sessions, end collection, and finalize the workout builder.

## Load for the task

Read only the relevant guide or section; combine guides when the change crosses
those boundaries. Code examples and the full checklist remain in these references.

| Task | Guide |
| --- | --- |
| Capability, availability, permissions, or empty results | [Setup and authorization](references/authorization.md) |
| Samples, aggregates, or interval charts | [Queries](references/queries.md) |
| Creating and saving samples | [Writing data](references/writing-data.md) |
| Observer callbacks and delivery frequency | [Background delivery](references/background-delivery.md) |
| Starting and ending a workout | [Workout sessions](references/workouts.md) |
| Quantity/category/characteristic types or unit conversion | [Types and units](references/types-and-units.md) |
| Lifecycle delegates, pause/resume, mirroring, anchored queries, or SwiftUI | [Extended patterns](references/healthkit-patterns.md) |
| Reviewing an implementation or diagnosing a common mistake | [Pitfalls, checklist, and API sources](references/review.md) |
