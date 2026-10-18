## Gestures and Interaction

### Drag Gesture on Entities

```swift
struct DraggableARView: View {
    var body: some View {
        RealityView { content in
            let box = ModelEntity(
                mesh: .generateBox(size: 0.1),
                materials: [SimpleMaterial(color: .blue, isMetallic: true)]
            )
            box.position = [0, 0, -0.5]
            box.components.set(CollisionComponent(
                shapes: [.generateBox(size: [0.1, 0.1, 0.1])]
            ))
            box.components.set(InputTargetComponent())
            box.name = "draggable"
            content.add(box)
        }
        .gesture(
            DragGesture()
                .targetedToAnyEntity()
                .onChanged { value in
                    let entity = value.entity
                    guard let parent = entity.parent else { return }
                    entity.position = value.convert(
                        value.location3D,
                        from: .local,
                        to: parent
                    )
                }
        )
    }
}
```

### Tap to Select

```swift
.gesture(
    SpatialTapGesture()
        .targetedToAnyEntity()
        .onEnded { value in
            let tappedEntity = value.entity
            highlightEntity(tappedEntity)
        }
)
```
