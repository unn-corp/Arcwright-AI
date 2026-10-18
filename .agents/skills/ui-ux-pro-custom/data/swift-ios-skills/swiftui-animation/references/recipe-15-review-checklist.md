## Review Checklist

- [ ] Animation curve matches intent (spring for natural, ease for mechanical)
- [ ] `withAnimation` wraps state change, not view; `.animation(_:value:)` has explicit `value`
- [ ] `matchedGeometryEffect` has exactly one source per ID; zoom uses matching `id`/`namespace`
- [ ] `@Animatable` macro used instead of manual `animatableData`
- [ ] `accessibilityReduceMotion` checked; no `DispatchQueue`/`UIView.animate`
- [ ] Transitions use `.transition()`; `contentTransition` paired with `.animation(_:value:)`
- [ ] Animated state changes on @MainActor; animation-driving types are Sendable
