## Call Directory Extension

Create a Call Directory extension to provide caller ID and call blocking.

```swift
import CallKit

final class CallDirectoryHandler: CXCallDirectoryProvider {
    override func beginRequest(
        with context: CXCallDirectoryExtensionContext
    ) {
        if context.isIncremental {
            addOrRemoveIncrementalEntries(to: context)
        } else {
            addAllEntries(to: context)
        }
        context.completeRequest()
    }

    private func addAllEntries(
        to context: CXCallDirectoryExtensionContext
    ) {
        // Phone numbers must be in ascending order (E.164 format as Int64)
        let blockedNumbers: [CXCallDirectoryPhoneNumber] = [
            18005551234, 18005555678
        ]
        for number in blockedNumbers {
            context.addBlockingEntry(
                withNextSequentialPhoneNumber: number
            )
        }

        let identifiedNumbers: [(CXCallDirectoryPhoneNumber, String)] = [
            (18005551111, "Local Pizza"),
            (18005552222, "Dentist Office")
        ]
        for (number, label) in identifiedNumbers {
            context.addIdentificationEntry(
                withNextSequentialPhoneNumber: number,
                label: label
            )
        }
    }
}
```

Reload the extension from the main app after data changes:

```swift
CXCallDirectoryManager.sharedInstance.reloadExtension(
    withIdentifier: "com.example.app.CallDirectory"
) { error in
    if let error { print("Reload failed: \(error)") }
}
```
