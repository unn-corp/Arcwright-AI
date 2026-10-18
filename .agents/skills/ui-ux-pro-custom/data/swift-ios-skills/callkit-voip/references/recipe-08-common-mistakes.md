## Common Mistakes

### DON'T: Fail to report a call on VoIP push receipt

If your PushKit delegate receives a VoIP push but does not call
`reportNewIncomingCall(with:update:completion:)`, iOS terminates your app and
may stop delivering pushes entirely.

```swift
// WRONG -- no call reported
func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
) {
    // Just process data, no call reported
    processPayload(payload)
    completion()
}

// CORRECT -- always report a call
func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
) {
    let uuid = UUID()
    provider.reportNewIncomingCall(
        with: uuid, update: makeUpdate(from: payload)
    ) { _ in completion() }
}
```

### DON'T: Start audio before CallKit activates the session

Starting your audio engine before `provider(_:didActivate:)` causes silence
or immediate deactivation. CallKit manages session priority with the system.

```swift
// WRONG
func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    startAudioEngine()  // Too early -- session not active yet
    action.fulfill()
}

// CORRECT
func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    prepareAudioEngine()  // Prepare, but do not start
    action.fulfill()
}

func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
    startAudioEngine()  // Now it's safe
}
```

### DON'T: Forget to call action.fulfill() or action.fail()

Failing to fulfill or fail an action leaves the call in a limbo state and
triggers the timeout handler.

```swift
// WRONG
func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    connectToServer()
    // Forgot action.fulfill()
}

// CORRECT
func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    connectToServer()
    action.fulfill()
}
```

### DON'T: Ignore push token refresh

The VoIP push token can change at any time. If your server has a stale token,
pushes silently fail and incoming calls never arrive.

```swift
// WRONG -- only send token once at first registration
func pushRegistry(
    _ registry: PKPushRegistry,
    didUpdate pushCredentials: PKPushCredentials,
    for type: PKPushType
) {
    // Token saved locally but never updated on server
}

// CORRECT -- always update server
func pushRegistry(
    _ registry: PKPushRegistry,
    didUpdate pushCredentials: PKPushCredentials,
    for type: PKPushType
) {
    let token = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
    sendTokenToServer(token)  // Always send to server
}
```
