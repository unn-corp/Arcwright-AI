## PhaseAnimator (iOS 17+)

Cycle through discrete phases with per-phase animation curves.

```swift
enum PulsePhase: CaseIterable {
    case idle, grow, shrink
}

struct PulsingDot: View {
    var body: some View {
        PhaseAnimator(PulsePhase.allCases) { phase in
            Circle()
                .frame(width: 40, height: 40)
                .scaleEffect(phase == .grow ? 1.4 : 1.0)
                .opacity(phase == .shrink ? 0.5 : 1.0)
        } animation: { phase in
            switch phase {
            case .idle: .easeIn(duration: 0.2)
            case .grow: .spring(duration: 0.4, bounce: 0.3)
            case .shrink: .easeOut(duration: 0.3)
            }
        }
    }
}
```

Trigger-based variant runs one cycle per trigger change:

```swift
PhaseAnimator(PulsePhase.allCases, trigger: tapCount) { phase in
    // ...
} animation: { _ in .spring(duration: 0.4) }
```
