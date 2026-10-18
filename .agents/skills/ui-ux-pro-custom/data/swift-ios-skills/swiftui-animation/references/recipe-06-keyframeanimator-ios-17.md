## KeyframeAnimator (iOS 17+)

Animate multiple properties along independent timelines.

```swift
struct AnimValues {
    var scale: Double = 1.0
    var yOffset: Double = 0.0
    var opacity: Double = 1.0
}

struct BounceView: View {
    @State private var trigger = false

    var body: some View {
        Image(systemName: "star.fill")
            .font(.largeTitle)
            .keyframeAnimator(
                initialValue: AnimValues(),
                trigger: trigger
            ) { content, value in
                content
                    .scaleEffect(value.scale)
                    .offset(y: value.yOffset)
                    .opacity(value.opacity)
            } keyframes: { _ in
                KeyframeTrack(\.scale) {
                    SpringKeyframe(1.5, duration: 0.3)
                    CubicKeyframe(1.0, duration: 0.4)
                }
                KeyframeTrack(\.yOffset) {
                    CubicKeyframe(-30, duration: 0.2)
                    CubicKeyframe(0, duration: 0.4)
                }
                KeyframeTrack(\.opacity) {
                    LinearKeyframe(0.6, duration: 0.15)
                    LinearKeyframe(1.0, duration: 0.25)
                }
            }
            .onTapGesture { trigger.toggle() }
    }
}
```

Keyframe types: `LinearKeyframe` (linear), `CubicKeyframe` (smooth curve),
`SpringKeyframe` (spring physics), `MoveKeyframe` (instant jump).

Use `repeating: true` for looping keyframe animations.
