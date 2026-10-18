## Loading Products

Define product IDs as constants. Fetch products with `Product.products(for:)`.

```swift
import StoreKit

enum ProductID {
    static let premium = "com.myapp.premium"
    static let gems100 = "com.myapp.gems100"
    static let monthlyPlan = "com.myapp.monthly"
    static let yearlyPlan = "com.myapp.yearly"
    static let all: [String] = [premium, gems100, monthlyPlan, yearlyPlan]
}

let products = try await Product.products(for: ProductID.all)
for product in products {
    print("\(product.displayName): \(product.displayPrice)")
}
```
