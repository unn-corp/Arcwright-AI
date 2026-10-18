---
name: swiftui-animation
description: "Implement or troubleshoot SwiftUI animation, transitions, springs, keyframes, phase animation, and matched geometry. Use for motion behavior while preserving Reduce Motion support and stable view identity."
---

# SwiftUI Animation (iOS 26+)

Review, write, and fix SwiftUI animations. Apply modern animation APIs with
correct timing, transitions, and accessibility handling using Swift 6.2 patterns.

## Essential constraints

- Choose the animation API from the state change and deployment target; use modern APIs only where supported.
- Respect Reduce Motion, bind implicit animation to a value, and keep per-frame closures free of expensive work.
- Keep animated state on the main actor and one matched-geometry source per ID. Verify the actual transition and accessibility behavior.

## Load only the needed topic

Read the relevant recipe below, plus its linked detail when needed. The original
examples and checks remain available without loading every API into the task.

| Topic | Reference |
| --- | --- |
| Triage Workflow | [recipe-01-triage-workflow.md](references/recipe-01-triage-workflow.md) |
| withAnimation (Explicit Animation) | [recipe-02-withanimation-explicit-animation.md](references/recipe-02-withanimation-explicit-animation.md) |
| .animation(_:value:) (Implicit Animation) | [recipe-03-animation-value-implicit-animation.md](references/recipe-03-animation-value-implicit-animation.md) |
| Spring Type (iOS 17+) | [recipe-04-spring-type-ios-17.md](references/recipe-04-spring-type-ios-17.md) |
| PhaseAnimator (iOS 17+) | [recipe-05-phaseanimator-ios-17.md](references/recipe-05-phaseanimator-ios-17.md) |
| KeyframeAnimator (iOS 17+) | [recipe-06-keyframeanimator-ios-17.md](references/recipe-06-keyframeanimator-ios-17.md) |
| @Animatable Macro | [recipe-07-animatable-macro.md](references/recipe-07-animatable-macro.md) |
| matchedGeometryEffect (iOS 14+) | [recipe-08-matchedgeometryeffect-ios-14.md](references/recipe-08-matchedgeometryeffect-ios-14.md) |
| Navigation Zoom Transition (iOS 18+) | [recipe-09-navigation-zoom-transition-ios-18.md](references/recipe-09-navigation-zoom-transition-ios-18.md) |
| Transitions (iOS 17+) | [recipe-10-transitions-ios-17.md](references/recipe-10-transitions-ios-17.md) |
| ContentTransition (iOS 16+) | [recipe-11-contenttransition-ios-16.md](references/recipe-11-contenttransition-ios-16.md) |
| Symbol Effects (iOS 17+) | [recipe-12-symbol-effects-ios-17.md](references/recipe-12-symbol-effects-ios-17.md) |
| Symbol Rendering Modes | [recipe-13-symbol-rendering-modes.md](references/recipe-13-symbol-rendering-modes.md) |
| Common Mistakes | [recipe-14-common-mistakes.md](references/recipe-14-common-mistakes.md) |
| Review Checklist | [recipe-15-review-checklist.md](references/recipe-15-review-checklist.md) |
| References | [recipe-16-references.md](references/recipe-16-references.md) |
