## API Client Architecture

### Protocol-Based Client

Define a protocol for testability. This lets you swap implementations in
tests without mocking URLSession directly.

```swift
protocol APIClientProtocol: Sendable {
    func fetch<T: Decodable & Sendable>(
        _ type: T.Type,
        endpoint: Endpoint
    ) async throws -> T

    func send<T: Decodable & Sendable>(
        _ type: T.Type,
        endpoint: Endpoint,
        body: some Encodable & Sendable
    ) async throws -> T
}
```

```swift
struct Endpoint: Sendable {
    let path: String
    var method: String = "GET"
    var queryItems: [URLQueryItem] = []
    var headers: [String: String] = [:]

    func url(relativeTo baseURL: URL) -> URL {
        guard let components = URLComponents(
            url: baseURL.appendingPathComponent(path),
            resolvingAgainstBaseURL: true
        ) else {
            preconditionFailure("Invalid URL components for path: \(path)")
        }
        var mutableComponents = components
        if !queryItems.isEmpty {
            mutableComponents.queryItems = queryItems
        }
        guard let url = mutableComponents.url else {
            preconditionFailure("Failed to construct URL from components")
        }
        return url
    }
}
```

The client accepts a `baseURL`, optional custom `URLSession`, `JSONDecoder`,
and an array of `RequestMiddleware` interceptors. Each method builds a
`URLRequest` from the endpoint, applies middleware, executes the request,
validates the status code, and decodes the result. See
`urlsession-patterns.md` for the complete `APIClient` implementation
with convenience methods, request builder, and test setup.

### Lightweight Closure-Based Client

For apps using the MV pattern, use closure-based clients for testability
and SwiftUI preview support. See `lightweight-clients.md` for
the full pattern (struct of async closures, injected via init).

### Request Middleware / Interceptors

Middleware transforms requests before they are sent. Use this for
authentication, logging, analytics headers, and similar cross-cutting
concerns.

```swift
protocol RequestMiddleware: Sendable {
    func prepare(_ request: URLRequest) async throws -> URLRequest
}
```

```swift
struct AuthMiddleware: RequestMiddleware {
    let tokenProvider: @Sendable () async throws -> String

    func prepare(_ request: URLRequest) async throws -> URLRequest {
        var request = request
        let token = try await tokenProvider()
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        return request
    }
}
```

### Token Refresh Flow

Handle 401 responses by refreshing the token and retrying once.

```swift
func fetchWithTokenRefresh<T: Decodable & Sendable>(
    _ type: T.Type,
    endpoint: Endpoint,
    tokenStore: TokenStore
) async throws -> T {
    do {
        return try await fetch(type, endpoint: endpoint)
    } catch NetworkError.httpError(statusCode: 401, _) {
        try await tokenStore.refreshToken()
        return try await fetch(type, endpoint: endpoint)
    }
}
```
