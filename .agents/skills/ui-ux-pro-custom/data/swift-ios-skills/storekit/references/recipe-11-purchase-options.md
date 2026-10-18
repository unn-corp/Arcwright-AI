## Purchase Options

```swift
// App account token for server-side reconciliation
try await product.purchase(options: [.appAccountToken(UUID())])

// Consumable quantity
try await product.purchase(options: [.quantity(5)])

// Simulate Ask to Buy in sandbox
try await product.purchase(options: [.simulatesAskToBuyInSandbox(true)])
```
