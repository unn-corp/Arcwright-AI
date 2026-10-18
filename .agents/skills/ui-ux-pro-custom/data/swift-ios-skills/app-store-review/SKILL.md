---
name: app-store-review
description: "Prepare an iOS app for App Store review or investigate a rejection, privacy declaration, entitlement, payment, or submission problem. Verify current Apple rules for the app's storefront before applying policy examples."
---

# App Store Review Preparation

Start with the actual submission or rejection: build, storefronts, affected
features, and cited guideline. Verify current Apple documentation before making
policy claims. Bundled examples retain historical details; payment exceptions,
regional terms, required-reason APIs, and submission requirements can change.

## Review the relevant evidence

- Reproduce the reviewer's path on the submitted build. Remove broken links,
  placeholder content, and inaccessible features. Supply working review access
  through the approved submission mechanism; never put credentials in source or
  diagnostic artifacts.
- Compare screenshots, metadata, age/content declarations, privacy labels, and
  review notes with the actual app. Explain non-obvious hardware, account,
  subscription, or location prerequisites concisely.
- Map actual app and SDK data use to the privacy manifest, declared
  required-reason APIs, privacy labels, and accessible privacy policy. A copied
  manifest does not establish accurate disclosure.
- Check payment/subscription behavior against the current rules and entitlements
  for each relevant storefront. Verify required terms, entitlement delivery,
  restoration, and cancellation paths. Do not treat a historical blanket rule
  about external links as current policy.
- Request ATT only when the app's actual tracking requires it. Provide context,
  respect denial, and do not gate unrelated app functionality on consent.
- Match capabilities and usage descriptions to implemented features. Use
  specific purpose strings; remove unused permissions and private API usage.
  Preserve actor requirements for permission and purchase UI.
- Inspect affected accessibility and HIG behavior: navigation, modal dismissal,
  empty/error states, Dynamic Type, appearance, widgets, and Live Activities as
  applicable. Avoid a general redesign to address an unrelated rejection.

## Respond or submit

For a rejection, explain the concrete change or provide a reproducible path and
supporting evidence linked to the cited guideline. Keep appeals professional
and specific; ask for review of the documented issue rather than asserting
acceptance because another app exists.

Before an authorized submission, verify the intended archive/signing, current
submission prerequisites, required metadata, review access, and relevant device
behavior. An audit or source fix does not authorize uploading, submitting,
changing commercial agreements, or starting a release.

Stop when the requested review issue is resolved or a precise remaining blocker
is documented. Distinguish local checks, current guideline checks, and actual
App Review acceptance; do not claim approval before Apple grants it.

## Conditional checklists

- [Rejections](references/implementation-guide.md#top-rejection-reasons-and-how-to-avoid-them),
  [data use](references/implementation-guide.md#data-use-sharing-and-privacy-policy-guideline-512),
  [ATT](references/implementation-guide.md#app-tracking-transparency-att),
  and [entitlements](references/implementation-guide.md#entitlements-and-capabilities).
- [Privacy manifest recipes](references/privacy-manifest.md) and
  [HIG/submission checklists](references/review-checklists.md) for affected areas.
- [Submission](references/implementation-guide.md#submission-workflow),
  [metadata](references/implementation-guide.md#metadata-best-practices),
  and [appeals](references/implementation-guide.md#appeal-process).

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
