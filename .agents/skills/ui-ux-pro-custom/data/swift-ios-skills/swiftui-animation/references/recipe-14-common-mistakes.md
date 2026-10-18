## Common Mistakes

### 1. Animating without a value binding

```swift
// WRONG — triggers on any state change
.animation(.easeIn)
// CORRECT — bind to specific value
.animation(.easeIn, value: isVisible)
```

### 2. Expensive work inside animation closures

Never run heavy computation in `keyframeAnimator` / `PhaseAnimator` content closures — they execute every frame. Precompute outside, animate only visual properties.

### 3. Missing reduce motion support

```swift
@Environment(\.accessibilityReduceMotion) private var reduceMotion
withAnimation(reduceMotion ? .none : .bouncy) { showDetail = true }
```

### 4. Multiple matchedGeometryEffect sources

Only one view per ID should be visible at a time. Two visible views with the same ID causes undefined layout.

### 5. Using DispatchQueue or UIView.animate

```swift
// WRONG
DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { withAnimation { isVisible = true } }
// CORRECT
withAnimation(.spring.delay(0.5)) { isVisible = true }
```

### 6. Forgetting animation on ContentTransition

```swift
// WRONG — no animation, content transition has no effect
Text("\(count)").contentTransition(.numericText(countsDown: true))
// CORRECT — pair with animation
Text("\(count)").contentTransition(.numericText(countsDown: true)).animation(.snappy, value: count)
```

### 7. navigationTransition on wrong view

Apply `.navigationTransition(.zoom(sourceID:in:))` on the outermost destination view, not inside a container.
