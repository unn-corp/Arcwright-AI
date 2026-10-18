## Anchoring and Placement

### AnchorEntity

Use `AnchorEntity` to anchor content to detected surfaces or world positions:

```swift
RealityView { content in
    // Anchor to a horizontal surface
    let floorAnchor = AnchorEntity(.plane(
        .horizontal,
        classification: .floor,
        minimumBounds: [0.2, 0.2]
    ))

    let model = ModelEntity(
        mesh: .generateBox(size: 0.1),
        materials: [SimpleMaterial(color: .orange, isMetallic: false)]
    )
    floorAnchor.addChild(model)
    content.add(floorAnchor)
}
```

### Anchor Targets

| Target | Description |
|---|---|
| `.plane(.horizontal, ...)` | Horizontal surfaces (floors, tables) |
| `.plane(.vertical, ...)` | Vertical surfaces (walls) |
| `.plane(.any, ...)` | Any detected plane |
| `.world(transform:)` | Fixed world-space position |
