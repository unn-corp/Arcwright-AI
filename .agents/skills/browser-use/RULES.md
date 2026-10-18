# Browser exploration rules

- Prefer the host's native collaborative browser according to host policy. Standalone browser-use is an explicit choice or supported fallback.
- Use goal-driven exploration for unknown paths; use existing deterministic tools/tests for known flows.
- Preserve configured provider/model, account, domain scope, visibility, and authorization. No mandatory Anthropic key or fixed model default.
- Verify the installed library API; keys stay private and optional installs/paid runs require scope authorization.
- Keep scripts and evidence in the active Arcwright run or host evidence storage, not the skill directory.
- Inspect final state and relevant evidence, not merely a completion string. Return through the actual host lifecycle; durable regression work uses test-quality.
