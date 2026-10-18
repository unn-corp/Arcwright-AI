---
name: codable-patterns
description: "Encode or decode Swift models with Codable, including custom keys, missing/null fields, polymorphic JSON, nested containers, and date/data strategies. Transport and HTTP behavior belong to ios-networking."
---

# Codable Patterns

Encode and decode Swift types using `Codable` (`Encodable & Decodable`) with
`JSONEncoder`, `JSONDecoder`, and related APIs. Targets Swift 6.2 / iOS 26+.

## Decisions and constraints

- Choose `Decodable` for read-only models, `Encodable` for write-only models,
  and `Codable` when both directions are required. For `Codable` synthesis,
  stored properties must themselves be `Codable`.
- Match the schema's required, missing, and null fields. Use `decodeIfPresent`
  and defaults where intended; never force-unwrap decoded values.
- For simple snake_case APIs, configure key strategies once. Custom `CodingKeys`
  must cover stored properties; excluded properties need defaults or separate
  computation. Validate transformations in `init(from:)`.
- Match date and data strategies to the wire format and the encoder. A malformed
  array element normally fails the whole decode; choose lossy decoding only
  when skipping invalid elements is intended.
- HTTP transport belongs to `ios-networking`; use this skill for model coding.

## Load the relevant topic

Read only the topic needed for the current change, then use the checklist below.

| Task | Reference |
|---|---|
| Synthesized/custom conformance, keys, nested containers, wrappers, missing-field defaults | [Model conformance](references/model-conformance.md) |
| Dates, data, key conversion, deterministic JSON, property lists | [Format strategies](references/format-strategies.md) |
| Mixed-type arrays, lossy arrays, decoding mistakes and error handling | [Collections and errors](references/collections-and-errors.md) |
| URLSession envelopes, SwiftData composites, UserDefaults and AppStorage | [Storage integration](references/storage-integration.md) |

## Review Checklist

- [ ] Types conform to `Decodable` only when encoding is not needed
- [ ] `decodeIfPresent` used with defaults for optional or missing keys
- [ ] `keyDecodingStrategy = .convertFromSnakeCase` used instead of manual CodingKeys for simple snake_case APIs
- [ ] `dateDecodingStrategy` matches the API date format
- [ ] Arrays of unreliable data use lossy decoding to skip invalid elements
- [ ] Custom `init(from:)` validates and transforms data instead of post-decode fixups
- [ ] `JSONEncoder.outputFormatting` includes `.sortedKeys` for deterministic test output
- [ ] Wrapper types (UserID, etc.) use `singleValueContainer` for clean JSON
- [ ] Generic `APIResponse<T>` wrapper used for consistent API envelope handling
- [ ] No force-unwrapping of decoded values
- [ ] `@AppStorage` Codable types conform to `RawRepresentable`
- [ ] SwiftData composite attributes use `Codable` structs

## References

- [Codable](https://sosumi.ai/documentation/swift/codable/) -- protocol combining Encodable and Decodable
- [JSONDecoder](https://sosumi.ai/documentation/foundation/jsondecoder/) -- decodes JSON data into Codable types
- [JSONEncoder](https://sosumi.ai/documentation/foundation/jsonencoder/) -- encodes Codable types as JSON data
- [CodingKey](https://sosumi.ai/documentation/swift/codingkey/) -- protocol for encoding/decoding keys
- [Encoding and Decoding Custom Types](https://sosumi.ai/documentation/foundation/encoding-and-decoding-custom-types/) -- Apple guide on custom Codable conformance
- [Using JSON with Custom Types](https://sosumi.ai/documentation/foundation/archives_and_serialization/using_json_with_custom_types/) -- Apple sample code for JSON patterns
