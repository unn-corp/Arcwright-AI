## Entitlement Checking

Use `Transaction.currentEntitlements` for non-consumable purchases and active
subscriptions. Always check `revocationDate`.

```swift
@Observable
@MainActor
class StoreManager {
    static let shared = StoreManager()
    var purchasedProductIDs: Set<String> = []
    var isPremium: Bool { purchasedProductIDs.contains(ProductID.premium) }

    func updateEntitlements() async {
        var purchased = Set<String>()
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result,
               transaction.revocationDate == nil {
                purchased.insert(transaction.productID)
            }
        }
        purchasedProductIDs = purchased
    }
}
```

### SwiftUI .currentEntitlementTask Modifier

```swift
struct PremiumGatedView: View {
    @State private var state: EntitlementTaskState<VerificationResult<Transaction>?> = .loading

    var body: some View {
        Group {
            switch state {
            case .loading: ProgressView()
            case .failure: PaywallView()
            case .success(let transaction):
                if transaction != nil { PremiumContentView() }
                else { PaywallView() }
            }
        }
        .currentEntitlementTask(for: ProductID.premium) { state in
            self.state = state
        }
    }
}
```
