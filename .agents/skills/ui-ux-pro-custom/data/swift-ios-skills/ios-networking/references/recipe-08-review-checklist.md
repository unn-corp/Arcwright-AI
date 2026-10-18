## Review Checklist

- [ ] All network calls use async/await (not completion handlers)
- [ ] Error handling covers URLError cases (.notConnectedToInternet, .timedOut, .cancelled)
- [ ] Requests are cancellable (respect Task cancellation via `.task` modifier or stored Task references)
- [ ] Authentication tokens injected via middleware, not hardcoded
- [ ] Response HTTP status codes validated before decoding
- [ ] Large downloads use `download(for:)` not `data(for:)`
- [ ] Network calls happen off `@MainActor` (only UI updates on main)
- [ ] URLSession configured with appropriate timeouts and caching
- [ ] Retry logic excludes cancellation and 4xx client errors
- [ ] Pagination checks `Task.isCancelled` between pages
- [ ] Sensitive tokens stored in Keychain (not UserDefaults or plain files)
- [ ] No force-unwrapped URLs from dynamic input
- [ ] Server error responses decoded and surfaced to users
- [ ] Ensure network response model types conform to Sendable; use @MainActor for UI-updating completion paths
