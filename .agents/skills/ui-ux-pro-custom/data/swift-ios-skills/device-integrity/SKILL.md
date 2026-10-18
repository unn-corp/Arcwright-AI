---
name: device-integrity
description: "Implement or review DeviceCheck and App Attest client/server flows, including key lifecycle, attestation, per-request assertions, and replay protection. This provides integrity signals, not user authentication."
---

# DeviceCheck and App Attest

Start with the protected request and server trust model. DeviceCheck bits and
App Attest are integrity/risk signals; they do not authenticate a user or prove
every action is legitimate. Preserve existing authentication and authorization.

## Choose and bind the signal

- Check support and the App Attest environment entitlement. Separate development
  and production verification. Decide unsupported-device behavior explicitly
  according to risk; silently accepting an unverified request is not equivalent
  protection.
- DeviceCheck produces a device token for server validation and server-managed
  per-device bits. Keep Apple service credentials on the server. Do not treat
  the client token as locally verifiable identity or a durable user account.
- For App Attest, generate a key once, persist its identifier securely, and
  attest that key with a fresh server-issued challenge. Store verified public
  key/receipt and app/environment binding on the server. Coordinate concurrent
  initialization to avoid repeated generation/attestation.
- Follow Apple's complete server attestation algorithm, including certificate
  chain, authenticator/app identity, nonce, and key checks. Abbreviated client
  recipes are not a complete cryptographic verifier. Reject mismatched or
  expired challenge state and do not let the client declare its own success.
- Generate assertions for protected requests using a client-data hash whose
  exact meaning is agreed with the server. Bind the intended request/action
  and server challenge as the protocol requires; signatures over an unrelated
  or reinterpreted payload do not authorize the received operation.
- Verify assertion signatures, app binding, and counters on the server with
  replay-resistant state updates before accepting side effects. Preserve
  counter consistency under concurrent requests; do not merely log a repeated
  counter and process the request anyway.
- Retry transient server unavailability within a bounded policy. Invalidated
  keys need a controlled regeneration/re-attestation path; permanent failures
  should surface to the risk policy. Do not regenerate for every request or
  hide all errors behind an automatic allow fallback.
- Keep raw proofs, identifiers, and server secrets out of routine logs. Roll
  out with observable failure reasons and a deliberate recovery path.

## Validation and completion

Verify the full client/server exchange on supported hardware and against the
correct environment. Check rejection of altered payloads, mismatched challenge
or app, replayed assertions, and revoked/invalidated keys for the changed
protocol. A simulator result or client-only mock does not establish attestation.
Use an established verifier and its documented vectors rather than inventing
cryptographic expectations from implementation output.

Stop when the protected operation enforces the agreed checks and recovery policy.
State server/device checks that could not run; do not loosen verification to
make development traffic pass.

## Conditional recipes

- [DeviceCheck](references/implementation-guide.md#dcdevice-devicecheck-tokens),
  [App Attest](references/implementation-guide.md#dcappattestservice-app-attest),
  [keys](references/implementation-guide.md#app-attest-key-generation),
  [attestation](references/implementation-guide.md#app-attest-attestation-flow),
  and [assertions](references/implementation-guide.md#app-attest-assertion-flow).
- [Server verification context](references/implementation-guide.md#server-verification-guidance),
  [errors/key recovery](references/implementation-guide.md#error-handling), and
  [rollout patterns](references/implementation-guide.md#common-patterns).

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
