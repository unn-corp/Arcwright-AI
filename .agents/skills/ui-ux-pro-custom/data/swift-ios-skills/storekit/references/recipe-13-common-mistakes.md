## Common Mistakes

### 1. Not starting Transaction.updates at app launch

```swift
// WRONG: No listener -- misses renewals, refunds, Ask to Buy approvals
@main struct MyApp: App {
    var body: some Scene { WindowGroup { ContentView() } }
}
// CORRECT: Start listener in App init (see Transaction.updates section above)
```

### 2. Forgetting transaction.finish()

```swift
// WRONG: Never finished -- reappears in unfinished queue forever
let transaction = try checkVerified(verification)
unlockFeature(transaction.productID)

// CORRECT: Always finish after delivering content
let transaction = try checkVerified(verification)
unlockFeature(transaction.productID)
await transaction.finish()
```

### 3. Ignoring verification result

```swift
// WRONG: Using unverified transaction -- security risk
let transaction = verification.unsafePayloadValue

// CORRECT: Verify before using
let transaction = try checkVerified(verification)
```

### 4. Using deprecated original StoreKit APIs

```swift
// WRONG: Original StoreKit (deprecated)
let request = SKProductsRequest(productIdentifiers: ["com.app.premium"])
SKPaymentQueue.default().add(payment)
SKStoreReviewController.requestReview()

// CORRECT: StoreKit 2
let products = try await Product.products(for: ["com.app.premium"])
let result = try await product.purchase()
try await AppStore.requestReview(in: windowScene)
```

### 5. Not checking revocationDate

```swift
// WRONG: Grants access to refunded purchases
if case .verified(let transaction) = result {
    purchased.insert(transaction.productID)
}

// CORRECT: Skip revoked transactions
if case .verified(let transaction) = result, transaction.revocationDate == nil {
    purchased.insert(transaction.productID)
}
```

### 6. Hardcoding prices

```swift
// WRONG: Wrong for other currencies and regions
Text("Buy Premium for $4.99")

// CORRECT: Localized price from Product
Text("Buy \(product.displayName) for \(product.displayPrice)")
```

### 7. Not handling .pending purchase result

```swift
// WRONG: Silently drops pending Ask to Buy
default: break

// CORRECT: Inform user purchase is awaiting approval
case .pending:
    showPendingApprovalMessage()
```

### 8. Checking entitlements only once at launch

```swift
// WRONG: Check once, never update
func appDidFinish() { Task { await updateEntitlements() } }

// CORRECT: Re-check on Transaction.updates AND on foreground return
// Transaction.updates listener handles mid-session changes.
// Also use .task { await storeManager.updateEntitlements() } on content views.
```

### 9. Missing restore purchases button

```swift
// WRONG: No restore option -- App Store rejection risk
SubscriptionStoreView(groupID: "group_id")

// CORRECT
SubscriptionStoreView(groupID: "group_id")
    .storeButton(.visible, for: .restorePurchases)
```

### 10. Subscription views without policy links

```swift
// WRONG: No terms or privacy policy
SubscriptionStoreView(groupID: "group_id")

// CORRECT
SubscriptionStoreView(groupID: "group_id")
    .subscriptionStorePolicyDestination(url: termsURL, for: .termsOfService)
    .subscriptionStorePolicyDestination(url: privacyURL, for: .privacyPolicy)
```
