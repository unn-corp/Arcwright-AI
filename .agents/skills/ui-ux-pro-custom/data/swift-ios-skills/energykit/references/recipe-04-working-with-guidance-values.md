## Working with Guidance Values

Each `ElectricityGuidance.Value` contains a time interval and a rating
from 0.0 to 1.0. Lower ratings indicate better times to use electricity.

```swift
func processGuidanceValues(_ values: [ElectricityGuidance.Value]) {
    for value in values {
        let interval = value.interval
        let rating = value.rating  // 0.0 (best) to 1.0 (worst)

        print("From \(interval.start) to \(interval.end): rating \(rating)")
    }
}

// Find the best time to charge
func bestChargingWindow(
    in values: [ElectricityGuidance.Value]
) -> ElectricityGuidance.Value? {
    values.min(by: { $0.rating < $1.rating })
}

// Find all "good" windows below a threshold
func goodWindows(
    in values: [ElectricityGuidance.Value],
    threshold: Double = 0.3
) -> [ElectricityGuidance.Value] {
    values.filter { $0.rating <= threshold }
}
```

### Displaying Guidance in SwiftUI

```swift
import SwiftUI
import EnergyKit

struct GuidanceTimelineView: View {
    let values: [ElectricityGuidance.Value]

    var body: some View {
        List(values, id: \.interval.start) { value in
            HStack {
                VStack(alignment: .leading) {
                    Text(value.interval.start, style: .time)
                    Text(value.interval.end, style: .time)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                RatingIndicator(rating: value.rating)
            }
        }
    }
}

struct RatingIndicator: View {
    let rating: Double

    var color: Color {
        if rating <= 0.3 { return .green }
        if rating <= 0.6 { return .yellow }
        return .red
    }

    var label: String {
        if rating <= 0.3 { return "Good" }
        if rating <= 0.6 { return "Fair" }
        return "Avoid"
    }

    var body: some View {
        Text(label)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.2))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }
}
```
