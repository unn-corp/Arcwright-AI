## Provider Configuration

Create a single `CXProvider` at app launch and keep it alive for the app
lifetime. Configure it with a `CXProviderConfiguration` that describes your
calling capabilities.

```swift
import CallKit

/// CXProvider dispatches all delegate calls to the queue passed to `setDelegate(_:queue:)`.
/// The `let` properties are initialized once and never mutated, making this type
/// safe to share across concurrency domains despite @unchecked Sendable.
final class CallManager: NSObject, @unchecked Sendable {
    static let shared = CallManager()

    let provider: CXProvider
    let callController = CXCallController()

    private override init() {
        let config = CXProviderConfiguration()
        config.localizedName = "My VoIP App"
        config.supportsVideo = true
        config.maximumCallsPerCallGroup = 1
        config.maximumCallGroups = 2
        config.supportedHandleTypes = [.phoneNumber, .emailAddress]
        config.includesCallsInRecents = true

        provider = CXProvider(configuration: config)
        super.init()
        provider.setDelegate(self, queue: nil)
    }
}
```
