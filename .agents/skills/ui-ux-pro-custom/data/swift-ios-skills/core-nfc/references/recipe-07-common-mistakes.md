## Common Mistakes

### DON'T: Forget the NFC entitlement

Without the `com.apple.developer.nfc.readersession.formats` entitlement,
session creation crashes at runtime.

```swift
// WRONG -- entitlement not added, crashes
let session = NFCNDEFReaderSession(
    delegate: self, queue: nil, invalidateAfterFirstRead: true
)

// CORRECT -- add entitlement in Signing & Capabilities first
// Then the same code works:
let session = NFCNDEFReaderSession(
    delegate: self, queue: nil, invalidateAfterFirstRead: true
)
```

### DON'T: Skip the readingAvailable check

Attempting to create an NFC session on an unsupported device (iPad, iPod
touch, or iPhone 6s and earlier) crashes.

```swift
// WRONG
func scan() {
    let session = NFCNDEFReaderSession(
        delegate: self, queue: nil, invalidateAfterFirstRead: true
    )
    session.begin()
}

// CORRECT
func scan() {
    guard NFCNDEFReaderSession.readingAvailable else {
        showUnsupportedAlert()
        return
    }
    let session = NFCNDEFReaderSession(
        delegate: self, queue: nil, invalidateAfterFirstRead: true
    )
    session.begin()
}
```

### DON'T: Ignore session invalidation errors

The session invalidates for multiple reasons. Distinguishing user cancellation
from real errors prevents false error alerts.

```swift
// WRONG -- shows error when user cancels
func readerSession(
    _ session: NFCNDEFReaderSession,
    didInvalidateWithError error: Error
) {
    showAlert("NFC Error: \(error.localizedDescription)")
}

// CORRECT -- filter expected invalidation reasons
func readerSession(
    _ session: NFCNDEFReaderSession,
    didInvalidateWithError error: Error
) {
    let nfcError = error as? NFCReaderError
    switch nfcError?.code {
    case .readerSessionInvalidationErrorUserCanceled,
         .readerSessionInvalidationErrorFirstNDEFTagRead:
        break  // Normal termination
    default:
        showAlert("NFC Error: \(error.localizedDescription)")
    }
    self.session = nil
}
```

### DON'T: Hold a strong reference to a stale session

Once a session is invalidated, it cannot be restarted. Nil out your reference
and create a new session for the next scan.

```swift
// WRONG -- reusing invalidated session
func scanAgain() {
    session?.begin()  // Does nothing, session is dead
}

// CORRECT -- create a new session
func scanAgain() {
    session = NFCNDEFReaderSession(
        delegate: self, queue: nil, invalidateAfterFirstRead: false
    )
    session?.begin()
}
```

### DON'T: Write without checking tag status

Writing to a read-only tag silently fails or produces confusing errors.

```swift
// WRONG -- writes without checking status
tag.writeNDEF(message) { error in
    // May fail on read-only tags
}

// CORRECT -- check status first
tag.queryNDEFStatus { status, capacity, error in
    guard status == .readWrite else {
        session.invalidate(errorMessage: "Tag is read-only.")
        return
    }
    tag.writeNDEF(message) { error in
        // Handle result
    }
}
```
