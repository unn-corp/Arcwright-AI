# Recorded Audio Transcription

## Pre-Recorded Audio File Recognition

Use `SFSpeechURLRecognitionRequest` for audio files on disk:

```swift
func transcribeFile(at url: URL) async throws -> String {
    guard let recognizer = SFSpeechRecognizer(), recognizer.isAvailable else {
        throw SpeechError.unavailable
    }
    let request = SFSpeechURLRecognitionRequest(url: url)
    request.shouldReportPartialResults = false

    return try await withCheckedThrowingContinuation { continuation in
        recognizer.recognitionTask(with: request) { result, error in
            if let error {
                continuation.resume(throwing: error)
            } else if let result, result.isFinal {
                continuation.resume(
                    returning: result.bestTranscription.formattedString
                )
            }
        }
    }
}
```

