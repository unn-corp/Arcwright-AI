## PushKit VoIP Registration

Register for VoIP pushes at every app launch. Send the token to your server
whenever it changes.

```swift
import PushKit

final class PushManager: NSObject, PKPushRegistryDelegate {
    let registry: PKPushRegistry

    override init() {
        registry = PKPushRegistry(queue: .main)
        super.init()
        registry.delegate = self
        registry.desiredPushTypes = [.voIP]
    }

    func pushRegistry(
        _ registry: PKPushRegistry,
        didUpdate pushCredentials: PKPushCredentials,
        for type: PKPushType
    ) {
        let token = pushCredentials.token
            .map { String(format: "%02x", $0) }
            .joined()
        // Send token to your server
        sendTokenToServer(token)
    }

    func pushRegistry(
        _ registry: PKPushRegistry,
        didReceiveIncomingPushWith payload: PKPushPayload,
        for type: PKPushType,
        completion: @escaping () -> Void
    ) {
        guard type == .voIP else {
            completion()
            return
        }

        let callUUID = UUID()
        let handle = payload.dictionaryPayload["handle"] as? String ?? "Unknown"

        Task {
            do {
                try await CallManager.shared.reportIncomingCall(
                    uuid: callUUID,
                    handle: handle,
                    hasVideo: false
                )
            } catch {
                // Call was filtered by DND or block list
            }
            completion()
        }
    }
}
```
