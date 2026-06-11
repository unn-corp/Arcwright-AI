# Session Handoff — Quick Rules

> Load full `SKILL.md` when writing a handoff artifact.

Compresses current session into a terse continuation artifact for a fresh agent or worktree.
**Always invoke `caveman` (full level) before writing.**

## Core Rules

- Output path: `_arcwright-output/handoffs/handoff-{YYYY-MM-DD}.md` — never overwrite existing; append `-2`, `-3`
- Derive content from evidence (git diff, commits, planning docs) — do not ask user to summarize
- Goal: one sentence only
- Files Changed: paths + one-line reason; no auto-generated files, no code blocks
- Decisions: binding choices only, reference D-NN IDs if decision-log exists
- Open Items: ordered by priority (most urgent first)
- Next Action: must be immediately actionable without clarification
- Context Refs: paths the incoming agent reads first — include the spec or plan if one exists
- Every line must pass the load-bearing test: "if removed, would the incoming agent decide differently?"

## Red Flags

- Writing transcript excerpts or tool outputs into the handoff
- Goal section longer than one sentence
- Decisions section includes "considered" options rather than binding choices
- Next Action is vague ("continue work on the feature")
- Missing `caveman` discipline → verbose prose
