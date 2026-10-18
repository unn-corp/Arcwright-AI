## Symbol Effects (iOS 17+)

Animate SF Symbols with semantic effects.

```swift
// Discrete (triggers on value change)
Image(systemName: "bell.fill")
    .symbolEffect(.bounce, value: notificationCount)

Image(systemName: "arrow.clockwise")
    .symbolEffect(.wiggle.clockwise, value: refreshCount)

// Indefinite (active while condition holds)
Image(systemName: "wifi")
    .symbolEffect(.pulse, isActive: isSearching)

Image(systemName: "mic.fill")
    .symbolEffect(.breathe, isActive: isRecording)

// Variable color with chaining
Image(systemName: "speaker.wave.3.fill")
    .symbolEffect(
        .variableColor.iterative.reversing.dimInactiveLayers,
        options: .repeating,
        isActive: isPlaying
    )
```

All effects: `.bounce`, `.pulse`, `.variableColor`, `.scale`, `.appear`,
`.disappear`, `.replace`, `.breathe`, `.rotate`, `.wiggle`.

Scope: `.byLayer`, `.wholeSymbol`. Direction varies per effect.
