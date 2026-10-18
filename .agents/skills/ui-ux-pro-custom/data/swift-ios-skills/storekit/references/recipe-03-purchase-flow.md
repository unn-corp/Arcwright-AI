## Purchase Flow

Call `product.purchase(options:)` and handle all three `PurchaseResult` cases.
Always verify and finish transactions.

```swift
func purchase(_ product: Product) async throws {
    let result = try await product.purchase(options: [
        .appAccountToken(userAccountToken)
    ])
    switch result {
    case .success(let verification):
        let transaction = try checkVerified(verification)
        await deliverContent(for: transaction)
        await transaction.finish()
    case .userCancelled:
        break
    case .pending:
        // Ask to Buy or deferred approval -- do not unlock content yet
        break
    @unknown default:
        break
    }
}

func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
    switch result {
    case .verified(let value): return value
    case .unverified(_, let error): throw error
    }
}
```
