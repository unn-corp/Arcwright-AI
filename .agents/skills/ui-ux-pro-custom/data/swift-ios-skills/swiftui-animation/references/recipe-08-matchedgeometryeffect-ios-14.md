## matchedGeometryEffect (iOS 14+)

Synchronize geometry between views for shared-element animations.

```swift
struct HeroView: View {
    @Namespace private var heroSpace
    @State private var isExpanded = false

    var body: some View {
        if isExpanded {
            DetailCard()
                .matchedGeometryEffect(id: "card", in: heroSpace)
                .onTapGesture {
                    withAnimation(.spring(duration: 0.4, bounce: 0.2)) {
                        isExpanded = false
                    }
                }
        } else {
            ThumbnailCard()
                .matchedGeometryEffect(id: "card", in: heroSpace)
                .onTapGesture {
                    withAnimation(.spring(duration: 0.4, bounce: 0.2)) {
                        isExpanded = true
                    }
                }
        }
    }
}
```

Exactly one view per ID must be visible at a time for the interpolation to work.
