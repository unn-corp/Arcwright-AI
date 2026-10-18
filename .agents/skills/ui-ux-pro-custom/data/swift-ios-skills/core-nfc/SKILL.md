---
name: core-nfc
description: "Implement or debug Core NFC sessions for NDEF and supported raw tag protocols, including reads, writes, entitlement setup, and session recovery. Wallet payments and passes use passkit-wallet."
---

# CoreNFC

Read and write NFC tags on iPhone using the CoreNFC framework. Covers NDEF
reader sessions, tag reader sessions, NDEF message construction, entitlements,
and background tag reading. Targets Swift 6.2 / iOS 26+.

## Essential constraints

- Check device support, NFC entitlement, usage description, and required tag identifiers before opening a session.
- Allow one reader session at a time; distinguish cancellation from errors and discard invalidated sessions.
- Query tag writability and capacity before writing; verify on supported hardware.

## Load only the needed topic

Read the relevant recipe below, plus its linked detail when needed. The original
examples and checks remain available without loading every API into the task.

| Topic | Reference |
| --- | --- |
| Setup | [recipe-01-setup.md](references/recipe-01-setup.md) |
| NDEF Reader Session | [recipe-02-ndef-reader-session.md](references/recipe-02-ndef-reader-session.md) |
| Tag Reader Session | [recipe-03-tag-reader-session.md](references/recipe-03-tag-reader-session.md) |
| Writing NDEF Messages | [recipe-04-writing-ndef-messages.md](references/recipe-04-writing-ndef-messages.md) |
| NDEF Payload Types | [recipe-05-ndef-payload-types.md](references/recipe-05-ndef-payload-types.md) |
| Background Tag Reading | [recipe-06-background-tag-reading.md](references/recipe-06-background-tag-reading.md) |
| Common Mistakes | [recipe-07-common-mistakes.md](references/recipe-07-common-mistakes.md) |
| Review Checklist | [recipe-08-review-checklist.md](references/recipe-08-review-checklist.md) |
| References | [recipe-09-references.md](references/recipe-09-references.md) |
