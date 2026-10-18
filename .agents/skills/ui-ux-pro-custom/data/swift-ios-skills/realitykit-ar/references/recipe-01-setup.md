## Setup

### Project Configuration

1. Add `NSCameraUsageDescription` to Info.plist
2. For iOS, RealityKit uses the device camera by default via `RealityViewCameraContent` (iOS 18+, macOS 15+)
3. No additional capabilities required for basic AR on iOS

### Device Requirements

AR features require devices with an A9 chip or later. Always verify support
before presenting AR UI.

```swift
import ARKit

guard ARWorldTrackingConfiguration.isSupported else {
    showUnsupportedDeviceMessage()
    return
}
```

### Key Types

| Type | Platform | Role |
|---|---|---|
| `RealityView` | iOS 18+, visionOS 1+ | SwiftUI view that hosts RealityKit content |
| `RealityViewCameraContent` | iOS 18+, macOS 15+ | Content displayed through the device camera |
| `Entity` | All | Base class for all scene objects |
| `ModelEntity` | All | Entity with a visible 3D model |
| `AnchorEntity` | All | Tethers entities to a real-world anchor |
