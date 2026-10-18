# Codable Storage and Transport Integration

## Codable with URLSession

```swift
func fetchUser(id: Int) async throws -> User {
    let url = URL(string: "https://api.example.com/users/\(id)")!
    let (data, response) = try await URLSession.shared.data(from: url)
    guard let http = response as? HTTPURLResponse,
          (200...299).contains(http.statusCode) else {
        throw APIError.invalidResponse
    }
    let decoder = JSONDecoder()
    decoder.keyDecodingStrategy = .convertFromSnakeCase
    decoder.dateDecodingStrategy = .iso8601
    return try decoder.decode(User.self, from: data)
}

// Generic API envelope for wrapped responses
struct APIResponse<T: Decodable>: Decodable {
    let data: T
    let meta: Meta?
    struct Meta: Decodable { let page: Int; let totalPages: Int }
}
let users = try decoder.decode(APIResponse<[User]>.self, from: data).data
```

## Codable with SwiftData

`Codable` structs work as composite attributes in SwiftData models. In iOS 18+,
SwiftData natively supports them without explicit `@Attribute(.transformable)`:

```swift
struct Address: Codable {
    var street: String
    var city: String
    var zipCode: String
}

@Model class Contact {
    var name: String
    var address: Address?  // Codable struct stored as composite attribute
    init(name: String, address: Address? = nil) {
        self.name = name; self.address = address
    }
}
```

## Codable with UserDefaults

Store `Codable` values via `RawRepresentable` for `@AppStorage`:

```swift
struct UserPreferences: Codable {
    var showOnboarding: Bool = true
    var accentColor: String = "blue"
}

extension UserPreferences: RawRepresentable {
    init?(rawValue: String) {
        guard let data = rawValue.data(using: .utf8),
              let decoded = try? JSONDecoder().decode(Self.self, from: data)
        else { return nil }
        self = decoded
    }
    var rawValue: String {
        guard let data = try? JSONEncoder().encode(self),
              let string = String(data: data, encoding: .utf8)
        else { return "{}" }
        return string
    }
}

struct SettingsView: View {
    @AppStorage("userPrefs") private var prefs = UserPreferences()
    var body: some View {
        Toggle("Show Onboarding", isOn: $prefs.showOnboarding)
    }
}
```

