## Core URLSession async/await

URLSession gained native async/await overloads in iOS 15. These are the
only networking APIs to use in new code. Never use completion-handler
variants in new projects.

### Data Requests

```swift
// Basic GET
let (data, response) = try await URLSession.shared.data(from: url)

// With a configured URLRequest
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.httpBody = try JSONEncoder().encode(payload)
request.timeoutInterval = 30
request.cachePolicy = .reloadIgnoringLocalCacheData

let (data, response) = try await URLSession.shared.data(for: request)
```

### Response Validation

Always validate the HTTP status code before decoding. URLSession does not
throw for 4xx/5xx responses -- it only throws for transport-level failures.

```swift
guard let httpResponse = response as? HTTPURLResponse else {
    throw NetworkError.invalidResponse
}

guard (200..<300).contains(httpResponse.statusCode) else {
    throw NetworkError.httpError(
        statusCode: httpResponse.statusCode,
        data: data
    )
}
```

### JSON Decoding with Codable

```swift
func fetch<T: Decodable>(_ type: T.Type, from url: URL) async throws -> T {
    let (data, response) = try await URLSession.shared.data(from: url)

    guard let httpResponse = response as? HTTPURLResponse,
          (200..<300).contains(httpResponse.statusCode) else {
        throw NetworkError.invalidResponse
    }

    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    decoder.keyDecodingStrategy = .convertFromSnakeCase
    return try decoder.decode(T.self, from: data)
}
```

### Downloads and Uploads

Use `download(for:)` for large files -- it streams to disk instead of
loading the entire payload into memory.

```swift
// Download to a temporary file
let (localURL, response) = try await URLSession.shared.download(for: request)

// Move from temp location before the method returns
let destination = documentsDirectory.appendingPathComponent("file.zip")
try FileManager.default.moveItem(at: localURL, to: destination)
```

```swift
// Upload data
let (data, response) = try await URLSession.shared.upload(for: request, from: bodyData)

// Upload from file
let (data, response) = try await URLSession.shared.upload(for: request, fromFile: fileURL)
```

### Streaming with AsyncBytes

Use `bytes(for:)` for streaming responses, progress tracking, or
line-delimited data (e.g., server-sent events).

```swift
let (bytes, response) = try await URLSession.shared.bytes(for: request)

for try await line in bytes.lines {
    // Process each line as it arrives (e.g., SSE stream)
    handleEvent(line)
}
```
