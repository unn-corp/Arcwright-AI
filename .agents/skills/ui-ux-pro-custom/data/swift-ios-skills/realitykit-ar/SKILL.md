---
name: realitykit-ar
description: "Build or debug RealityKit/ARKit experiences: RealityView, entity loading, placement, anchors, gestures, physics, and AR sessions. Use for interactive 3D or augmented reality rather than ordinary SwiftUI layout."
---

# RealityKit + ARKit

Build AR experiences on iOS using RealityKit for rendering and ARKit for world
tracking. Covers `RealityView`, entity management, raycasting, scene
understanding, and gesture-based interactions. Targets Swift 6.2 / iOS 26+.

## Essential constraints

- Check camera permission and handle unavailable AR capability with an appropriate fallback.
- Load models asynchronously; create entities in make and update existing entities in update.
- Interactive entities need collision and input-target components. Retain/cancel subscriptions correctly and verify device performance.

## Load only the needed topic

Read the relevant recipe below, plus its linked detail when needed. The original
examples and checks remain available without loading every API into the task.

| Topic | Reference |
| --- | --- |
| Setup | [recipe-01-setup.md](references/recipe-01-setup.md) |
| RealityView Basics | [recipe-02-realityview-basics.md](references/recipe-02-realityview-basics.md) |
| Loading and Creating Entities | [recipe-03-loading-and-creating-entities.md](references/recipe-03-loading-and-creating-entities.md) |
| Anchoring and Placement | [recipe-04-anchoring-and-placement.md](references/recipe-04-anchoring-and-placement.md) |
| Raycasting | [recipe-05-raycasting.md](references/recipe-05-raycasting.md) |
| Gestures and Interaction | [recipe-06-gestures-and-interaction.md](references/recipe-06-gestures-and-interaction.md) |
| Scene Understanding | [recipe-07-scene-understanding.md](references/recipe-07-scene-understanding.md) |
| Common Mistakes | [recipe-08-common-mistakes.md](references/recipe-08-common-mistakes.md) |
| Review Checklist | [recipe-09-review-checklist.md](references/recipe-09-review-checklist.md) |
| References | [recipe-10-references.md](references/recipe-10-references.md) |
