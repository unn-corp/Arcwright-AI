# Hook authoring rules

- Identify the active host and actual hook/plugin schema before selecting events, settings paths, payload parsing, or decision codes.
- Reuse a focused repository check; separate advisory feedback from a real pre-action block. No routine full-suite execution per edit.
- Scripts belong in the project's Arcwright directory, registrations in documented host config. Preserve user hooks and unrelated settings; installed bundles stay read-only.
- Parse inputs as data, protect secrets, bound execution, and prevent recursive/duplicate runs.
- Verify a relevant allowed event and failure path. If unsupported, report the limit and use an authorized Git/package/CI alternative without inventing hooks.
- Load the Claude adapter only for that host. Existing authorization applies; no repeated routine confirmation or AI attribution.
