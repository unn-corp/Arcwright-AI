## Subscription Status Checking

```swift
func checkSubscriptionActive(groupID: String) async throws -> Bool {
    let statuses = try await Product.SubscriptionInfo.Status.status(for: groupID)
    for status in statuses {
        guard case .verified = status.renewalInfo,
              case .verified = status.transaction else { continue }
        if status.state == .subscribed || status.state == .inGracePeriod {
            return true
        }
    }
    return false
}
```

### Renewal States

| State | Meaning |
|---|---|
| `.subscribed` | Active subscription |
| `.expired` | Subscription has expired |
| `.inBillingRetryPeriod` | Payment failed, Apple is retrying |
| `.inGracePeriod` | Payment failed but access continues during grace period |
| `.revoked` | Apple refunded or revoked the subscription |
