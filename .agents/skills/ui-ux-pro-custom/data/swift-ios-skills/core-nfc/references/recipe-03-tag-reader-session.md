## Tag Reader Session

Use `NFCTagReaderSession` when you need direct access to the native tag
protocol (ISO 7816, ISO 15693, FeliCa, or MIFARE).

```swift
final class TagReader: NSObject, NFCTagReaderSessionDelegate {
    private var session: NFCTagReaderSession?

    func beginScanning() {
        session = NFCTagReaderSession(
            pollingOption: [.iso14443, .iso15693],
            delegate: self,
            queue: nil
        )
        session?.alertMessage = "Hold your iPhone near a tag."
        session?.begin()
    }

    func tagReaderSessionDidBecomeActive(
        _ session: NFCTagReaderSession
    ) { }

    func tagReaderSession(
        _ session: NFCTagReaderSession,
        didDetect tags: [NFCTag]
    ) {
        guard let tag = tags.first else { return }

        session.connect(to: tag) { error in
            guard error == nil else {
                session.invalidate(
                    errorMessage: "Connection failed."
                )
                return
            }

            switch tag {
            case .iso7816(let iso7816Tag):
                self.readISO7816(tag: iso7816Tag, session: session)
            case .miFare(let miFareTag):
                self.readMiFare(tag: miFareTag, session: session)
            case .iso15693(let iso15693Tag):
                self.readISO15693(tag: iso15693Tag, session: session)
            case .feliCa(let feliCaTag):
                self.readFeliCa(tag: feliCaTag, session: session)
            @unknown default:
                session.invalidate(errorMessage: "Unsupported tag type.")
            }
        }
    }

    func tagReaderSession(
        _ session: NFCTagReaderSession,
        didInvalidateWithError error: Error
    ) {
        self.session = nil
    }
}
```
