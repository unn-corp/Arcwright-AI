## Network Reachability

Use `NWPathMonitor` from the Network framework — not third-party
Reachability libraries. Wrap in `AsyncStream` for structured concurrency.

```swift
import Network

func networkStatusStream() -> AsyncStream<NWPath.Status> {
    AsyncStream { continuation in
        let monitor = NWPathMonitor()
        monitor.pathUpdateHandler = { continuation.yield($0.status) }
        continuation.onTermination = { _ in monitor.cancel() }
        monitor.start(queue: DispatchQueue(label: "NetworkMonitor"))
    }
}
```

Check `path.isExpensive` (cellular) and `path.isConstrained` (Low Data
Mode) to adapt behavior (reduce image quality, skip prefetching).
