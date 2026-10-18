# Collections and Decoding Errors

## Heterogeneous Arrays

Decode arrays of mixed types using a discriminator field:

```swift
// JSON: [{"type":"text","content":"Hello"},{"type":"image","url":"pic.jpg"}]
enum ContentBlock: Decodable {
    case text(String)
    case image(URL)

    enum CodingKeys: String, CodingKey { case type, content, url }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)
        switch type {
        case "text":
            let content = try container.decode(String.self, forKey: .content)
            self = .text(content)
        case "image":
            let url = try container.decode(URL.self, forKey: .url)
            self = .image(url)
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .type, in: container,
                debugDescription: "Unknown type: \(type)")
        }
    }
}

let blocks = try JSONDecoder().decode([ContentBlock].self, from: jsonData)
```

## Lossy Array Decoding

By default, one invalid element fails the entire array. Use a wrapper to skip
invalid elements:

```swift
struct LossyArray<Element: Decodable>: Decodable {
    let elements: [Element]

    init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        var elements: [Element] = []
        while !container.isAtEnd {
            if let element = try? container.decode(Element.self) {
                elements.append(element)
            } else {
                _ = try? container.decode(AnyCodableValue.self) // advance past bad element
            }
        }
        self.elements = elements
    }
}
private struct AnyCodableValue: Decodable {}
```

## Common Mistakes

**1. Not handling missing optional keys:**
```swift
// DON'T -- crashes if key is absent
let value = try container.decode(String.self, forKey: .bio)
// DO -- returns nil for missing keys
let value = try container.decodeIfPresent(String.self, forKey: .bio) ?? ""
```

**2. Failing entire array when one element is invalid:**
```swift
// DON'T -- one bad element kills the whole decode
let items = try container.decode([Item].self, forKey: .items)
// DO -- use LossyArray or decode elements individually
let items = try container.decode(LossyArray<Item>.self, forKey: .items).elements
```

**3. Date strategy mismatch:**
```swift
// DON'T -- default strategy expects Double, but API sends ISO string
let decoder = JSONDecoder()  // dateDecodingStrategy defaults to .deferredToDate
// DO -- set strategy to match your API format
decoder.dateDecodingStrategy = .iso8601
```

**4. Force-unwrapping decoded optionals:**
```swift
// DON'T
let user = try? decoder.decode(User.self, from: data)
print(user!.name)
// DO
guard let user = try? decoder.decode(User.self, from: data) else { return }
```

**5. Using Codable when only Decodable is needed:**
```swift
// DON'T -- unnecessarily constrains the type to also be Encodable
struct APIResponse: Codable { let id: Int; let message: String }
// DO -- use Decodable for read-only API responses
struct APIResponse: Decodable { let id: Int; let message: String }
```

**6. Manual CodingKeys for simple snake_case APIs:**
```swift
// DON'T -- verbose boilerplate for every model
enum CodingKeys: String, CodingKey {
    case userName = "user_name"
    case avatarUrl = "avatar_url"
}
// DO -- configure once on the decoder
decoder.keyDecodingStrategy = .convertFromSnakeCase
```

