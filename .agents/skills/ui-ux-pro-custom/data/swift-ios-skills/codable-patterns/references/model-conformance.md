# Model Conformance and Containers

## Basic Conformance

When all stored properties are themselves `Codable`, the compiler synthesizes
conformance automatically:

```swift
struct User: Codable {
    let id: Int
    let name: String
    let email: String
    let isVerified: Bool
}

let user = try JSONDecoder().decode(User.self, from: jsonData)
let encoded = try JSONEncoder().encode(user)
```

Prefer `Decodable` for read-only API responses and `Encodable` for write-only.
Use `Codable` only when both directions are required.

## Custom CodingKeys

Rename JSON keys without writing a custom decoder by declaring a `CodingKeys`
enum:

```swift
struct Product: Codable {
    let id: Int
    let displayName: String
    let imageURL: URL
    let priceInCents: Int

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case imageURL = "image_url"
        case priceInCents = "price_in_cents"
    }
}
```

Every stored property must appear in the enum. Omitting a property from
`CodingKeys` excludes it from encoding/decoding -- provide a default value or
compute it separately.

## Custom Decoding and Encoding

Override `init(from:)` and `encode(to:)` for transformations the synthesized
conformance cannot handle:

```swift
struct Event: Codable {
    let name: String
    let timestamp: Date
    let tags: [String]

    enum CodingKeys: String, CodingKey {
        case name, timestamp, tags
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        name = try container.decode(String.self, forKey: .name)
        // Decode Unix timestamp as Double, convert to Date
        let epoch = try container.decode(Double.self, forKey: .timestamp)
        timestamp = Date(timeIntervalSince1970: epoch)
        // Default to empty array when key is missing
        tags = try container.decodeIfPresent([String].self, forKey: .tags) ?? []
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(name, forKey: .name)
        try container.encode(timestamp.timeIntervalSince1970, forKey: .timestamp)
        try container.encode(tags, forKey: .tags)
    }
}
```

## Nested and Flattened Containers

Use `nestedContainer(keyedBy:forKey:)` to navigate and flatten nested JSON:

```swift
// JSON: { "id": 1, "location": { "lat": 37.7749, "lng": -122.4194 } }
struct Place: Decodable {
    let id: Int
    let latitude: Double
    let longitude: Double

    enum CodingKeys: String, CodingKey { case id, location }
    enum LocationKeys: String, CodingKey { case lat, lng }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(Int.self, forKey: .id)
        let location = try container.nestedContainer(
            keyedBy: LocationKeys.self, forKey: .location)
        latitude = try location.decode(Double.self, forKey: .lat)
        longitude = try location.decode(Double.self, forKey: .lng)
    }
}
```

Chain multiple `nestedContainer` calls to flatten deeply nested structures.
Also use `nestedUnkeyedContainer(forKey:)` for nested arrays.

## Single Value Containers

Wrap primitives for type safety using `singleValueContainer()`:

```swift
struct UserID: Codable, Hashable {
    let rawValue: String

    init(_ rawValue: String) { self.rawValue = rawValue }

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        rawValue = try container.decode(String.self)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(rawValue)
    }
}
// JSON: "usr_abc123" decodes directly to UserID
```

## Default Values for Missing Keys

Use `decodeIfPresent` with nil-coalescing to provide defaults:

```swift
struct Settings: Decodable {
    let theme: String
    let fontSize: Int
    let notificationsEnabled: Bool

    enum CodingKeys: String, CodingKey {
        case theme, fontSize = "font_size"
        case notificationsEnabled = "notifications_enabled"
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        theme = try container.decodeIfPresent(String.self, forKey: .theme) ?? "system"
        fontSize = try container.decodeIfPresent(Int.self, forKey: .fontSize) ?? 16
        notificationsEnabled = try container.decodeIfPresent(
            Bool.self, forKey: .notificationsEnabled) ?? true
    }
}
```

