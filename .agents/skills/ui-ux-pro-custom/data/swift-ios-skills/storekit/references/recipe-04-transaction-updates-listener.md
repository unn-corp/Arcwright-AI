## Transaction.updates Listener

Start at app launch. Catches purchases from other devices, Family Sharing
changes, renewals, Ask to Buy approvals, refunds, and revocations.

```swift
@main
struct MyApp: App {
    private var transactionListener: Task<Void, Error>?

    init() {
        transactionListener = listenForTransactions()
    }

    var body: some Scene {
        WindowGroup { ContentView() }
    }

    func listenForTransactions() -> Task<Void, Error> {
        Task.detached {
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                await StoreManager.shared.updateEntitlements()
                await transaction.finish()
            }
        }
    }
}
```
