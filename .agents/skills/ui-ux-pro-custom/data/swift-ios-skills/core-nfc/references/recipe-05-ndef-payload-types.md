## NDEF Payload Types

### Creating Common Payloads

```swift
// URL payload
let urlPayload = NFCNDEFPayload.wellKnownTypeURIPayload(
    url: URL(string: "https://example.com")!
)

// Text payload
let textPayload = NFCNDEFPayload.wellKnownTypeTextPayload(
    string: "Hello NFC",
    locale: Locale(identifier: "en")
)

// Custom payload
let customPayload = NFCNDEFPayload(
    format: .nfcExternal,
    type: "com.example:mytype".data(using: .utf8)!,
    identifier: Data(),
    payload: "custom-data".data(using: .utf8)!
)
```

### Parsing Payload Content

```swift
func processRecord(_ record: NFCNDEFPayload) {
    switch record.typeNameFormat {
    case .nfcWellKnown:
        if let url = record.wellKnownTypeURIPayload() {
            print("URL: \(url)")
        } else if let (text, locale) = record.wellKnownTypeTextPayload() {
            print("Text (\(locale)): \(text)")
        }
    case .absoluteURI:
        if let uri = String(data: record.payload, encoding: .utf8) {
            print("Absolute URI: \(uri)")
        }
    case .media:
        let mimeType = String(data: record.type, encoding: .utf8) ?? ""
        print("MIME type: \(mimeType), size: \(record.payload.count)")
    case .nfcExternal:
        let type = String(data: record.type, encoding: .utf8) ?? ""
        print("External type: \(type)")
    case .empty, .unknown, .unchanged:
        break
    @unknown default:
        break
    }
}
```
