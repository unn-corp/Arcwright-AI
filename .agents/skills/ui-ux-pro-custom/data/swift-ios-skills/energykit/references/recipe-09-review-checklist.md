## Review Checklist

- [ ] `com.apple.developer.energykit` entitlement added to the project
- [ ] `EnergyKitError.unsupportedRegion` handled with user-facing message
- [ ] `EnergyKitError.permissionDenied` handled gracefully
- [ ] Guidance token stored and passed to load event submissions
- [ ] Venues discovered via `EnergyVenue.venues()` before querying guidance
- [ ] Load event sessions follow `.begin` -> `.active` -> `.end` lifecycle
- [ ] `ElectricityGuidance.Value.rating` interpreted correctly (lower is better)
- [ ] `SuggestedAction` matches the device type (`.shift` for EV, `.reduce` for HVAC)
- [ ] Insight queries use appropriate granularity for the time range
- [ ] Rate limiting handled via `EnergyKitError.rateLimitExceeded`
- [ ] Service unavailability handled with retry logic
