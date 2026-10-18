---
name: core-bluetooth
description: "Implement or debug BLE central/peripheral flows with Core Bluetooth: discovery, connections, characteristic I/O, background operation, and restoration. Use for BLE, rather than general networking or classic Bluetooth audio."
---

# Core Bluetooth

Determine whether the app is a BLE central, peripheral, or both; identify the
services/characteristics and existing connection owner. Inspect deployment
requirements, authorization, Info.plist, background modes, and the project's
Swift isolation settings before changing callback ownership.

## Correctness constraints

- Wait for manager state `.poweredOn` before scanning, advertising, or
  connecting. Handle unsupported, unauthorized, resetting, and powered-off
  states instead of treating them as permanent connection failures.
- Filter discovery to required service UUIDs when known. Stop scans once the
  relevant device is found or the owning operation ends; avoid continuous
  duplicate discovery unless the feature needs it.
- Retain discovered peripherals while using them and install their delegate
  before service discovery. Follow the asynchronous sequence: discovery,
  connect callback, service discovery, characteristic discovery, then I/O.
  Do not assume a connection or subscription completes synchronously.
- Check characteristic read/write/notify properties. Choose write-with-response
  or write-without-response accordingly, respect transport limits/readiness,
  and handle acknowledgment/error callbacks. Treat bytes as protocol data with
  explicit validation, not automatically trustworthy application state.
- Keep central/peripheral managers, peripheral handles, delegates, and mutable
  protocol state in one declared isolation domain. `queue: nil` gives main-queue
  delegate delivery; it does not by itself prove a Swift actor-isolated protocol
  conformance. On a dedicated queue, pass immutable Sendable application values
  to UI state rather than moving Core Bluetooth objects across actors.
- Compile protocol conformances under the actual language mode. Do not silence
  diagnostics with `@unchecked Sendable` framework extensions or unchecked
  actor hops around non-Sendable callback arguments. See the
  [compatibility note](../COMPATIBILITY.md).
- Enable background modes only for the required role. Expect different scan and
  advertising behavior in the background. If restoration is needed, preserve
  manager identifiers and rebuild retained state from restoration callbacks.
- Handle disconnect/cancel, stale services, unavailable peers, and bounded
  reconnect attempts. Tear down scans, notifications, and operation ownership
  when the feature no longer needs them.

## Validation and completion

Build with actual concurrency checks, then exercise the changed protocol on
relevant BLE hardware. Check powered-off/denied state, reconnect, supported I/O,
and foreground/background or restoration transitions when changed. A simulator
or mocked callback sequence does not establish radio/background behavior.

Stop when the requested exchange and lifecycle paths work with the real peer.
Report unavailable hardware checks; do not add another BLE abstraction or a
permanent retry loop to hide an unresolved protocol issue.

## Conditional recipes

- [Setup](references/implementation-guide.md#setup),
  [scanning](references/implementation-guide.md#central-role-scanning),
  [connecting](references/implementation-guide.md#central-role-connecting),
  [service discovery](references/implementation-guide.md#discovering-services-and-characteristics),
  and [characteristic I/O](references/implementation-guide.md#reading-writing-and-notifications).
- [Peripheral advertising](references/implementation-guide.md#peripheral-role-advertising),
  [background behavior](references/implementation-guide.md#background-ble),
  [restoration](references/implementation-guide.md#state-restoration), and
  [extended BLE patterns](references/ble-patterns.md).

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
