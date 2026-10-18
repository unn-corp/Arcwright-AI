---
name: widgetkit
description: "Build or debug WidgetKit timelines, configurable/interactive widgets, Lock Screen/StandBy layouts, and Control Center controls. Use live-activities for ActivityKit lifecycle and APNs details."
---

# WidgetKit Timelines and Controls

Choose the surface and deployment target before editing the extension:
static/configurable timeline widget, interactive widget, Control Center control,
or Live Activity. Use the existing app data owner and shared-container contract;
the extension is a separate process with limited execution resources.

## Correctness constraints

- Register widgets in the extension's `WidgetBundle` and keep `@main` on the
  bundle entrypoint. Verify target membership, App Groups, and shared data
  access with the containing app. Make shared reads safe during writes and
  handle missing/old data after installation or migration.
- Use `TimelineProvider` for static configuration and supported
  `AppIntentTimelineProvider` for App Intent configuration. Preserve older-target
  behavior when required. Timeline entries need meaningful dates and display-ready
  state; a reload request is not a guarantee of immediate rendering.
- Keep placeholders synchronous with representative sample data and previews
  fast/deterministic. Do expensive/network work in supported provider callbacks,
  with bounded execution and a usable stale/error state.
- Choose reload policies from actual data cadence and batch meaningful reload
  requests. Respect system budgets; frequent timers and calls after every
  minor mutation do not force widget refreshes.
- Adapt layout to supported families, Dynamic Type, and rendering modes.
  Accessory/Lock Screen appearances may be accented or vibrant; content must
  remain understandable without full-color assets. Check deep links against
  authenticated app routing rather than trusting URL payloads.
- For interactive widgets, use supported intent-backed `Button`/`Toggle`
  actions and update shared state through the existing authorized operation.
  Resolve selected entities again when stale and avoid assuming the app process
  is running.
- For controls, choose the supported static or App Intent configuration and
  control intent/value provider. Verify current state and unavailable/denied
  behavior rather than treating UI state as authoritative.
- For ActivityKit, use a distinct event lifecycle, `ActivityContent`, host
  `NSSupportsLiveActivities`, explicit stale/end behavior, and safe Lock Screen
  content. Load live-activities for lifecycle/APNs details only when needed.
- Gate newer push-reload, CarPlay, glass, and control APIs to actual SDK/runtime
  support. Keep timeline/intent values and model access compatible with the
  project's concurrency settings.

## Validation and completion

Build app and extension and exercise the changed widget/configuration/action.
Check affected families/rendering modes, missing/stale shared data, and routing
from a cold app. For lifecycle, refresh budget, StandBy, or Island behavior,
inspect the relevant device surface when available; previews alone do not
establish scheduling or interprocess behavior.

Stop when the requested widget/control works with its real data and update
policy. State unrun device checks; do not add all widget families, force repeated
reloads, or redesign app persistence for an isolated widget issue.

## Conditional recipes

- [Configuration](references/implementation-guide.md#configuration-types),
  [timelines](references/implementation-guide.md#timelineprovider),
  [App Intent providers](references/implementation-guide.md#appintenttimelineprovider),
  [families](references/implementation-guide.md#widget-families),
  [interactive widgets](references/implementation-guide.md#interactive-widgets-ios-17),
  [Lock Screen](references/implementation-guide.md#lock-screen-widgets),
  [StandBy](references/implementation-guide.md#standby-mode), and
  [newer APIs](references/implementation-guide.md#ios-26-additions).
- [Timeline, reload, controls, and ActivityKit extensions](references/widgetkit-advanced.md)
  for the affected feature.

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
