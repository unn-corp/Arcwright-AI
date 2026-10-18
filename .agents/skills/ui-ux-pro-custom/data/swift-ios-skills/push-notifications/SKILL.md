---
name: push-notifications
description: "Implement or troubleshoot local notifications, APNs delivery, actions, foreground/tap handling, silent pushes, and rich notification extensions. Live Activity push updates use live-activities."
---

# iOS Notifications and APNs

Separate authorization for visible alerts, APNs device registration, delivery,
and the user action after delivery. Identify the app/server environment and
existing delegate/router before changing any of them.

## Correctness constraints

- Request only the notification presentation options the feature needs, at a
  point where the user has context. Handle denied, provisional, and later
  changed authorization; do not repeatedly request an unavailable prompt.
  Visible alert permission and background push registration are distinct.
- Configure capabilities and registration callbacks in the app lifecycle,
  using `UIApplicationDelegateAdaptor` when appropriate in SwiftUI. Set the
  notification-center delegate early enough to receive events.
- Treat APNs tokens as opaque bytes, not UTF-8 text. Encode them as required
  by the server contract, send every registration/token change, associate the
  correct environment/app/account, and clean up invalid server registrations.
- For local notifications, choose stable request identifiers and the correct
  calendar/time-interval/location trigger. Define replacement/cancellation
  behavior so rescheduling does not create duplicates or resurrect stale work.
- Match server APNs topic, push type, priority, environment, and payload to the
  notification's purpose. Delivery is best-effort; silent pushes and background
  execution are not guaranteed scheduling mechanisms. Keep durable state
  reconciled with the authoritative service.
- Handle foreground presentation deliberately and route taps/actions through
  the existing navigation/state system. Wait until the app is ready, validate
  untrusted payload fields, and honor authentication/authorization before
  opening private data or performing an action.
- Register categories/actions before delivery. For background actions, finish
  work within the system's budget and invoke completion callbacks on every
  path. Avoid repeated side effects when callbacks or server events repeat.
- Do not expose secrets or sensitive content in payloads or Lock Screen text.
  A notification service extension can transform/fetch content but is not an
  automatic privacy guarantee. Handle extension timeout with safe fallback
  content; keep shared-container access and resource use bounded.

## Validation and completion

Build the app and relevant extensions. Exercise the changed path under the
relevant foreground/background/terminated and authorization states. Verify tap
routing after cold launch and inspect actual payload parsing. Use a device and
real APNs environment for delivery/token checks when available; local injection
or mocked callbacks alone do not prove production delivery.

Stop when the requested notification behavior works and the appropriate fallback
is verified. State untested APNs/device paths; do not increase retries, add timers,
or change unrelated permission onboarding to conceal a delivery issue.

## Conditional recipes

- [Permission flow](references/implementation-guide.md#permission-flow),
  [registration](references/implementation-guide.md#apns-registration),
  [local scheduling](references/implementation-guide.md#local-notifications),
  and [remote payloads](references/implementation-guide.md#remote-notification-payload).
- [Delegate handling/deep links and action patterns](references/notification-patterns.md).
- [Rich service/content extension patterns](references/rich-notifications.md).
- [Grouping](references/implementation-guide.md#notification-grouping) only when
  thread/category presentation is part of the change.

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
