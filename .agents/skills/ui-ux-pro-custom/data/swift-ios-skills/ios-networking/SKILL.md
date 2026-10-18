---
name: ios-networking
description: "Implement or debug URLSession networking in Swift, including HTTP validation, cancellation, uploads/downloads, retries, caching, and connectivity. Use for transport behavior; decoding-only changes use codable-patterns."
---

# iOS Networking

Modern networking patterns for iOS 26+ using URLSession with async/await and
structured concurrency. All examples target Swift 6.2. No third-party
dependencies required -- URLSession covers the vast majority of networking
needs.

## Essential constraints

- Validate URLs and HTTP status before decoding; use configured async URLSession clients and centralize refreshable credentials.
- Respect cancellation in streams/retries/pagination; decode large payloads off the main actor and stream large downloads to disk.
- Keep requests out of view bodies. Reuse the project transport/test setup and test the concrete changed success/failure behavior.

## Load only the needed topic

Read the relevant recipe below, plus its linked detail when needed. The original
examples and checks remain available without loading every API into the task.

| Topic | Reference |
| --- | --- |
| Core URLSession async/await | [recipe-01-core-urlsession-async-await.md](references/recipe-01-core-urlsession-async-await.md) |
| API Client Architecture | [recipe-02-api-client-architecture.md](references/recipe-02-api-client-architecture.md) |
| Error Handling | [recipe-03-error-handling.md](references/recipe-03-error-handling.md) |
| Pagination | [recipe-04-pagination.md](references/recipe-04-pagination.md) |
| Network Reachability | [recipe-05-network-reachability.md](references/recipe-05-network-reachability.md) |
| Configuring URLSession | [recipe-06-configuring-urlsession.md](references/recipe-06-configuring-urlsession.md) |
| Common Mistakes | [recipe-07-common-mistakes.md](references/recipe-07-common-mistakes.md) |
| Review Checklist | [recipe-08-review-checklist.md](references/recipe-08-review-checklist.md) |
| References | [recipe-09-references.md](references/recipe-09-references.md) |
