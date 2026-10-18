---
name: storekit
description: "Implement or debug StoreKit 2 purchases, subscriptions, entitlement state, transaction verification, restores, and paywalls. Apple Pay for physical goods uses passkit-wallet."
---

# StoreKit 2 In-App Purchases and Subscriptions

Implement in-app purchases, subscriptions, and paywalls using StoreKit 2 on
iOS 26+. Use only the modern `Product`, `Transaction`, `StoreView`, and
`SubscriptionStoreView` APIs. Never use the deprecated original StoreKit
(`SKProduct`, `SKPaymentQueue`, `SKStoreReviewController`).

## Essential constraints

- Start transaction updates at app launch, verify before granting access, and finish only after content delivery.
- Recheck entitlements on updates/foreground, exclude revoked transactions, and handle pending/cancelled purchases.
- Use localized product prices, visible restore controls, and required subscription terms/policy links. Exercise the relevant StoreKit test configuration.

## Load only the needed topic

Read the relevant recipe below, plus its linked detail when needed. The original
examples and checks remain available without loading every API into the task.

| Topic | Reference |
| --- | --- |
| Product Types | [recipe-01-product-types.md](references/recipe-01-product-types.md) |
| Loading Products | [recipe-02-loading-products.md](references/recipe-02-loading-products.md) |
| Purchase Flow | [recipe-03-purchase-flow.md](references/recipe-03-purchase-flow.md) |
| Transaction.updates Listener | [recipe-04-transaction-updates-listener.md](references/recipe-04-transaction-updates-listener.md) |
| Entitlement Checking | [recipe-05-entitlement-checking.md](references/recipe-05-entitlement-checking.md) |
| SubscriptionStoreView (iOS 17+) | [recipe-06-subscriptionstoreview-ios-17.md](references/recipe-06-subscriptionstoreview-ios-17.md) |
| StoreView (iOS 17+) | [recipe-07-storeview-ios-17.md](references/recipe-07-storeview-ios-17.md) |
| Subscription Status Checking | [recipe-08-subscription-status-checking.md](references/recipe-08-subscription-status-checking.md) |
| Restore Purchases | [recipe-09-restore-purchases.md](references/recipe-09-restore-purchases.md) |
| App Transaction (App Purchase Verification) | [recipe-10-app-transaction-app-purchase-verification.md](references/recipe-10-app-transaction-app-purchase-verification.md) |
| Purchase Options | [recipe-11-purchase-options.md](references/recipe-11-purchase-options.md) |
| SwiftUI Purchase Callbacks | [recipe-12-swiftui-purchase-callbacks.md](references/recipe-12-swiftui-purchase-callbacks.md) |
| Common Mistakes | [recipe-13-common-mistakes.md](references/recipe-13-common-mistakes.md) |
| Review Checklist | [recipe-14-review-checklist.md](references/recipe-14-review-checklist.md) |
| References | [recipe-15-references.md](references/recipe-15-references.md) |
