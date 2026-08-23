---
name: goal-backward-verify
description: "Use when you need to verify that a completed implementation actually achieves its stated goals — a goal-backward, 4-level integration check (file exists → real code → wired in → real data flows). Distinct from QA: this proves capabilities are genuinely delivered, not stubbed, mocked, or orphaned. Use as a post-implementation gate before sign-off."
allowed-tools: Read, Grep, Glob, Bash
---

# Goal-Backward Verification

Start from the **stated goals/capabilities**, not the code. For each goal, walk
forward through 4 levels of evidence. A goal only PASSES when it clears every
level it needs. This catches the failure mode where code "exists" but is a stub,
never imported, or fed hardcoded data.

## Iron Law

> **A capability is not delivered until real data flows through wired, substantive code.**
> File-exists is not done. Code-written is not done. Imported-but-mocked is not done.

## Inputs

1. The **goal list** — the spec's stated goals / acceptance capabilities. If none
   is provided, extract them from the task brief or spec file first.
2. The **implementation** — the changed files / PR / branch under verification.

## The 4 Levels

Run them in order per goal. Stop at the first FAIL and record it — the higher
levels are moot once a lower one fails.

| L | Name | Question | How to gather evidence |
|---|------|----------|------------------------|
| **L1** | **Exists** | Does the artifact (file/module/symbol) the goal needs actually exist? | `Glob`/`Bash ls`/`Grep` for the path or symbol. Cite `path`. |
| **L2** | **Substantive** | Is it real code, not a stub/TODO/placeholder/empty body/`throw NotImplemented`? | `Read` the artifact. Look for real logic, branches, error handling. Flag `// TODO`, `pass`, `return null`, `return []` placeholders, empty functions. Cite `path:line`. |
| **L3** | **Wired** | Is it imported / registered / routed / referenced by the rest of the system? | `Grep` for imports/usages of the symbol elsewhere. An orphan (defined, never called) FAILS L3. Cite the importing `path:line`. |
| **L4** | **Real data flows** | Does genuine runtime data move through it — not hardcoded literals, mocks, or fixtures left in the production path? | Trace the data source: is the input from a real request/DB/arg, or a hardcoded constant / mocked return / commented-out call? Run it if cheap (`Bash`). Cite the evidence. |

## Evidence discipline

Every level result MUST cite evidence:
- **PASS** → cite the proof (`path:line`, command output, import site).
- **FAIL** → cite what's missing or what betrays it (the stub line, the absent
  import, the hardcoded value).
- Never assert PASS without a citation. "Looks done" is not evidence.

## Procedure

1. **Enumerate goals.** Number each stated goal/capability G1, G2, …
2. **Per goal, run L1→L4.** Stop at first FAIL; mark remaining levels `—` (not reached).
3. **Verdict per goal:** PASS only if every required level passed.
4. **Overall verdict:** PASS only if every goal passed. Otherwise FAIL with the blocking goals listed.
5. **Emit the report** (below). Keep it terse.

## Output — VERIFICATION report (terse)

> **REQUIRED PRE-OUTPUT:** If this skill instructs an agent to WRITE the report to
> a file, invoke `caveman` first (concise-output discipline). Inline returns need no file.

```
VERIFICATION — <target>
Overall: PASS | FAIL (blocking: G2, G5)

G1 <goal> ............ PASS
  L1 exists      ✓ src/foo.ts
  L2 substantive ✓ foo.ts:12-48 real parse logic
  L3 wired       ✓ imported app.ts:9
  L4 real data   ✓ reads req.body, traced app.ts:30

G2 <goal> ............ FAIL @L4
  L1 ✓ src/bar.ts  L2 ✓ bar.ts:5  L3 ✓ index.ts:4
  L4 ✗ returns hardcoded MOCK_USER (bar.ts:22) — no DB call
```

Use `✓`/`✗`/`—`. One line of evidence per level. No prose padding.

## Scope notes

- This is **goal-backward integration verification**, NOT functional QA. It does
  not drive a browser or assert UX (that's `arcwright-qa` / Playwright). It proves
  the wiring and data path are real.
- Use it as a **post-implementation gate**: run after dev completes, before review
  sign-off. A FAIL routes back to dev (or to `correct-course` if the goal itself shifted).
- For ambiguous goals, verify the most literal reading and note the ambiguity — do
  not silently relax the goal.
