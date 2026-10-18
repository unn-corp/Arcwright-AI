# Scheduled Refresh and Processing Tasks

## BGAppRefreshTask Patterns

Short-lived tasks (~30 seconds) for fetching small data updates. The system
decides when to launch based on usage patterns.

```swift
func scheduleAppRefresh() {
    let request = BGAppRefreshTaskRequest(
        identifier: "com.example.app.refresh"
    )
    request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)

    do {
        try BGTaskScheduler.shared.submit(request)
    } catch {
        print("Could not schedule app refresh: \(error)")
    }
}

func handleAppRefresh(task: BGAppRefreshTask) {
    // Schedule the next refresh before doing work
    scheduleAppRefresh()

    let fetchTask = Task {
        do {
            let data = try await APIClient.shared.fetchLatestFeed()
            await FeedStore.shared.update(with: data)
            task.setTaskCompleted(success: true)
        } catch {
            task.setTaskCompleted(success: false)
        }
    }

    // CRITICAL: Handle expiration -- system can revoke time at any moment
    task.expirationHandler = {
        fetchTask.cancel()
        task.setTaskCompleted(success: false)
    }
}
```

## BGProcessingTask Patterns

Long-running tasks (minutes) for maintenance, data processing, or cleanup.
Runs only when device is idle and (optionally) charging.

```swift
func scheduleProcessingTask() {
    let request = BGProcessingTaskRequest(
        identifier: "com.example.app.db-cleanup"
    )
    request.requiresNetworkConnectivity = false
    request.requiresExternalPower = true
    request.earliestBeginDate = Date(timeIntervalSinceNow: 60 * 60)

    do {
        try BGTaskScheduler.shared.submit(request)
    } catch {
        print("Could not schedule processing task: \(error)")
    }
}

func handleDatabaseCleanup(task: BGProcessingTask) {
    scheduleProcessingTask()

    let cleanupTask = Task {
        do {
            try await DatabaseManager.shared.purgeExpiredRecords()
            try await DatabaseManager.shared.rebuildIndexes()
            task.setTaskCompleted(success: true)
        } catch {
            task.setTaskCompleted(success: false)
        }
    }

    task.expirationHandler = {
        cleanupTask.cancel()
        task.setTaskCompleted(success: false)
    }
}
```

