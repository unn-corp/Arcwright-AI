## SubscriptionStoreView (iOS 17+)

Built-in SwiftUI view for subscription paywalls. Handles product loading,
purchase UI, and restore purchases automatically.

```swift
SubscriptionStoreView(groupID: "YOUR_GROUP_ID")
    .subscriptionStoreControlStyle(.prominentPicker)
    .subscriptionStoreButtonLabel(.multiline)
    .storeButton(.visible, for: .restorePurchases)
    .storeButton(.visible, for: .redeemCode)
    .subscriptionStorePolicyDestination(url: termsURL, for: .termsOfService)
    .subscriptionStorePolicyDestination(url: privacyURL, for: .privacyPolicy)
    .onInAppPurchaseCompletion { product, result in
        if case .success(.verified(let transaction)) = result {
            await transaction.finish()
        }
    }
```

### Custom Marketing Content

```swift
SubscriptionStoreView(groupID: "YOUR_GROUP_ID") {
    VStack {
        Image(systemName: "crown.fill").font(.system(size: 60)).foregroundStyle(.yellow)
        Text("Unlock Premium").font(.largeTitle.bold())
        Text("Access all features").foregroundStyle(.secondary)
    }
}
.containerBackground(.blue.gradient, for: .subscriptionStore)
```

### Hierarchical Layout

```swift
SubscriptionStoreView(groupID: "YOUR_GROUP_ID") {
    SubscriptionPeriodGroupSet()
}
.subscriptionStoreControlStyle(.picker)
```
