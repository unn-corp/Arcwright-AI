## Restore Purchases

StoreKit 2 handles restoration via `Transaction.currentEntitlements`. Add a
restore button or call `AppStore.sync()` explicitly.

```swift
func restorePurchases() async throws {
    try await AppStore.sync()
    await StoreManager.shared.updateEntitlements()
}
```

On store views: `.storeButton(.visible, for: .restorePurchases)`
