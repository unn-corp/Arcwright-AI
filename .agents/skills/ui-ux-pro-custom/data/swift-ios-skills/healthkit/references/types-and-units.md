# HealthKit Types and Units

## Common Data Types

### HKQuantityTypeIdentifier

| Identifier | Category | Unit |
|---|---|---|
| `.stepCount` | Fitness | `.count()` |
| `.distanceWalkingRunning` | Fitness | `.meter()` |
| `.activeEnergyBurned` | Fitness | `.kilocalorie()` |
| `.basalEnergyBurned` | Fitness | `.kilocalorie()` |
| `.heartRate` | Vitals | `.count()/.minute()` |
| `.restingHeartRate` | Vitals | `.count()/.minute()` |
| `.oxygenSaturation` | Vitals | `.percent()` |
| `.bodyMass` | Body | `.gramUnit(with: .kilo)` |
| `.bodyMassIndex` | Body | `.count()` |
| `.height` | Body | `.meter()` |
| `.bodyFatPercentage` | Body | `.percent()` |
| `.bloodGlucose` | Lab | `.gramUnit(with: .milli).unitDivided(by: .literUnit(with: .deci))` |

### HKCategoryTypeIdentifier

Common category types: `.sleepAnalysis`, `.mindfulSession`, `.appleStandHour`

### HKCharacteristicType

Read-only user characteristics: `.dateOfBirth`, `.biologicalSex`, `.bloodType`, `.fitzpatrickSkinType`

## HKUnit Reference

```swift
// Basic units
HKUnit.count()                              // Steps, counts
HKUnit.meter()                              // Distance
HKUnit.mile()                               // Distance (imperial)
HKUnit.kilocalorie()                        // Energy
HKUnit.joule(with: .kilo)                   // Energy (SI)
HKUnit.gramUnit(with: .kilo)                // Mass (kg)
HKUnit.pound()                              // Mass (imperial)
HKUnit.percent()                            // Percentage

// Compound units
HKUnit.count().unitDivided(by: .minute())   // Heart rate (bpm)
HKUnit.meter().unitDivided(by: .second())   // Speed (m/s)

// Prefixed units
HKUnit.gramUnit(with: .milli)               // Milligrams
HKUnit.literUnit(with: .deci)               // Deciliters
```

