## Writing NDEF Messages

Write NDEF data to a connected tag. Always check `readWrite` status first.

```swift
func writeToTag(
    tag: any NFCNDEFTag,
    session: NFCNDEFReaderSession,
    url: URL
) {
    tag.queryNDEFStatus { status, capacity, error in
        guard status == .readWrite else {
            session.invalidate(errorMessage: "Tag is read-only.")
            return
        }

        guard let payload = NFCNDEFPayload.wellKnownTypeURIPayload(
            url: url
        ) else {
            session.invalidate(errorMessage: "Invalid URL.")
            return
        }

        let message = NFCNDEFMessage(records: [payload])

        tag.writeNDEF(message) { error in
            if let error {
                session.invalidate(
                    errorMessage: "Write failed: \(error.localizedDescription)"
                )
            } else {
                session.alertMessage = "Tag written successfully."
                session.invalidate()
            }
        }
    }
}
```
