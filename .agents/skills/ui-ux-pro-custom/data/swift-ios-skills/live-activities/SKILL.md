---
name: live-activities
description: "Build or debug ActivityKit Live Activities and Dynamic Island layouts, including lifecycle, stale state, token rotation, and APNs updates. Home/Lock Screen timeline widgets use widgetkit."
---

# Live Activities and Dynamic Island

Identify the live event, its authoritative state, supported OS/devices, and
whether updates originate in the app or on the server. Keep the ActivityKit
lifecycle separate from ordinary WidgetKit timeline refreshes.

## Correctness constraints

- Add the extension/configuration and host app's `NSSupportsLiveActivities`
  setting. Check `ActivityAuthorizationInfo` before starting and provide useful
  in-app behavior when activities are unavailable or disabled.
- Separate immutable `ActivityAttributes` from small Codable `ContentState`.
  Pass display-ready, safe-to-show values; Lock Screen content must not expose
  sensitive app state. Match app/server definitions and payload schemas.
- Use supported `ActivityContent` lifecycle APIs. Track the activity ID/owner,
  update the intended instance, and end it on terminal success, failure, or
  cancellation according to the event's lifecycle. Reconcile existing activities
  after app relaunch rather than creating duplicates.
- Set meaningful stale dates and render stale/ended states explicitly. The
  system may delay or stop presentation; never infer authoritative task state
  from whether the Live Activity is visible.
- Design the Lock Screen as a primary surface. Implement relevant compact,
  minimal, and expanded Dynamic Island regions without assuming every device
  has an Island. Keep compact content small, accessible, and glanceable.
- For push updates, observe `pushTokenUpdates` and register every token change
  with the correct server/environment. Use the ActivityKit APNs topic, push
  type, and matching content-state fields. Handle lifecycle events and dismissal
  policy correctly; do not assume delivery or token stability.
- Budget update frequency and payload size. Prefer meaningful event updates
  over frequent app timers, and respect system push/background limitations.
  Use alert/frequent-update capabilities only when the user-visible need and
  entitlements justify them.
- Gate push-to-start, channel updates, scheduling, styles, and cross-device
  surfaces by the actual SDK/runtime support. Keep framework values and mutable
  state in their supported isolation domains, with UI work on the required actor.

## Validation and completion

Build app and extension, then exercise start, update, stale, and end for the
changed path. For server updates, verify the real payload and rotating-token
registration on a device in the intended environment. Inspect relevant Lock
Screen and Island sizes, denied authorization, and relaunch reconciliation.
Simulator previews do not establish device presentation or APNs delivery.

Stop when the requested event lifecycle and presentation work with the intended
update source. State untested device/server paths; do not add timeline polling
or unrelated presentation surfaces to mask an ActivityKit issue.

## Conditional recipes

- [Attributes](references/implementation-guide.md#activityattributes-definition),
  [lifecycle](references/implementation-guide.md#activity-lifecycle),
  [Lock Screen](references/implementation-guide.md#lock-screen-presentation),
  [Island regions](references/implementation-guide.md#dynamic-island),
  [APNs updates](references/implementation-guide.md#push-to-update), and
  [newer capabilities](references/implementation-guide.md#ios-26-additions).
- [Detailed push, presentation, and lifecycle patterns](references/live-activity-patterns.md)
  only for the affected feature.

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
