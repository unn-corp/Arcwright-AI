# Speech Recognition Results

## Handling Results

### Partial vs final results

```swift
let request = SFSpeechAudioBufferRecognitionRequest()
request.shouldReportPartialResults = true  // default is true

recognizer.recognitionTask(with: request) { result, error in
    guard let result else { return }

    if result.isFinal {
        // Final transcription — recognition is complete
        let final = result.bestTranscription.formattedString
    } else {
        // Partial result — may change as more audio is processed
        let partial = result.bestTranscription.formattedString
    }
}
```

### Accessing alternative transcriptions and confidence

```swift
recognizer.recognitionTask(with: request) { result, error in
    guard let result else { return }

    // Best transcription
    let best = result.bestTranscription

    // All alternatives (sorted by confidence, descending)
    for transcription in result.transcriptions {
        for segment in transcription.segments {
            print("\(segment.substring): \(segment.confidence)")
        }
    }
}
```

### Adding punctuation (iOS 16+)

```swift
let request = SFSpeechAudioBufferRecognitionRequest()
request.addsPunctuation = true
```

### Contextual strings

Improve recognition of domain-specific terms:

```swift
let request = SFSpeechAudioBufferRecognitionRequest()
request.contextualStrings = ["SwiftUI", "Xcode", "CloudKit"]
```

