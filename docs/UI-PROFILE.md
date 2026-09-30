# Arcwright-AI UI profile

Companion to the [adoption entry](UNNDEV-UI-STANDARDS.md) and [shared core](UNNDEV-UI-STANDARDS-CORE.md).

## Applicable surfaces

WEB + TOUCH for the workshop website. Installed customer projects and bundled third-party applications are outside this adoption.

## Local authority and preservation

- [Workshop instructions](../CLAUDE.md) remain authoritative, including the prohibition on eyebrow/kicker text and em dashes in user-facing copy.
- [Website styles](../website/src/index.css) and [components](../website/src/components/) own the website’s visual language. Preserve current identity rather than importing a new shared palette.
- Keep website implementation within its existing source boundary. Preserve README/data fallback synchronization when relevant; this standards installation changes no product copy or fallback content.
- This is contributor guidance for this repository. It does not silently distribute or impose the standard through the workflow installer.

## Verification

For a future website change, run the website package’s applicable checks and inspect affected responsive/keyboard states. Packaging, generated outputs and installer payloads are unchanged by this documentation adoption.

For each future implementation, record the affected states and input methods, relevant core rule IDs, focused checks and manual evidence. Documentation installation alone establishes neither runtime compliance nor completion of the existing release gates.

## Exceptions

No new exception is granted by this profile. Keep named existing local exceptions with their governing source. Any new exception must identify the rule ID, bounded surface, reason, owner, compensating behavior, verification and review date. Escalate unresolved conflicts before implementation.
