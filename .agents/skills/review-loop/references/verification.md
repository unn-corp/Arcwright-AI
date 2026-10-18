# Verification shared by Review Loop, Full Send, and Full Stop

Evidence is observed command output, a reproduction, actual app interaction, or a screenshot, tied to the exercised source and inputs. Retain recorded proof across resumptions while that identity and provenance remain verifiable. Unverified inherited claims are leads; repeat affected checks when source, inputs, or provenance require it.

## Define and prove the requested outcome

Before editing, derive a small set of observable acceptance criteria and scope boundaries from the request, repository contracts, and supplied examples. Infer routine details without asking for confirmation. Record them in the private ledger; do not invent new requirements or require a separate specification for a small task. Ask only when an unresolved ambiguity materially changes the result.

Map each criterion to its check, source revision, observed evidence, and status: demonstrated, pending, or failed. Choose the criteria independently of the implementation so passing existing tests cannot substitute for an untested requested outcome. For example, requested keyboard access needs keyboard evidence even when mouse interaction and unit tests pass. Reviewers receive these criteria and boundaries. Update them when the user changes scope, with a recorded reason.

Before claiming completion or readiness, every applicable criterion needs evidence. Carry pending or failed criteria into the handoff rather than averaging them into an overall pass. Keep the detailed mapping private; show only evidence and limitations useful to the user.

## Select relevant checks

Choose checks appropriate to the change and repository requirements:

- For a bug, reproduce the original failure when practical, apply the fix, and observe the same case pass. If the original failure cannot be reproduced, state that limitation and obtain the strongest available direct evidence.
- Run applicable repository checks, including required CI, type checking, linting, and tests. Add a focused regression test when it establishes behavior meaningfully and the project supports it. Reversible low-impact changes do not require new tests that merely mirror the implementation.
- For UI and runtime changes, run the app and inspect the affected behavior directly. Mocked tests alone do not prove the user experience. Use available native browser/evidence tools; in Arcwright Code/T3 Code, use `preview_*` and save useful captures as described in [MCP operations](arcwright-mcp.md).
- Resolve environmental or flaky failures where possible. Record unrelated pre-existing failures accurately; they do not make a required failed check green or authorize bypassing it.

- When public APIs, schemas, persisted configuration, stored data, or serialization formats change, apply [compatibility and recovery checks](compatibility.md). Skip that assessment for changes that do not affect those contracts.

## Bind proof to source

Record the tested commit and, for local uncommitted work, the diff fingerprint and applicable untracked files. Tie each check and reviewer result to that source. A push/rebase/merge-from-base or concurrent edit requires assessing affected proof. Refresh relevant checks and focused review for changed behavior; retain still-valid evidence when source and inputs are unchanged.

Before delivery, inspect the final scoped diff for unintended changes and confirm the current PR head matches the verified revision. A new remote commit requires inspection and integration without overwriting another contributor's work, followed by affected verification.

If necessary behavior cannot be demonstrated or a required check cannot pass, record the remaining work and use the harness's question tool when user input is actually required. Do not claim verification or approval that did not occur, because unsupported success claims hide unfinished work.
