## Loading and Creating Entities

### Loading from USDZ Files

Load 3D models asynchronously to avoid blocking the main thread:

```swift
RealityView { content in
    if let robot = try? await ModelEntity(named: "robot") {
        robot.position = [0, -0.2, -0.8]
        robot.scale = [0.01, 0.01, 0.01]
        content.add(robot)
    }
}
```

### Programmatic Mesh Generation

```swift
// Box
let box = ModelEntity(
    mesh: .generateBox(size: [0.1, 0.2, 0.1], cornerRadius: 0.005),
    materials: [SimpleMaterial(color: .gray, isMetallic: true)]
)

// Sphere
let sphere = ModelEntity(
    mesh: .generateSphere(radius: 0.05),
    materials: [SimpleMaterial(color: .blue, roughness: 0.2, isMetallic: true)]
)

// Plane
let plane = ModelEntity(
    mesh: .generatePlane(width: 0.3, depth: 0.3),
    materials: [SimpleMaterial(color: .green, isMetallic: false)]
)
```

### Adding Components

Entities use an ECS (Entity Component System) architecture. Add components
to give entities behavior:

```swift
let box = ModelEntity(
    mesh: .generateBox(size: 0.1),
    materials: [SimpleMaterial(color: .red, isMetallic: false)]
)

// Make it respond to physics
box.components.set(PhysicsBodyComponent(
    massProperties: .default,
    material: .default,
    mode: .dynamic
))

// Add collision shape for interaction
box.components.set(CollisionComponent(
    shapes: [.generateBox(size: [0.1, 0.1, 0.1])]
))

// Enable input targeting for gestures
box.components.set(InputTargetComponent())
```
