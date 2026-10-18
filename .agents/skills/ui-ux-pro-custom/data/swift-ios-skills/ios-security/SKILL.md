---
name: ios-security
description: "Secure or review iOS credential storage, file protection, CryptoKit, biometric access, ATS, pinning, and privacy manifests. Authentication flows use authentication; device attestation uses device-integrity."
---

# iOS Security

Identify the sensitive data, adversary, storage/transmission path, and required
availability while the device is locked or in the background. Inspect existing
security controls before adding a new cryptographic or storage abstraction.

## Correctness constraints

- Store credentials and cryptographic key material in Keychain or appropriate
  hardware-backed storage. Keep ordinary preferences in UserDefaults and protect
  sensitive files with suitable file protection/encryption. Select Keychain
  accessibility and `ThisDeviceOnly` behavior from actual background, backup,
  migration, and passcode requirements; avoid deprecated Always accessibility.
- Handle Keychain status codes and update/delete behavior. Scope access groups
  intentionally. Do not hardcode secrets, expose them in URLs/logs, or assume
  clearing one Swift value reliably zeroizes every copy in memory.
- Use supported CryptoKit primitives with correct key/nonce lifecycle and
  authenticated encryption for sensitive payloads. Hashing is not encryption;
  encryption without integrity does not establish authenticity. Preserve format
  compatibility and key rotation/recovery for existing data.
- Keep Secure Enclave private key material non-exportable where supported and
  appropriate; store the reference/recovery metadata correctly. Hardware-backed
  keys do not remove the need for authorization or error handling.
- For biometric access, check available policy, choose access-control flags
  deliberately, provide the accepted fallback, and include the Face ID usage
  string. Bind access to protected Keychain material where the requirement is
  key access, rather than trusting an unrelated prior UI boolean.
- Preserve HTTPS/ATS. Resolve certificate trust normally; use narrowly scoped,
  justified exceptions only when required. If pinning is part of the threat
  model, retain chain/host verification and plan backup pins plus rotation;
  a single hardcoded certificate without recovery can strand users.
- Validate untrusted input and file/URL paths at the relevant boundary. Keep
  user/server authentication separate from device-integrity signals. Jailbreak
  heuristics alone are not a dependable authorization boundary.
- Match actual app/SDK behavior to privacy manifests and required-reason API
  declarations. Check current Apple requirements before submission; declaring
  an unused reason or copying a manifest does not establish compliance.

## Validation and completion

Build with the app's actual entitlements and concurrency settings. Exercise the
changed access control with relevant locked/unlocked, denied/cancelled,
background, reinstall/restore, and key-rotation states. Verify rejection of
invalid/tampered data and preserve access to legitimate existing data. Use
known cryptographic vectors or established library behavior rather than a
self-confirming encryption roundtrip as the only proof.

Stop when the identified exposure and its recovery paths are addressed. Report
remaining device/server checks and migration risks; do not add pinning, new
crypto, or a broad security rewrite without a concrete requirement.

## Conditional recipes

- [Keychain](references/implementation-guide.md#keychain-services),
  [protection classes](references/implementation-guide.md#data-protection),
  [CryptoKit](references/implementation-guide.md#cryptokit),
  [Secure Enclave](references/implementation-guide.md#secure-enclave),
  [biometrics](references/implementation-guide.md#biometric-authentication),
  [ATS](references/implementation-guide.md#app-transport-security-ats), and
  [pinning](references/implementation-guide.md#certificate-pinning).
- [Advanced crypto](references/cryptokit-advanced.md),
  [file storage](references/file-storage-patterns.md),
  [privacy manifests](references/privacy-manifest.md), and
  [App Review context](references/app-review-guidelines.md) only as relevant.

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
