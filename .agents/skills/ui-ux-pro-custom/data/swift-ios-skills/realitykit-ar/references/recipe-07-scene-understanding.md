## Scene Understanding

### Per-Frame Updates

Subscribe to scene update events for continuous processing:

```swift
RealityView { content in
    let entity = ModelEntity(
        mesh: .generateSphere(radius: 0.05),
        materials: [SimpleMaterial(color: .yellow, isMetallic: false)]
    )
    entity.position = [0, 0, -0.5]
    content.add(entity)

    _ = content.subscribe(to: SceneEvents.Update.self) { event in
        let time = Float(event.deltaTime)
        entity.position.y += sin(Float(Date().timeIntervalSince1970)) * time * 0.1
    }
}
```

### visionOS Note

On visionOS, ARKit provides a different API surface with `ARKitSession`,
`WorldTrackingProvider`, and `PlaneDetectionProvider`. These visionOS-specific
types are not available on iOS. On iOS, RealityKit handles world tracking
automatically through `RealityViewCameraContent`.
