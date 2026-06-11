---
name: session-handoff
description: >
  Use when deliberately ending a session and handing off to a fresh agent or worktree —
  compresses the current session into a structured continuation artifact. Triggers on
  "/handoff", "write a handoff", "hand this off", or before closing a long session.
allowed-tools: Read, Write, Bash, Glob
---

# Session Handoff — Continuation Artifact Generator

Compress current session into a terse, load-bearing handoff doc.
A fresh agent reading the handoff must be able to resume without the transcript.

**Pre-output discipline:** invoke `caveman` skill (`.agents/skills/caveman/SKILL.md`) before writing. Default level **full**.

---

## Output Location

```
_arcwright-output/handoffs/handoff-{YYYY-MM-DD}.md
```

If a handoff for today already exists, append `-2`, `-3`, etc. Never overwrite.

---

## Handoff Document Structure

```markdown
# Handoff — {YYYY-MM-DD}

## Goal
<One sentence: what this session was trying to accomplish.>

## State
<Current completion status. What is done, what is partially done, what is blocked.>
DONE: …
IN PROGRESS: …
BLOCKED: … (reason)

## Files Changed
<List only files with meaningful edits — no auto-generated files.>
- `path/to/file` — what changed and why

## Decisions
<Binding choices made this session. Reference decision-log IDs (D-NN) if present.>
- D-01: <decision> — <reason>

## Open Items
<Numbered list of remaining tasks.>
1. <task> — <why it matters>

## Next Action
<Single concrete first step for the incoming agent. Be specific enough to act on immediately.>

## Context Refs
<Paths the incoming agent should read first.>
- `path/to/spec` — <why>
```

---

## Procedure

### 1. Gather session evidence

Run these reads before writing (adapt paths to the actual project):
- `git diff --name-only HEAD` — files changed this session
- `git log --oneline -10` — recent commits
- Check `_arcwright-output/planning/DECISIONS.md` for decision IDs if it exists
- Check any open spec or plan doc in `_arcwright-output/`

Do not ask the user to summarize — derive from evidence. Ask only if a critical piece of context is genuinely ambiguous.

### 2. Apply caveman discipline

Load `.agents/skills/caveman/SKILL.md`. Write at **full** level.
Every section must pass the load-bearing test: if removed, would the incoming agent make a different decision? If no — cut it.

### 3. Write the artifact

Write to `_arcwright-output/handoffs/handoff-{date}.md`.
Show the path after writing.

### 4. Print a 3-line summary

After writing, output:
```
HANDOFF WRITTEN: _arcwright-output/handoffs/handoff-{date}.md
NEXT ACTION: <the Next Action line from the doc>
CONTEXT: <the first Context Ref path>
```

---

## Constraints

- Goal section: one sentence, no hedging.
- Files Changed: paths only, no code blocks, one-line reason each.
- Decisions: only binding choices — not considerations or options considered.
- Open Items: ordered by priority (most urgent first).
- Next Action: must be immediately actionable without further clarification.
- NEVER include transcript excerpts, tool outputs, or verbose reasoning.
- If no files changed: write `Files Changed: none` — don't omit the section.
