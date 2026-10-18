## Transitions (iOS 17+)

Control how views animate on insertion and removal.

```swift
if showBanner {
    BannerView()
        .transition(.move(edge: .top).combined(with: .opacity))
}
```

Built-in types: `.opacity`, `.slide`, `.scale`, `.scale(_:anchor:)`,
`.move(edge:)`, `.push(from:)`, `.offset(x:y:)`, `.identity`,
`.blurReplace`, `.blurReplace(_:)`, `.symbolEffect`,
`.symbolEffect(_:options:)`.

Asymmetric transitions:

```swift
.transition(.asymmetric(
    insertion: .push(from: .bottom),
    removal: .opacity
))
```
