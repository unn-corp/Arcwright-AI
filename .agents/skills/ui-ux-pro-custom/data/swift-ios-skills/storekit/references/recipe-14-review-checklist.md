## Review Checklist

- [ ] `Transaction.updates` listener starts at app launch in App init
- [ ] All transactions verified before granting access
- [ ] `transaction.finish()` called after content delivery
- [ ] Revoked transactions excluded from entitlements
- [ ] `.pending` purchase result handled for Ask to Buy
- [ ] Restore purchases button visible on paywall and store views
- [ ] Terms of Service and Privacy Policy links on subscription views
- [ ] Prices shown using `product.displayPrice`, never hardcoded
- [ ] Subscription terms (price, duration, renewal) clearly displayed
- [ ] Free trial states post-trial pricing clearly
- [ ] No original StoreKit APIs (`SKProduct`, `SKPaymentQueue`)
- [ ] Product IDs defined as constants, not scattered strings
- [ ] StoreKit configuration file set up for testing
- [ ] Entitlements re-checked on Transaction.updates and app foreground
- [ ] Server-side validation uses `jwsRepresentation` if applicable
- [ ] Consumables delivered and finished promptly
- [ ] Transaction observer types and product model types are `Sendable` when shared across concurrency boundaries
