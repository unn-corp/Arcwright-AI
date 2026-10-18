## Review Checklist

- [ ] VoIP background mode enabled in capabilities
- [ ] Single `CXProvider` instance created at app launch and retained
- [ ] `CXProviderDelegate` set before reporting any calls
- [ ] Every VoIP push results in a `reportNewIncomingCall` call
- [ ] `action.fulfill()` or `action.fail()` called for every provider delegate action
- [ ] Audio engine started only after `provider(_:didActivate:)` callback
- [ ] Audio engine stopped in `provider(_:didDeactivate:)` callback
- [ ] Audio session category set to `.playAndRecord` with `.voiceChat` mode
- [ ] VoIP push token sent to server on every `didUpdate pushCredentials` callback
- [ ] `PKPushRegistry` created at every app launch (not lazily)
- [ ] Call Directory phone numbers added in ascending E.164 order
- [ ] `CXCallUpdate` populated with `localizedCallerName` and `remoteHandle`
- [ ] Outgoing calls report `startedConnectingAt` and `connectedAt` timestamps
