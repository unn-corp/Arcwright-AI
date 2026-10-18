## Triage Workflow

### Step 1: Identify the animation category

| Category | API | When to use |
|---|---|---|
| State-driven | `withAnimation`, `.animation(_:value:)` | Simple property changes |
| Multi-phase | `PhaseAnimator` | Sequenced multi-step animations |
| Keyframe | `KeyframeAnimator` | Complex multi-property choreography |
| Shared element | `matchedGeometryEffect` | Layout-driven hero transitions |
| Navigation | `matchedTransitionSource` + `.navigationTransition(.zoom)` | NavigationStack push/pop zoom |
| View lifecycle | `.transition()` | Insertion and removal |
| Text content | `.contentTransition()` | In-place text/number changes |
| Symbol | `.symbolEffect()` | SF Symbol animations |
| Custom | `CustomAnimation` protocol | Novel timing curves |

### Step 2: Choose the animation curve

```swift
// Timing curves
.linear                              // constant speed
.easeIn(duration: 0.3)              // slow start
.easeOut(duration: 0.3)             // slow end
.easeInOut(duration: 0.3)           // slow start and end

// Spring presets (preferred for natural motion)
.smooth                              // no bounce, fluid
.smooth(duration: 0.5, extraBounce: 0.0)
.snappy                              // small bounce, responsive
.snappy(duration: 0.4, extraBounce: 0.1)
.bouncy                              // visible bounce, playful
.bouncy(duration: 0.5, extraBounce: 0.2)

// Custom spring
.spring(duration: 0.5, bounce: 0.3, blendDuration: 0.0)
.spring(Spring(duration: 0.6, bounce: 0.2), blendDuration: 0.0)
.interactiveSpring(response: 0.15, dampingFraction: 0.86)
```

### Step 3: Apply and verify

- Confirm animation triggers on the correct state change.
- Test with Accessibility > Reduce Motion enabled.
- Verify no expensive work runs inside animation content closures.
