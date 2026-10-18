# Background Processing Mistakes

## Common Mistakes

### 1. Missing Info.plist identifiers

```swift
// DON'T: Submit a task whose identifier isn't in BGTaskSchedulerPermittedIdentifiers
let request = BGAppRefreshTaskRequest(identifier: "com.example.app.refresh")
try BGTaskScheduler.shared.submit(request)  // Throws .notPermitted

// DO: Add every identifier to Info.plist BGTaskSchedulerPermittedIdentifiers
// <string>com.example.app.refresh</string>
```

### 2. Not calling setTaskCompleted(success:)

```swift
// DON'T: Return without marking completion -- system penalizes future scheduling
func handleRefresh(task: BGAppRefreshTask) {
    Task {
        let data = try await fetchData()
        await store.update(data)
        // Missing: task.setTaskCompleted(success:)
    }
}

// DO: Always call setTaskCompleted on every code path
func handleRefresh(task: BGAppRefreshTask) {
    let work = Task {
        do {
            let data = try await fetchData()
            await store.update(data)
            task.setTaskCompleted(success: true)
        } catch {
            task.setTaskCompleted(success: false)
        }
    }
    task.expirationHandler = {
        work.cancel()
        task.setTaskCompleted(success: false)
    }
}
```

### 3. Ignoring the expiration handler

```swift
// DON'T: Assume your task will run to completion
func handleCleanup(task: BGProcessingTask) {
    Task { await heavyWork() }
    // No expirationHandler -- system terminates ungracefully
}

// DO: Set expirationHandler to cancel work and mark completed
func handleCleanup(task: BGProcessingTask) {
    let work = Task { await heavyWork() }
    task.expirationHandler = {
        work.cancel()
        task.setTaskCompleted(success: false)
    }
}
```

### 4. Scheduling too frequently

```swift
// DON'T: Request refresh every minute -- system throttles aggressively
request.earliestBeginDate = Date(timeIntervalSinceNow: 60)

// DO: Use reasonable intervals (15+ minutes for refresh)
request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
// earliestBeginDate is a hint -- the system chooses actual launch time
```

### 5. Over-relying on background time

```swift
// DON'T: Start a 10-minute operation assuming it will finish
func handleRefresh(task: BGAppRefreshTask) {
    Task { await tenMinuteSync() }
}

// DO: Design work to be incremental and cancellable
func handleRefresh(task: BGAppRefreshTask) {
    let work = Task {
        for batch in batches {
            try Task.checkCancellation()
            await processBatch(batch)
            await saveBatchProgress(batch)
        }
        task.setTaskCompleted(success: true)
    }
    task.expirationHandler = {
        work.cancel()
        task.setTaskCompleted(success: false)
    }
}
```

