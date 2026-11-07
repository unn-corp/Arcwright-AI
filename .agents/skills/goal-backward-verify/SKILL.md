---
name: goal-backward-verify
description: "Verify that an implementation achieves its acceptance criteria through real code, integration wiring, and observable data flow."
allowed-tools: Read, Grep, Glob, Bash
---

# Goal-Backward Verification

Start from stated goals. Verify existence, substance, application wiring and real
data flow in order. Code presence alone does not establish delivery.

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
4. **Overall verdict:** PASS only if every goal passed. Otherwise report FAIL or INCOMPLETE with the blocking goals listed.
5. **Emit the report** (below). Keep it terse.

## Output — VERIFICATION report (terse)

Persist the required verification evidence when the task or workflow requires a report.
Writing a report does not select a writing mode. Load Caveman only when the user
explicitly selects that mode or requests artifact compression; preserve all evidence,
conditions and the required report format. If writing guidance is unavailable, record
the limitation and still return or persist the complete readable report through the
supported evidence route.

```
VERIFICATION — <target>
Overall: PASS | FAIL | INCOMPLETE (list blockers)

G1 <goal>: PASS | FAIL | INCOMPLETE
  L1 exists: result + artifact citation
  L2 substantive: result + implementation citation
  L3 wired: result + import/registration citation
  L4 real data: result + runtime/data-source evidence
  Stop at the first failure; unavailable proof is INCOMPLETE.

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
