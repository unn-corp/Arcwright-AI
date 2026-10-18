## Common Mistakes

### DON'T: Skip AR capability checks

Not all devices support AR. Showing a black camera view with no feedback
confuses users.

```swift
// WRONG -- no device check
struct MyARView: View {
    var body: some View {
        RealityView { content in
            // Fails silently on unsupported devices
        }
    }
}

// CORRECT -- check support and show fallback
struct MyARView: View {
    var body: some View {
        if ARWorldTrackingConfiguration.isSupported {
            RealityView { content in
                // AR content
            }
        } else {
            ContentUnavailableView(
                "AR Not Supported",
                systemImage: "arkit",
                description: Text("This device does not support AR.")
            )
        }
    }
}
```

### DON'T: Load heavy models synchronously

Loading large USDZ files on the main thread causes frame drops and hangs.
The `make` closure of `RealityView` is `async` -- use it.

```swift
// WRONG -- synchronous load blocks the main thread
RealityView { content in
    let model = try! Entity.load(named: "large-scene")
    content.add(model)
}

// CORRECT -- async load
RealityView { content in
    if let model = try? await ModelEntity(named: "large-scene") {
        content.add(model)
    }
}
```

### DON'T: Forget collision and input target components for interactive entities

Gestures only work on entities that have both `CollisionComponent` and
`InputTargetComponent`. Without them, taps and drags pass through.

```swift
// WRONG -- entity ignores gestures
let box = ModelEntity(mesh: .generateBox(size: 0.1))
content.add(box)

// CORRECT -- add collision and input components
let box = ModelEntity(
    mesh: .generateBox(size: 0.1),
    materials: [SimpleMaterial(color: .red, isMetallic: false)]
)
box.components.set(CollisionComponent(
    shapes: [.generateBox(size: [0.1, 0.1, 0.1])]
))
box.components.set(InputTargetComponent())
content.add(box)
```

### DON'T: Create new entities in the update closure

The `update` closure runs on every SwiftUI state change. Creating entities
there duplicates content on each render pass.

```swift
// WRONG -- duplicates entities on every state change
RealityView { content in
    // empty
} update: { content in
    let sphere = ModelEntity(mesh: .generateSphere(radius: 0.05))
    content.add(sphere)  // Added again on every update
}

// CORRECT -- create in make, modify in update
RealityView { content in
    let sphere = ModelEntity(mesh: .generateSphere(radius: 0.05))
    sphere.name = "mySphere"
    content.add(sphere)
} update: { content in
    if let sphere = content.entities.first(
        where: { $0.name == "mySphere" }
    ) as? ModelEntity {
        // Modify existing entity
        sphere.position.y = newYPosition
    }
}
```

### DON'T: Ignore camera permission

RealityKit on iOS needs camera access. If the user denies permission, the
view shows a black screen with no explanation.

```swift
// WRONG -- no permission handling
RealityView { content in
    // Black screen if camera denied
}

// CORRECT -- check and request permission
struct ARContainerView: View {
    @State private var cameraAuthorized = false

    var body: some View {
        Group {
            if cameraAuthorized {
                RealityView { content in
                    // AR content
                }
            } else {
                ContentUnavailableView(
                    "Camera Access Required",
                    systemImage: "camera.fill",
                    description: Text("Enable camera in Settings to use AR.")
                )
            }
        }
        .task {
            let status = AVCaptureDevice.authorizationStatus(for: .video)
            if status == .authorized {
                cameraAuthorized = true
            } else if status == .notDetermined {
                cameraAuthorized = await AVCaptureDevice
                    .requestAccess(for: .video)
            }
        }
    }
}
```
