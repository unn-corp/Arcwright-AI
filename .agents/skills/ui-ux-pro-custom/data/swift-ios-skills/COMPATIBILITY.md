# Swift guide compatibility review

These existing guides target their stated Swift and platform versions. Before applying an example, inspect the application's deployment target, Swift language mode, Xcode/SDK version, actor-isolation defaults, and enabled concurrency checks. Preserve the app's supported targets; newer SDK or beta examples are not automatic upgrade instructions.

- A representable struct copied into a coordinator is a snapshot. Refresh stored values from each update callback, and verify that changing the callback or binding after initial construction reaches the same UIKit view and coordinator.
- Queue affinity and actor isolation are separate contracts. Keep framework handles in the domain that owns them; pass Sendable application data across domains. Compile actual protocol conformances under the app's strict-concurrency configuration before adopting an isolation technique.
- Observation migration changes ownership and binding choices. On supported targets, an owned `@Observable` model generally uses `@State`, and `@Bindable` provides projected bindings when needed. Preserve `ObservableObject`/`@StateObject` for an existing design or older deployment target where that is appropriate; do not change wrappers mechanically. Check which properties a view actually reads and test the affected refresh behavior.
- Preview APIs depend on the compiler and SDK as well as runtime availability. A preview should use deterministic local sample state and replace unavailable services, credentials, or devices. A working preview does not prove the running application's lifecycle or accessibility behavior.

Primary sources checked October 16, 2026: [UIViewRepresentable updates](https://developer.apple.com/documentation/swiftui/uiviewrepresentable/updateuiview(_:context:)), [Core Bluetooth queue parameter](https://developer.apple.com/documentation/corebluetooth/cbcentralmanager/init(delegate:queue:options:)), [Observation migration](https://developer.apple.com/documentation/swiftui/migrating-from-the-observable-object-protocol-to-the-observable-macro). These corrections and review criteria are independently authored. No current upstream Swift skill files or beta platform examples were copied.

The pre-existing bundled guide collection has its own source terms; see [UPSTREAM-NOTICE.md](UPSTREAM-NOTICE.md) and [UPSTREAM-LICENSE](UPSTREAM-LICENSE).
