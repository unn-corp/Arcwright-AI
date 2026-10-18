---
name: app-clips
description: "Build or debug App Clips, invocation URLs, experience setup, and migration into the full app. Includes target-size and capability constraints; ordinary deep links without an App Clip use the app's routing guidance."
---

# App Clips

Build the smallest experience that completes the invocation's task. Inspect the
full app, App Clip target, deployment target, and existing URL router before
adding another abstraction. Keep the full app and clip behavior consistent.

## Decisions and constraints

- Use a separate App Clip target linked to its parent, with correct bundle IDs,
  embedding, and entitlements. Share only code/assets the clip needs; exclude
  heavyweight full-app dependencies.
- Parse and validate `NSUserActivityTypeBrowsingWeb` invocations. The full app
  replaces the clip after installation and must handle the same URLs. Handle
  re-entry without an invocation URL and restore only safe local state.
- Configure the default experience, associated domains, and hosted AASA file
  together. An Xcode launch alone does not test experience discovery or the
  invocation payload. Choose advanced experiences only when the invocation
  method needs them.
- Measure the thinned archive against the limit applicable to the target OS and
  experience. Do not infer download size from the source tree or an unthinned
  binary. Preserve a small startup path as well as a small binary.
- Treat clip-local storage as ephemeral. Move required state through a shared
  App Group or server, verify both targets' permissions, and handle the full app
  seeing absent or partially written state. Verify Keychain/account migration
  separately from ordinary file sharing.
- Check actual App Clip capability restrictions before reusing a framework.
  Background execution and identifiers differ from the full app. Use location
  confirmation when only a location claim is needed; do not request broader
  access by habit. Keep ephemeral notification behavior within supported limits.
- Offer `SKOverlay` after the user's task when useful. Installation promotion
  must not block task completion.

## Validation and completion

Exercise a realistic invocation through a Local Experience or `_XCAppClipURL`,
then open the same URL in the full app. Check unknown/malformed URLs, relaunch
without a URL, data migration, unavailable capabilities, and the thinned size
report as relevant to the change. Use a device for system discovery behavior;
state when only simulator or direct-launch checks were possible.

Stop once the requested invocation/task works in both targets and the affected
size, migration, and capability checks pass. Do not add unrelated invocation
methods or rebuild the full app's onboarding to finish a clip change.

## Conditional recipes

Read only the section needed:

- [Target setup](references/implementation-guide.md#app-clip-target-setup),
  [URL handling](references/implementation-guide.md#invocation-url-handling),
  [experiences](references/implementation-guide.md#app-clip-experience-configuration),
  [size limits](references/implementation-guide.md#size-limits), and
  [invocation methods](references/implementation-guide.md#invocation-methods).
- [Data migration](references/implementation-guide.md#data-migration-to-full-app),
  [promotion](references/implementation-guide.md#skoverlay-for-full-app-promotion),
  [location confirmation](references/implementation-guide.md#location-confirmation),
  [lifecycle](references/implementation-guide.md#lifecycle-and-ephemeral-nature),
  and [capabilities](references/implementation-guide.md#capabilities-and-limitations).

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
