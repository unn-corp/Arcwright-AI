## StoreView (iOS 17+)

Merchandises multiple products with localized names, prices, and purchase buttons.

```swift
StoreView(ids: [ProductID.gems100, ProductID.premium], prefersPromotionalIcon: true)
    .productViewStyle(.large)
    .storeButton(.visible, for: .restorePurchases)
    .onInAppPurchaseCompletion { product, result in
        if case .success(.verified(let transaction)) = result {
            await transaction.finish()
        }
    }
```

### ProductView for Individual Products

```swift
ProductView(id: ProductID.premium) { iconPhase in
    switch iconPhase {
    case .success(let image): image.resizable().scaledToFit()
    case .loading: ProgressView()
    default: Image(systemName: "star.fill")
    }
}
.productViewStyle(.large)
```
