## Spring Type (iOS 17+)

Four initializer forms for different mental models.

```swift
// Perceptual (preferred)
Spring(duration: 0.5, bounce: 0.3)

// Physical
Spring(mass: 1.0, stiffness: 100.0, damping: 10.0)

// Response-based
Spring(response: 0.5, dampingRatio: 0.7)

// Settling-based
Spring(settlingDuration: 1.0, dampingRatio: 0.8)
```

Three presets mirror Animation presets: `.smooth`, `.snappy`, `.bouncy`.
