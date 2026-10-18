## Outgoing Call Flow

Use `CXCallController` to request an outgoing call. The system routes the
request through your `CXProviderDelegate`.

```swift
func startOutgoingCall(handle: String, hasVideo: Bool) {
    let uuid = UUID()
    let handle = CXHandle(type: .phoneNumber, value: handle)
    let startAction = CXStartCallAction(call: uuid, handle: handle)
    startAction.isVideo = hasVideo

    let transaction = CXTransaction(action: startAction)
    callController.request(transaction) { error in
        if let error {
            print("Failed to start call: \(error)")
        }
    }
}
```

### Delegate Methods for Outgoing Calls

```swift
extension CallManager {
    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        configureAudioSession()
        // Begin connecting to server
        provider.reportOutgoingCall(
            with: action.callUUID,
            startedConnectingAt: Date()
        )

        connectToServer(callUUID: action.callUUID) {
            provider.reportOutgoingCall(
                with: action.callUUID,
                connectedAt: Date()
            )
        }
        action.fulfill()
    }
}
```
