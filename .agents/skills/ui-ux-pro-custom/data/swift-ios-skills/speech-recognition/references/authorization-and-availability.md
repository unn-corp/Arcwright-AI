# Speech Authorization and Availability

## SFSpeechRecognizer Setup

### Creating a recognizer with locale

```swift
import Speech

// Default locale (user's current language)
let recognizer = SFSpeechRecognizer()

// Specific locale
let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))

// Check if recognition is available for this locale
guard let recognizer, recognizer.isAvailable else {
    print("Speech recognition not available")
    return
}
```

### Monitoring availability changes

```swift
final class SpeechManager: NSObject, SFSpeechRecognizerDelegate {
    private let recognizer = SFSpeechRecognizer()!

    override init() {
        super.init()
        recognizer.delegate = self
    }

    func speechRecognizer(
        _ speechRecognizer: SFSpeechRecognizer,
        availabilityDidChange available: Bool
    ) {
        // Update UI — disable record button when unavailable
    }
}
```

## Authorization

Request **both** speech recognition and microphone permissions before starting
live transcription. Add these keys to `Info.plist`:

- `NSSpeechRecognitionUsageDescription`
- `NSMicrophoneUsageDescription`

```swift
import Speech
import AVFoundation

func requestPermissions() async -> Bool {
    let speechStatus = await withCheckedContinuation { continuation in
        SFSpeechRecognizer.requestAuthorization { status in
            continuation.resume(returning: status)
        }
    }
    guard speechStatus == .authorized else { return false }

    let micStatus: Bool
    if #available(iOS 17, *) {
        micStatus = await AVAudioApplication.requestRecordPermission()
    } else {
        micStatus = await withCheckedContinuation { continuation in
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                continuation.resume(returning: granted)
            }
        }
    }
    return micStatus
}
```

## On-Device vs Server Recognition

On-device recognition (iOS 13+) works offline but supports fewer locales:

```swift
let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))!

// Check if on-device is supported for this locale
if recognizer.supportsOnDeviceRecognition {
    let request = SFSpeechAudioBufferRecognitionRequest()
    request.requiresOnDeviceRecognition = true  // Force on-device
}
```

> **Tip:** On-device recognition avoids network latency and the one-minute
> audio limit imposed by server-based recognition. However, accuracy may be
> lower and not all locales are supported. Check `supportsOnDeviceRecognition`
> before forcing on-device mode.

