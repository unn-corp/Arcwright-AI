# Background Transfers and Push Triggers

## Background URLSession Downloads

Use `URLSessionConfiguration.background` for downloads that continue even after
the app is suspended or terminated. The system handles the transfer out of
process.

```swift
class DownloadManager: NSObject, URLSessionDownloadDelegate {
    static let shared = DownloadManager()

    private lazy var session: URLSession = {
        let config = URLSessionConfiguration.background(
            withIdentifier: "com.example.app.background-download"
        )
        config.isDiscretionary = true
        config.sessionSendsLaunchEvents = true
        return URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }()

    func startDownload(from url: URL) {
        let task = session.downloadTask(with: url)
        task.earliestBeginDate = Date(timeIntervalSinceNow: 60)
        task.resume()
    }

    func urlSession(
        _ session: URLSession,
        downloadTask: URLSessionDownloadTask,
        didFinishDownloadingTo location: URL
    ) {
        // Move file from tmp before this method returns
        let dest = FileManager.default.urls(
            for: .documentDirectory, in: .userDomainMask
        )[0].appendingPathComponent("download.dat")
        try? FileManager.default.moveItem(at: location, to: dest)
    }

    func urlSession(
        _ session: URLSession,
        task: URLSessionTask,
        didCompleteWithError error: (any Error)?
    ) {
        if let error { print("Download failed: \(error)") }
    }
}
```

Handle app relaunch — store and invoke the system completion handler:

```swift
// In AppDelegate:
func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
) {
    backgroundSessionCompletionHandler = completionHandler
}

// In URLSessionDelegate — call stored handler when events finish:
func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
    Task { @MainActor in
        self.backgroundSessionCompletionHandler?()
        self.backgroundSessionCompletionHandler = nil
    }
}
```

## Background Push Triggers

Silent push notifications wake your app briefly to fetch new content. Set
`content-available: 1` in the push payload.

```json
{ "aps": { "content-available": 1 }, "custom-data": "new-messages" }
```

Handle in AppDelegate:

```swift
func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler:
        @escaping (UIBackgroundFetchResult) -> Void
) {
    Task {
        do {
            let hasNew = try await MessageStore.shared.fetchNewMessages()
            completionHandler(hasNew ? .newData : .noData)
        } catch {
            completionHandler(.failed)
        }
    }
}
```

Enable "Remote notifications" in Background Modes and register:

```swift
UIApplication.shared.registerForRemoteNotifications()
```

