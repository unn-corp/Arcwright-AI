---
name: "claude-subagent-protocol"
description: "Quick-reference rules for in-process Agent tool orchestration."
---

Load this before any Agent tool call sequence. For the full protocol, see SKILL.md.

## Non-Negotiables

1. **No legacy signals.** In-process flows do NOT use AGENT_SIGNAL, STEP COMPLETE, PEER_SIGNAL, or STATUS_CHECK strings. The Agent tool return value is the sole completion signal.
2. **Worktree is opt-in only.** Default for all roles (including dev) is `isolation: "none"`. Use `isolation: "worktree"` only for parallel epics, abandonable spikes, or risky experiments. Never show `"isolation": "none"` explicitly — omit the field.
3. **Omit default-value fields.** Omit `"isolation"` when none, omit `"run_in_background"` when false. Only include optional fields when they override the default.
4. **Trust but verify.** After any code-writing Agent call, verify actual file changes via Read / Grep / Bash (e.g., `git diff`) before reporting a phase complete.
5. **6 KB prompt size guard.** If a handoff prompt exceeds ~6 KB (research output, large PRDs, epic lists), write the artifact to `_arcwright-output/...` and pass the path instead.
6. **model selection is fixed.** Opus for orchestrator and architect only. Sonnet for all executor roles. Haiku for trivial formatting only.
7. **permissionMode when needed.** Use `"acceptEdits"` for autonomous Dev spawns inside a track's per-epic loop (regardless of isolation mode). Use `"plan"` for high-stakes review steps. Omit for all other roles.
8. **No background spawns in tracks.** Track and team SKILL.md files should NOT use `run_in_background: true`. Use foreground parallel fan-out (JSON array) instead.
9. **Error handling.** On Agent failure: capture the error, retry once maximum. On second failure: escalate to user. Never silently continue with missing output.
10. **Sequential handoff pattern.** Each Agent call completes before the next begins (unless parallel fan-out). Capture output into `$STEP_N_OUTPUT`. Inject under `## Inputs` heading in next prompt.
