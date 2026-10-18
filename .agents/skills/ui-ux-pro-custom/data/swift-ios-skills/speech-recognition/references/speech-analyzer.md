# SpeechAnalyzer Transcription

## SpeechAnalyzer (iOS 26+)

`SpeechAnalyzer` is an actor-based API introduced in iOS 26 that replaces
`SFSpeechRecognizer` for new projects. It uses Swift concurrency, `AsyncSequence`
for results, and supports modular analysis via `SpeechTranscriber`.

### Basic transcription with SpeechAnalyzer

```swift
import Speech

// 1. Create a transcriber module
guard let locale = SpeechTranscriber.supportedLocale(
    equivalentTo: Locale.current
) else { return }
let transcriber = SpeechTranscriber(locale: locale, preset: .offlineTranscription)

// 2. Ensure assets are installed
if let request = try await AssetInventory.assetInstallationRequest(
    supporting: [transcriber]
) {
    try await request.downloadAndInstall()
}

// 3. Create input stream and analyzer
let (inputSequence, inputBuilder) = AsyncStream.makeStream(of: AnalyzerInput.self)
let audioFormat = await SpeechAnalyzer.bestAvailableAudioFormat(
    compatibleWith: [transcriber]
)
let analyzer = SpeechAnalyzer(modules: [transcriber])

// 4. Feed audio buffers (from AVAudioEngine or file)
Task {
    // Append PCM buffers converted to audioFormat
    let pcmBuffer: AVAudioPCMBuffer = // ... your audio buffer
    inputBuilder.yield(AnalyzerInput(buffer: pcmBuffer))
    inputBuilder.finish()
}

// 5. Consume results
Task {
    for try await result in transcriber.results {
        let text = String(result.text.characters)
        print(text)
    }
}

// 6. Run analysis
let lastSampleTime = try await analyzer.analyzeSequence(inputSequence)

// 7. Finalize
if let lastSampleTime {
    try await analyzer.finalizeAndFinish(through: lastSampleTime)
} else {
    try analyzer.cancelAndFinishNow()
}
```

### Transcribing an audio file with SpeechAnalyzer

```swift
let transcriber = SpeechTranscriber(locale: locale, preset: .offlineTranscription)
let audioFile = try AVAudioFile(forReading: fileURL)
let analyzer = SpeechAnalyzer(
    inputAudioFile: audioFile, modules: [transcriber], finishAfterFile: true
)
for try await result in transcriber.results {
    print(String(result.text.characters))
}
```

### Key differences from SFSpeechRecognizer

| Feature | SFSpeechRecognizer | SpeechAnalyzer |
|---|---|---|
| Concurrency | Callbacks/delegates | async/await + AsyncSequence |
| Type | `class` | `actor` |
| Modules | Monolithic | Composable (`SpeechTranscriber`, `SpeechDetector`) |
| Audio input | `append(_:)` on request | `AsyncStream<AnalyzerInput>` |
| Availability | iOS 10+ | iOS 26+ |
| On-device | `requiresOnDeviceRecognition` | Asset-based via `AssetInventory` |

