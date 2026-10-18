## Common Mistakes

**DON'T:** Use `URLSession.shared` with custom configuration needs.
**DO:** Create a configured `URLSession` with appropriate timeouts, caching,
and delegate for production code.

**DON'T:** Force-unwrap `URL(string:)` with dynamic input.
**DO:** Use `URL(string:)` with proper error handling. Force-unwrap is
acceptable only for compile-time-constant strings.

**DON'T:** Decode JSON on the main thread for large payloads.
**DO:** Keep decoding on the calling context of the URLSession call, which
is off-main by default. Only hop to `@MainActor` to update UI state.

**DON'T:** Ignore cancellation in long-running network tasks.
**DO:** Check `Task.isCancelled` or call `try Task.checkCancellation()` in
loops (pagination, streaming, retry). Use `.task` in SwiftUI for automatic
cancellation.

**DON'T:** Use Alamofire or Moya when URLSession async/await handles the
need.
**DO:** Use URLSession directly. With async/await, the ergonomic gap that
justified third-party libraries no longer exists. Reserve third-party
libraries for genuinely missing features (e.g., image caching).

**DON'T:** Mock URLSession directly in tests.
**DO:** Use `URLProtocol` subclass for transport-level mocking, or use
protocol-based clients that accept a test double.

**DON'T:** Use `data(for:)` for large file downloads.
**DO:** Use `download(for:)` which streams to disk and avoids memory spikes.

**DON'T:** Fire network requests from `body` or view initializers.
**DO:** Use `.task` or `.task(id:)` to trigger network calls.

**DON'T:** Hardcode authentication tokens in requests.
**DO:** Inject tokens via middleware so they are centralized and refreshable.

**DON'T:** Ignore HTTP status codes and decode blindly.
**DO:** Validate status codes before decoding. A 200 with invalid JSON and
a 500 with an error body require different handling.
