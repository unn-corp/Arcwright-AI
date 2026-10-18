## Error Handling

### Structured Error Types

```swift
enum NetworkError: Error, Sendable {
    case invalidResponse
    case httpError(statusCode: Int, data: Data)
    case decodingFailed(Error)
    case noConnection
    case timedOut
    case cancelled

    /// Map a URLError to a typed NetworkError
    static func from(_ urlError: URLError) -> NetworkError {
        switch urlError.code {
        case .notConnectedToInternet, .networkConnectionLost:
            return .noConnection
        case .timedOut:
            return .timedOut
        case .cancelled:
            return .cancelled
        default:
            return .httpError(statusCode: -1, data: Data())
        }
    }
}
```

### Key URLError Cases

| URLError Code | Meaning | Action |
|---|---|---|
| `.notConnectedToInternet` | Device offline | Show offline UI, queue for retry |
| `.networkConnectionLost` | Connection dropped mid-request | Retry with backoff |
| `.timedOut` | Server did not respond in time | Retry once, then show error |
| `.cancelled` | Task was cancelled | No action needed; do not show error |
| `.cannotFindHost` | DNS failure | Check URL, show error |
| `.secureConnectionFailed` | TLS handshake failed | Check cert pinning, ATS config |
| `.userAuthenticationRequired` | 401 from proxy | Trigger auth flow |

### Decoding Server Error Bodies

```swift
struct APIErrorResponse: Decodable, Sendable {
    let code: String
    let message: String
}

func decodeAPIError(from data: Data) -> APIErrorResponse? {
    try? JSONDecoder().decode(APIErrorResponse.self, from: data)
}

// Usage in catch block
catch NetworkError.httpError(let statusCode, let data) {
    if let apiError = decodeAPIError(from: data) {
        showError("Server error: \(apiError.message)")
    } else {
        showError("HTTP \(statusCode)")
    }
}
```

### Retry with Exponential Backoff

Use structured concurrency for retries. Respect task cancellation between
attempts. Skip retries for cancellation and 4xx client errors (except 429).

```swift
func withRetry<T: Sendable>(
    maxAttempts: Int = 3,
    initialDelay: Duration = .seconds(1),
    operation: @Sendable () async throws -> T
) async throws -> T {
    var lastError: Error?
    for attempt in 0..<maxAttempts {
        do {
            return try await operation()
        } catch {
            lastError = error
            if error is CancellationError { throw error }
            if case NetworkError.httpError(let code, _) = error,
               (400..<500).contains(code), code != 429 { throw error }
            if attempt < maxAttempts - 1 {
                try await Task.sleep(for: initialDelay * Int(pow(2.0, Double(attempt))))
            }
        }
    }
    throw lastError!
}
```
