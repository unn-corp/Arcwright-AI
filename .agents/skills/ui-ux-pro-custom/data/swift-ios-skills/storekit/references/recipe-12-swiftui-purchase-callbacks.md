## SwiftUI Purchase Callbacks

```swift
.onInAppPurchaseStart { product in
    return true  // Return false to cancel
}
.onInAppPurchaseCompletion { product, result in
    if case .success(.verified(let transaction)) = result {
        await transaction.finish()
    }
}
.inAppPurchaseOptions { product in
    [.appAccountToken(userAccountToken)]
}
```
