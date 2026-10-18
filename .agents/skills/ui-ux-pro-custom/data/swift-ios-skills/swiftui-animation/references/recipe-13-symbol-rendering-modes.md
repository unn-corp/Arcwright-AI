## Symbol Rendering Modes

Control how SF Symbol layers are colored with `.symbolRenderingMode(_:)`.

| Mode | Effect | When to use |
|------|--------|-------------|
| `.monochrome` | Single color applied uniformly (default) | Toolbars, simple icons matching text |
| `.hierarchical` | Single color with opacity layers for depth | Subtle depth without multiple colors |
| `.multicolor` | System-defined fixed colors per layer | Weather, file types — Apple's intended palette |
| `.palette` | Custom colors per layer via `.foregroundStyle` | Brand colors, custom multi-color icons |

```swift
// Hierarchical — single tint, opacity layers for depth
Image(systemName: "speaker.wave.3.fill")
    .symbolRenderingMode(.hierarchical)
    .foregroundStyle(.blue)

// Palette — custom color per layer
Image(systemName: "person.crop.circle.badge.plus")
    .symbolRenderingMode(.palette)
    .foregroundStyle(.blue, .green)

// Multicolor — system-defined colors
Image(systemName: "cloud.sun.rain.fill")
    .symbolRenderingMode(.multicolor)
```

**Variable color:** `.symbolVariableColor(value:)` for percentage-based fill (signal strength, volume):

```swift
Image(systemName: "wifi")
    .symbolVariableColor(value: signalStrength) // 0.0–1.0
```

> **Docs:** [SymbolRenderingMode](https://sosumi.ai/documentation/swiftui/symbolrenderingmode) · [symbolRenderingMode(_:)](https://sosumi.ai/documentation/swiftui/view/symbolrenderingmode(_:))
