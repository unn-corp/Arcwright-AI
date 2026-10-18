## Review Checklist

- [ ] NFC capability added in Signing & Capabilities
- [ ] `NFCReaderUsageDescription` set in Info.plist
- [ ] `com.apple.developer.nfc.readersession.formats` entitlement configured with correct tag types
- [ ] `NFCNDEFReaderSession.readingAvailable` checked before creating sessions
- [ ] Session delegate set before calling `begin()`
- [ ] Session reference set to nil after invalidation
- [ ] `didInvalidateWithError` distinguishes user cancellation from actual errors
- [ ] NDEF status queried before write operations
- [ ] Tag capacity checked before writing large messages
- [ ] ISO 7816 application identifiers listed in Info.plist if using `NFCTagReaderSession`
- [ ] Background tag reading configured with associated domains if needed
- [ ] Only one reader session active at a time
