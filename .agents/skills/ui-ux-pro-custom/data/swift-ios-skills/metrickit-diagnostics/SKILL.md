---
name: metrickit-diagnostics
description: "Collect or investigate MetricKit performance payloads and crash/hang diagnostics. Use for subscriber lifecycle, payload decoding, symbolication, aggregation, and privacy-aware production diagnostics."
---

# MetricKit Diagnostics

Collect aggregated performance metrics and crash diagnostics from production
devices using MetricKit. The framework delivers daily metric payloads (CPU,
memory, launch time, hang rate, animation hitches, network usage) and
immediate diagnostic payloads (crashes, hangs, disk-write exceptions) with
full call-stack trees for triage.

## Working rules

- Register the `NSObject`/`MXMetricManagerSubscriber` early in app launch and
  implement both metric and diagnostic payload callbacks.
- Persist raw `jsonRepresentation()` before processing; dispatch heavy work off
  the callback thread. Retain the call stack tree and matching dSYMs for symbolication.
- Handle missed reports through `pastPayloads` and `pastDiagnosticPayloads`.
  Daily metrics are aggregated; use simulated payloads or Organizer during development.
- Reserve custom signposts for critical paths. Pair extended-launch measurements
  with their finish calls and compare production trends in Xcode Organizer.

## Load for the task

Select the guide for the part being changed. Load additional guides only when
needed; the original examples and checklist remain available below.

| Task | Guide |
| --- | --- |
| Subscriber lifetime, UIKit, or SwiftUI registration | [Subscriber setup](references/subscriber.md) |
| Metric/diagnostic callbacks, persistence, upload, or missed reports | [Payload handling](references/payloads.md) |
| Crash/hang call stacks and symbolication | [Call stack trees](references/call-stacks.md) |
| CPU/memory/network/launch metrics, signposts, or Organizer | [Metrics and instrumentation](references/metrics-and-signposts.md) |
| Reviewing an implementation or diagnosing missing reports | [Pitfalls, checklist, and API sources](references/review.md) |
