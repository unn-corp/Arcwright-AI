# Speech Recognition Review and Sources

## Common Mistakes

### Not requesting both speech and microphone authorization

```swift
// ❌ DON'T: Only request speech authorization for live audio
SFSpeechRecognizer.requestAuthorization { status in
    // Missing microphone permission — audio engine will fail
    self.startRecording()
}

// ✅ DO: Request both permissions before recording
SFSpeechRecognizer.requestAuthorization { status in
    guard status == .authorized else { return }
    AVAudioSession.sharedInstance().requestRecordPermission { granted in
        guard granted else { return }
        self.startRecording()
    }
}
```

### Not handling availability changes

```swift
// ❌ DON'T: Assume recognizer stays available after initial check
let recognizer = SFSpeechRecognizer()!
// Recognition may fail if network drops or locale changes

// ✅ DO: Monitor availability via delegate
recognizer.delegate = self
func speechRecognizer(
    _ speechRecognizer: SFSpeechRecognizer,
    availabilityDidChange available: Bool
) {
    recordButton.isEnabled = available
}
```

### Not stopping the audio engine when recognition ends

```swift
// ❌ DON'T: Leave audio engine running after recognition finishes
recognizer.recognitionTask(with: request) { result, error in
    if result?.isFinal == true {
        // Audio engine still running, wasting resources and battery
    }
}

// ✅ DO: Clean up all audio resources
recognizer.recognitionTask(with: request) { result, error in
    if result?.isFinal == true || error != nil {
        self.audioEngine.stop()
        self.audioEngine.inputNode.removeTap(onBus: 0)
        self.recognitionRequest?.endAudio()
        self.recognitionRequest = nil
    }
}
```

### Assuming on-device recognition is available for all locales

```swift
// ❌ DON'T: Force on-device without checking support
let request = SFSpeechAudioBufferRecognitionRequest()
request.requiresOnDeviceRecognition = true // May silently fail

// ✅ DO: Check support before requiring on-device
if recognizer.supportsOnDeviceRecognition {
    request.requiresOnDeviceRecognition = true
} else {
    // Fall back to server-based or inform user
}
```

### Not handling the one-minute recognition limit

```swift
// ❌ DON'T: Start one long continuous recognition session
func startRecording() {
    // This will be cut off after ~60 seconds (server-based)
}

// ✅ DO: Restart recognition when approaching the limit
func startRecording() {
    // Use a timer to restart before the limit
    recognitionTimer = Timer.scheduledTimer(withTimeInterval: 55, repeats: false) {
        [weak self] _ in
        self?.restartRecognition()
    }
}
```

### Creating multiple simultaneous recognition tasks

```swift
// ❌ DON'T: Start a new task without canceling the previous one
func startRecording() {
    recognitionTask = recognizer.recognitionTask(with: request) { ... }
    // Previous task is still running — undefined behavior
}

// ✅ DO: Cancel existing task before creating a new one
func startRecording() {
    recognitionTask?.cancel()
    recognitionTask = nil
    recognitionTask = recognizer.recognitionTask(with: request) { ... }
}
```

## Review Checklist

- [ ] `NSSpeechRecognitionUsageDescription` is in Info.plist
- [ ] `NSMicrophoneUsageDescription` is in Info.plist (if using live audio)
- [ ] Authorization is requested before starting recognition
- [ ] `SFSpeechRecognizerDelegate` is set to handle `availabilityDidChange`
- [ ] Audio engine is stopped and tap removed when recognition ends
- [ ] `recognitionRequest.endAudio()` is called when done recording
- [ ] Previous `recognitionTask` is canceled before starting a new one
- [ ] `supportsOnDeviceRecognition` is checked before requiring on-device mode
- [ ] Partial results are handled separately from final (`isFinal`) results
- [ ] One-minute limit is accounted for in server-based recognition
- [ ] For iOS 26+: `AssetInventory` assets are installed before using `SpeechAnalyzer`
- [ ] For iOS 26+: `SpeechTranscriber.supportedLocale(equivalentTo:)` is checked

## References

- [Speech framework](https://sosumi.ai/documentation/speech)
- [SpeechAnalyzer](https://sosumi.ai/documentation/speech/speechanalyzer)
- [SpeechTranscriber](https://sosumi.ai/documentation/speech/speechtranscriber)
- [SFSpeechRecognizer](https://sosumi.ai/documentation/speech/sfspeechrecognizer)
- [SFSpeechAudioBufferRecognitionRequest](https://sosumi.ai/documentation/speech/sfspeechaudiobufferrecognitionrequest)
- [SFSpeechURLRecognitionRequest](https://sosumi.ai/documentation/speech/sfspeechurlrecognitionrequest)
- [SFSpeechRecognitionResult](https://sosumi.ai/documentation/speech/sfspeechrecognitionresult)
- [SFSpeechRecognitionRequest](https://sosumi.ai/documentation/speech/sfspeechrecognitionrequest)
- [AssetInventory](https://sosumi.ai/documentation/speech/assetinventory)
- [Asking Permission to Use Speech Recognition](https://sosumi.ai/documentation/speech/asking-permission-to-use-speech-recognition)
- [Recognizing Speech in Live Audio](https://sosumi.ai/documentation/speech/recognizing-speech-in-live-audio)
