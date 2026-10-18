## NDEF Reader Session

Use `NFCNDEFReaderSession` to read NDEF-formatted data from tags. This is the
simplest path for reading standard tag content like URLs, text, and MIME data.

```swift
import CoreNFC

final class NDEFReader: NSObject, NFCNDEFReaderSessionDelegate {
    private var session: NFCNDEFReaderSession?

    func beginScanning() {
        guard NFCNDEFReaderSession.readingAvailable else { return }

        session = NFCNDEFReaderSession(
            delegate: self,
            queue: nil,
            invalidateAfterFirstRead: false
        )
        session?.alertMessage = "Hold your iPhone near an NFC tag."
        session?.begin()
    }

    // MARK: - NFCNDEFReaderSessionDelegate

    func readerSessionDidBecomeActive(_ session: NFCNDEFReaderSession) {
        // Session is scanning
    }

    func readerSession(
        _ session: NFCNDEFReaderSession,
        didDetectNDEFs messages: [NFCNDEFMessage]
    ) {
        for message in messages {
            for record in message.records {
                processRecord(record)
            }
        }
    }

    func readerSession(
        _ session: NFCNDEFReaderSession,
        didInvalidateWithError error: Error
    ) {
        let nfcError = error as? NFCReaderError
        if nfcError?.code != .readerSessionInvalidationErrorFirstNDEFTagRead,
           nfcError?.code != .readerSessionInvalidationErrorUserCanceled {
            print("Session invalidated: \(error.localizedDescription)")
        }
        self.session = nil
    }
}
```

### Reading with Tag Connection

For read-write operations, use the tag-detection delegate method to connect
to individual tags:

```swift
func readerSession(
    _ session: NFCNDEFReaderSession,
    didDetect tags: [any NFCNDEFTag]
) {
    guard let tag = tags.first else {
        session.restartPolling()
        return
    }

    session.connect(to: tag) { error in
        if let error {
            session.invalidate(errorMessage: "Connection failed: \(error)")
            return
        }

        tag.queryNDEFStatus { status, capacity, error in
            guard error == nil else {
                session.invalidate(errorMessage: "Query failed.")
                return
            }

            switch status {
            case .notSupported:
                session.invalidate(errorMessage: "Tag is not NDEF compliant.")
            case .readOnly:
                tag.readNDEF { message, error in
                    if let message {
                        self.processMessage(message)
                    }
                    session.invalidate()
                }
            case .readWrite:
                tag.readNDEF { message, error in
                    if let message {
                        self.processMessage(message)
                    }
                    session.alertMessage = "Tag read successfully."
                    session.invalidate()
                }
            @unknown default:
                session.invalidate()
            }
        }
    }
}
```
