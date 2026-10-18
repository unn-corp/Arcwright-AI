## RealityView Basics

`RealityView` is the SwiftUI entry point for RealityKit. On iOS, it provides
`RealityViewCameraContent` which renders through the device camera for AR.

```swift
import SwiftUI
import RealityKit

struct ARExperienceView: View {
    var body: some View {
        RealityView { content in
            // content is RealityViewCameraContent on iOS
            let sphere = ModelEntity(
                mesh: .generateSphere(radius: 0.05),
                materials: [SimpleMaterial(
                    color: .blue,
                    isMetallic: true
                )]
            )
            sphere.position = [0, 0, -0.5]  // 50cm in front of camera
            content.add(sphere)
        }
    }
}
```

### Make and Update Pattern

Use the `update` closure to respond to SwiftUI state changes:

```swift
struct PlacementView: View {
    @State private var modelColor: UIColor = .red

    var body: some View {
        RealityView { content in
            let box = ModelEntity(
                mesh: .generateBox(size: 0.1),
                materials: [SimpleMaterial(
                    color: .red,
                    isMetallic: false
                )]
            )
            box.name = "colorBox"
            box.position = [0, 0, -0.5]
            content.add(box)
        } update: { content in
            if let box = content.entities.first(
                where: { $0.name == "colorBox" }
            ) as? ModelEntity {
                box.model?.materials = [SimpleMaterial(
                    color: modelColor,
                    isMetallic: false
                )]
            }
        }

        Button("Change Color") {
            modelColor = modelColor == .red ? .green : .red
        }
    }
}
```
