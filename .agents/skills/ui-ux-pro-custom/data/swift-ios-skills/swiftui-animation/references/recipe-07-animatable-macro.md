## @Animatable Macro

Replaces manual `AnimatableData` boilerplate. Attach to any type with
animatable stored properties.

```swift
// WRONG: Manual AnimatableData (verbose, error-prone)
struct WaveShape: Shape, Animatable {
    var frequency: Double
    var amplitude: Double
    var phase: Double

    var animatableData: AnimatablePair<Double, AnimatablePair<Double, Double>> {
        get { AnimatablePair(frequency, AnimatablePair(amplitude, phase)) }
        set {
            frequency = newValue.first
            amplitude = newValue.second.first
            phase = newValue.second.second
        }
    }
    // ...
}

// CORRECT: @Animatable macro synthesizes animatableData
@Animatable
struct WaveShape: Shape {
    var frequency: Double
    var amplitude: Double
    var phase: Double
    @AnimatableIgnored var lineWidth: CGFloat

    func path(in rect: CGRect) -> Path {
        // draw wave using frequency, amplitude, phase
    }
}
```

Rules:
- Stored properties must conform to `VectorArithmetic`.
- Use `@AnimatableIgnored` to exclude non-animatable properties.
- Computed properties are never included.
