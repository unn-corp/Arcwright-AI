## App Transaction (App Purchase Verification)

Verify the legitimacy of the app installation. Use for business model changes
or detecting tampered installations (iOS 16+).

```swift
func verifyAppPurchase() async {
    do {
        let result = try await AppTransaction.shared
        switch result {
        case .verified(let appTransaction):
            let originalVersion = appTransaction.originalAppVersion
            let purchaseDate = appTransaction.originalPurchaseDate
            // Migration logic for users who paid before subscription model
        case .unverified:
            // Potentially tampered -- restrict features as appropriate
            break
        }
    } catch { /* Could not retrieve app transaction */ }
}
```
