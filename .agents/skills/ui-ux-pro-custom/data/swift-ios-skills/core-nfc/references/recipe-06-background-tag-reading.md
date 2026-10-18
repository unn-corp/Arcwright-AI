## Background Tag Reading

On iPhone XS and later, iOS can read NFC tags in the background without
opening your app. To opt in:

1. Add associated domains or universal links that match the URL on your tags
2. Register your app for the tag's NDEF content type
3. Include your app's bundle ID in the tag's NDEF record

When a user taps a compatible tag, iOS displays a notification that opens
your app. Handle the tag data via `NSUserActivity`:

```swift
func scene(
    _ scene: UIScene,
    continue userActivity: NSUserActivity
) {
    guard userActivity.activityType ==
        NSUserActivityTypeBrowsingWeb else { return }

    if let message = userActivity.ndefMessagePayload {
        for record in message.records {
            processRecord(record)
        }
    }
}
```
