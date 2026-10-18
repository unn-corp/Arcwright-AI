## Incoming Call Flow

When a VoIP push arrives, report the incoming call to CallKit immediately.
The system displays the native call UI. You must report the call before the
PushKit completion handler returns -- failure to do so causes the system to
terminate your app.

```swift
func reportIncomingCall(
    uuid: UUID,
    handle: String,
    hasVideo: Bool
) async throws {
    let update = CXCallUpdate()
    update.remoteHandle = CXHandle(type: .phoneNumber, value: handle)
    update.hasVideo = hasVideo
    update.localizedCallerName = "Jane Doe"

    try await withCheckedThrowingContinuation {
        (continuation: CheckedContinuation<Void, Error>) in
        provider.reportNewIncomingCall(
            with: uuid,
            update: update
        ) { error in
            if let error {
                continuation.resume(throwing: error)
            } else {
                continuation.resume()
            }
        }
    }
}
```

### Handling the Answer Action

Implement `CXProviderDelegate` to respond when the user answers:

```swift
extension CallManager: CXProviderDelegate {
    func providerDidReset(_ provider: CXProvider) {
        // End all calls, reset audio
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        // Configure audio, connect to call server
        configureAudioSession()
        connectToCallServer(callUUID: action.callUUID)
        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        disconnectFromCallServer(callUUID: action.callUUID)
        action.fulfill()
    }
}
```
