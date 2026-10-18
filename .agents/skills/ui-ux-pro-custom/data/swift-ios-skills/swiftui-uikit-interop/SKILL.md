---
name: swiftui-uikit-interop
description: "Bridge UIKit and SwiftUI with representables, coordinators, UIHostingController, and hosting configurations. Use for embedded UIKit SDKs, bidirectional state, sizing, lifecycle, and incremental migration."
---

# SwiftUI and UIKit Interop

Choose the direction and owner: wrap a UIKit view/controller in a representable,
embed SwiftUI with a hosting controller, or use a hosting configuration for a
supported cell. Inspect the existing lifecycle, state contract, sizing, and
[toolchain compatibility](../COMPATIBILITY.md) before adding a bridge.

## Correctness constraints

- Create UIKit objects in `makeUIView`/`makeUIViewController`, not on every
  update. Use `update*` to synchronize every changing SwiftUI input, including
  relevant environment values, while preserving UIKit-owned interaction state.
- Install delegates/coordinators during creation and preserve their lifetime.
  A representable struct stored as `coordinator.parent` is a value snapshot:
  refresh it from each `update*` before callbacks need current bindings/closures.
  SwiftUI retains the coordinator but does not update custom stored properties.
- Use bindings for two-way state and closures/delegates for events. Guard
  redundant assignments and feedback loops; do not publish state synchronously
  during an update in a way that re-enters rendering. Preserve ordering and
  cancellation when a deferred callback is actually necessary.
- Keep UIKit work and bridge state in their required isolation domain. Check
  protocol conformances under the project's actual Swift language mode;
  main-queue execution alone does not prove actor safety. Avoid blanket
  `@unchecked Sendable` workarounds around framework handles.
- Avoid retain cycles through delegates, coordinators, stored closures, or
  subscriptions. Release owned observers, timers, sessions, and subscriptions
  in the relevant dismantle/deallocation path. A coordinator is a normal
  reference type; `@State` does not give it SwiftUI view storage.
- Dismiss presented controllers and complete their callbacks on success,
  cancellation, and error as the API requires. Propagate result/failure once
  and keep SwiftUI's presentation state consistent with UIKit dismissal.
- Embed `UIHostingController` using full containment: `addChild`, add/constrain
  the view, then `didMove`. Reverse containment correctly on removal. Choose
  intrinsic sizing, supported sizing options, or constraints deliberately;
  preserve safe areas, trait propagation, Dynamic Type, and resizing.
- Treat the hosted root view and its model ownership deliberately when inputs
  change. Replacing root identity may reset state; a cell's reuse must not
  preserve another item's model or callbacks.

## Validation and completion

Build with the actual SDK/concurrency settings. Exercise initial creation,
repeated updates, input changes after creation, two-way edits, dismissal, and
teardown relevant to the bridge. Explicitly replace a callback/binding and verify
the same UIKit instance uses the new one; inspect for duplicate delegates,
feedback loops, retain cycles, and resizing failures where changed.

Stop when the requested component stays synchronized and cleans up correctly.
State unavailable runtime checks; do not migrate the surrounding UIKit or
SwiftUI architecture to complete an isolated interop change.

## Conditional recipes

- [View representables](references/implementation-guide.md#uiviewrepresentable-protocol),
  [controller representables](references/implementation-guide.md#uiviewcontrollerrepresentable-protocol),
  [coordinators](references/implementation-guide.md#the-coordinator-pattern),
  [hosting](references/implementation-guide.md#uihostingcontroller),
  [sizing](references/implementation-guide.md#sizing-and-layout), and
  [state synchronization](references/implementation-guide.md#state-synchronization-patterns).
- [Complete representable examples](references/representable-recipes.md) and
  [hosting/migration recipes](references/hosting-migration.md) for the relevant
  component, without loading both by default.

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
