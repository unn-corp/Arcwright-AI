---
name: speech-recognition
description: "Transcribe live or recorded speech with Apple's Speech framework. Use for microphone/speech authorization, audio-engine lifecycle, on-device availability, partial results, and recognition task recovery."
---

# Speech Recognition

Transcribe live and pre-recorded audio to text using Apple's Speech framework.
Covers `SFSpeechRecognizer` (iOS 10+) and the new `SpeechAnalyzer` API (iOS 26+).

## Working rules

- Choose the API for the deployment target: `SpeechAnalyzer` requires iOS 26+;
  `SFSpeechRecognizer` supports earlier targets. Check locale availability and
  install required `AssetInventory` assets before running the analyzer.
- Request speech permission before `SFSpeechRecognizer` use and microphone
  permission for live capture. Add the matching speech/microphone usage descriptions.
- Check and monitor recognizer availability. Check `supportsOnDeviceRecognition`
  before requiring on-device mode; account for the server recognition time limit.
- Cancel an existing recognition task before starting another. On completion,
  error, or cancellation, stop capture, remove its tap, end audio input, and release
  the task/request. Finalize or cancel the analyzer when input ends.
- Treat partial results as replaceable; keep them distinct from final results.

## Load for the task

Read the selected API/input guide and only the supporting topics the task needs.
Full examples and the review checklist remain in these references.

| Task | Guide |
| --- | --- |
| iOS 26+ analyzer, assets, buffers, or file transcription | [SpeechAnalyzer](references/speech-analyzer.md) |
| Recognizer setup, permissions, locales, or on-device/server choice | [Authorization and availability](references/authorization-and-availability.md) |
| `SFSpeechRecognizer` with live microphone audio | [Live audio lifecycle](references/live-audio.md) |
| `SFSpeechRecognizer` with a recorded file | [Audio files](references/audio-files.md) |
| Partial/final text, alternatives, confidence, punctuation, or contextual strings | [Results](references/results.md) |
| Reviewing cleanup, limits, or failure recovery | [Pitfalls, checklist, and API sources](references/review.md) |
