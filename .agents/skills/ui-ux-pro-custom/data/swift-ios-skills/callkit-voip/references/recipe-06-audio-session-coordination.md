## Audio Session Coordination

CallKit manages audio session activation/deactivation. Configure your audio
session when CallKit tells you to, not before.

```swift
extension CallManager {
    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        // Audio session is now active -- start audio engine / WebRTC
        startAudioEngine()
    }

    func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        // Audio session deactivated -- stop audio engine
        stopAudioEngine()
    }

    func configureAudioSession() {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(
                .playAndRecord,
                mode: .voiceChat,
                options: [.allowBluetooth, .allowBluetoothA2DP]
            )
        } catch {
            print("Audio session configuration failed: \(error)")
        }
    }
}
```
