## .animation(_:value:) (Implicit Animation)

```swift
Circle()
    .scaleEffect(isActive ? 1.2 : 1.0)
    .opacity(isActive ? 1.0 : 0.6)
    .animation(.bouncy, value: isActive)
```
