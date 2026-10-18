## Setup

### Project Configuration

1. Add the **Near Field Communication Tag Reading** capability in Xcode
2. Add `NFCReaderUsageDescription` to Info.plist with a user-facing reason string
3. Add the `com.apple.developer.nfc.readersession.formats` entitlement with the tag types your app reads (e.g., `NDEF`, `TAG`)
4. For ISO 7816 tags, add supported application identifiers to `com.apple.developer.nfc.readersession.iso7816.select-identifiers` in Info.plist

### Device Requirements

NFC reading requires iPhone 7 or later. Always check for reader session
availability before presenting NFC UI.

```swift
import CoreNFC

guard NFCNDEFReaderSession.readingAvailable else {
    // Device does not support NFC or feature is restricted
    showUnsupportedMessage()
    return
}
```

### Key Types

| Type | Role |
|---|---|
| `NFCNDEFReaderSession` | Scans for NDEF-formatted tags |
| `NFCTagReaderSession` | Scans for ISO7816, ISO15693, FeliCa, MIFARE tags |
| `NFCNDEFMessage` | Collection of NDEF payload records |
| `NFCNDEFPayload` | Single record within an NDEF message |
| `NFCNDEFTag` | Protocol for interacting with an NDEF-capable tag |
