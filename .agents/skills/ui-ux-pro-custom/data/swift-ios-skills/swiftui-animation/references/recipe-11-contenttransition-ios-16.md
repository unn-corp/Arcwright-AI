## ContentTransition (iOS 16+)

Animate in-place content changes without insertion/removal.

```swift
Text("\(score)")
    .contentTransition(.numericText(countsDown: false))
    .animation(.snappy, value: score)

// For SF Symbols
Image(systemName: isMuted ? "speaker.slash" : "speaker.wave.3")
    .contentTransition(.symbolEffect(.replace.downUp))
```

Types: `.identity`, `.interpolate`, `.opacity`,
`.numericText(countsDown:)`, `.numericText(value:)`, `.symbolEffect`.
