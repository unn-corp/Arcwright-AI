# Continued Background Processing

## BGContinuedProcessingTask (iOS 26+)

A task initiated in the foreground by a user action that continues running in the
background. The system displays progress via a Live Activity. Conforms to
`ProgressReporting`.

**Availability:** iOS 26.0+, iPadOS 26.0+

Unlike `BGAppRefreshTask` and `BGProcessingTask`, this task starts immediately
from the foreground. The system can terminate it under resource pressure,
prioritizing tasks that report minimal progress first.

```swift
import BackgroundTasks

func startExport() {
    let request = BGContinuedProcessingTaskRequest(
        identifier: "com.example.app.export",
        title: "Exporting Photos",
        subtitle: "Processing 247 items"
    )
    // .queue: begin as soon as possible if can't run immediately
    // .fail: fail submission if can't run immediately
    request.strategy = .queue

    BGTaskScheduler.shared.register(
        forTaskWithIdentifier: "com.example.app.export",
        using: nil
    ) { task in
        let continuedTask = task as! BGContinuedProcessingTask

        Task {
            await self.performExport(task: continuedTask)
        }
    }

    do {
        try BGTaskScheduler.shared.submit(request)
    } catch {
        print("Could not submit continued processing task: \(error)")
    }
}

func performExport(task: BGContinuedProcessingTask) async {
    let items = await PhotoLibrary.shared.itemsToExport()
    let progress = task.progress
    progress.totalUnitCount = Int64(items.count)

    for (index, item) in items.enumerated() {
        if Task.isCancelled { break }

        await PhotoExporter.shared.export(item)
        progress.completedUnitCount = Int64(index + 1)

        // Update the user-facing title/subtitle
        task.updateTitle(
            "Exporting Photos",
            subtitle: "\(index + 1) of \(items.count) complete"
        )
    }

    task.setTaskCompleted(success: !Task.isCancelled)
}
```

Check whether the system supports the resources your task needs:

```swift
let supported = BGTaskScheduler.shared.supportedResources
if supported.contains(.gpu) {
    request.requiredResources = .gpu
}
```

