## Review Checklist

- [ ] `NSCameraUsageDescription` set in Info.plist
- [ ] AR device capability checked before presenting AR views
- [ ] Camera permission requested and denial handled with a fallback UI
- [ ] 3D models loaded asynchronously in the `make` closure
- [ ] Entities created in `make`, modified in `update` (not created in `update`)
- [ ] Interactive entities have both `CollisionComponent` and `InputTargetComponent`
- [ ] Collision shapes match the visual size of the entity
- [ ] `SceneEvents.Update` subscriptions used for per-frame logic (not SwiftUI timers)
- [ ] Large scenes use `ModelEntity(named:)` async loading, not `Entity.load(named:)`
- [ ] Anchor entities target appropriate surface types for the use case
- [ ] Entity names set for lookup in the `update` closure
