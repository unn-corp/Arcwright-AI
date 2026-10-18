# Encoding and Decoding Strategies

## Date Decoding Strategies

Configure `JSONDecoder.dateDecodingStrategy` to match your API:

```swift
let decoder = JSONDecoder()

// ISO 8601 (e.g., "2024-03-15T10:30:00Z")
decoder.dateDecodingStrategy = .iso8601

// Unix timestamp in seconds (e.g., 1710499800)
decoder.dateDecodingStrategy = .secondsSince1970

// Custom DateFormatter
let formatter = DateFormatter()
formatter.dateFormat = "yyyy-MM-dd"
formatter.locale = Locale(identifier: "en_US_POSIX")
formatter.timeZone = TimeZone(secondsFromGMT: 0)
decoder.dateDecodingStrategy = .formatted(formatter)

// Custom closure for multiple formats
decoder.dateDecodingStrategy = .custom { decoder in
    let container = try decoder.singleValueContainer()
    let string = try container.decode(String.self)
    if let date = ISO8601DateFormatter().date(from: string) { return date }
    throw DecodingError.dataCorruptedError(
        in: container, debugDescription: "Cannot decode date: \(string)")
}
```

Set the matching strategy on `JSONEncoder`:
`encoder.dateEncodingStrategy = .iso8601`

## Data and Key Strategies

```swift
let decoder = JSONDecoder()
decoder.dataDecodingStrategy = .base64           // Base64-encoded Data fields
decoder.keyDecodingStrategy = .convertFromSnakeCase  // snake_case -> camelCase
// {"user_name": "Alice"} maps to `var userName: String` -- no CodingKeys needed

let encoder = JSONEncoder()
encoder.dataEncodingStrategy = .base64
encoder.keyEncodingStrategy = .convertToSnakeCase
```

## Encoder and Decoder Configuration

```swift
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]

// Non-conforming floats (NaN, Infinity are not valid JSON)
encoder.nonConformingFloatEncodingStrategy = .convertToString(
    positiveInfinity: "Infinity", negativeInfinity: "-Infinity", nan: "NaN")
decoder.nonConformingFloatDecodingStrategy = .convertFromString(
    positiveInfinity: "Infinity", negativeInfinity: "-Infinity", nan: "NaN")
```

### PropertyListEncoder / PropertyListDecoder

```swift
let plistEncoder = PropertyListEncoder()
plistEncoder.outputFormat = .xml  // or .binary
let data = try plistEncoder.encode(settings)
let decoded = try PropertyListDecoder().decode(Settings.self, from: data)
```

