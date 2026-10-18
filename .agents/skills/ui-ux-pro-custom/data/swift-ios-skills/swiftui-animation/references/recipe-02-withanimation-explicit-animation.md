## withAnimation (Explicit Animation)

```swift
withAnimation(.spring) { isExpanded.toggle() }

// With completion (iOS 17+)
withAnimation(.smooth(duration: 0.35), completionCriteria: .logicallyComplete) {
    isExpanded = true
} completion: { loadContent() }
```
