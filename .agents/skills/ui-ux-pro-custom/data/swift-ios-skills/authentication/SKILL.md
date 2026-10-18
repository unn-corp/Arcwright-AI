---
name: authentication
description: "Implement or debug Sign in with Apple, OAuth browser sessions, credential state, Password AutoFill, or biometric login on iOS. Use ios-security for general secret storage and cryptography."
---

# iOS Authentication

Identify the existing identity provider, backend session contract, deployment
target, and presentation context. Implement the requested sign-in or credential
behavior without replacing the app's account model.

## Choose and bind the flow

- Use Sign in with Apple through AuthenticationServices, or the supported
  SwiftUI button. Enable the capability and supply a real presentation anchor
  for controller-based flows. Keep UI operations in the required isolation.
- Persist Apple's stable user identifier and any returned profile fields at the
  first authorization. `email` and `fullName` may be absent on later sign-ins;
  do not overwrite known values with nil or force unwrap missing fields.
- Send authorization material to the backend for validation and session
  creation. Verify the token's signature, issuer, audience, expiration, and
  request binding under the provider's documented flow. A decoded token or
  client success callback does not establish a trusted authenticated session.
- Keep session secrets in appropriately configured Keychain storage. Avoid
  plaintext preferences, logs, source code, and long-lived copies of transient
  authorization material. Distinguish credential identifiers from secrets.
- Check Apple credential state when restoring sign-in and handle revocation,
  account transfer, sign-out, and unavailable checks according to the app's
  session policy. A local `isLoggedIn` boolean is insufficient proof.
- Use `ASWebAuthenticationSession` for OAuth browser flows. Verify callback and
  request correlation and retain session/presentation ownership until complete.
  Respect intentional ephemeral-session behavior; do not embed provider login
  in a generic `WKWebView`.
- Use existing-account/AutoFill flows where they fit the product, with correct
  username/password content types. Handle cancellation and noninteractive
  failures without presenting a fatal error or looping through login prompts.
- For local biometric re-entry, check policy availability, provide an accepted
  fallback, and include `NSFaceIDUsageDescription` when needed. A biometric UI
  success is local access control, not server token verification.

## Validation and completion

Exercise first and subsequent authorization, cancelled UI, restored/revoked
credentials, and relevant OAuth failure paths. Verify profile preservation,
server rejection of invalid tokens, secure persistence, and sign-out cleanup
for the behavior changed. Use existing test seams; a mocked success path does
not prove provider presentation or callback configuration.

Stop when the requested flow and session lifecycle work with the existing
backend. State any unavailable provider/device checks; do not expand a login
fix into an identity-provider migration.

## Conditional recipes

- [Apple sign-in](references/implementation-guide.md#sign-in-with-apple),
  [credentials](references/implementation-guide.md#credential-handling),
  [credential state](references/implementation-guide.md#credential-state-checking),
  and [token validation](references/implementation-guide.md#token-validation).
- [OAuth](references/implementation-guide.md#aswebauthenticationsession-oauth),
  [AutoFill](references/implementation-guide.md#password-autofill-credentials),
  and [SwiftUI button](references/implementation-guide.md#swiftui-signinwithapplebutton).
- [Keychain and biometric recipes](references/keychain-biometric.md) when those
  mechanisms are part of the change.

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
