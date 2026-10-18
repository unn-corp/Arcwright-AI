## Configuring URLSession

Create a configured session for production code. `URLSession.shared` is
acceptable only for simple, one-off requests.

```swift
let configuration = URLSessionConfiguration.default
configuration.timeoutIntervalForRequest = 30
configuration.timeoutIntervalForResource = 300
configuration.waitsForConnectivity = true
configuration.requestCachePolicy = .returnCacheDataElseLoad
configuration.httpAdditionalHeaders = [
    "Accept": "application/json",
    "Accept-Language": Locale.preferredLanguages.first ?? "en"
]

let session = URLSession(configuration: configuration)
```

`waitsForConnectivity = true` is valuable -- it makes the session wait for
a network path instead of failing immediately when offline. Combine with
`urlSession(_:taskIsWaitingForConnectivity:)` delegate callback for UI
feedback.
