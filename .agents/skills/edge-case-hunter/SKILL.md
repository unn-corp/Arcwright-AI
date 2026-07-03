---
name: edge-case-hunter
description: Exhaustive branch and boundary path tracer — mechanically walks every branching path and boundary condition in a diff, file, or function and reports ONLY the unhandled ones. Method-driven, not attitude-driven (orthogonal to security-review / dry / ux-audit). Use for "edge cases", "what did I miss", "boundary analysis", or as a lens in pr-review-panel / team-review.
allowed-tools: Read, Grep, Glob, Bash
version: 1.0.0
author: arcwright
tags: [review, edge-cases, boundaries, correctness, path-tracing]
---

# Edge Case Hunter

**Goal:** You are a pure path tracer. Do NOT comment on whether code is good or bad, well-styled, or well-named; only list missing handling. This is a different lens from `security-review` (threats), `dry`/`clean-code-standards` (structure), and `ux-audit` (interface). Here the method is exhaustive path enumeration: mechanically walk every branch, do not hunt by intuition.

When a diff is provided, scan only the diff hunks and list boundaries directly reachable from the changed lines that lack an explicit guard in the diff. When no diff is provided (full file or function), treat the entire provided content as the scope. Ignore the rest of the codebase unless the content explicitly references external functions.

Report ONLY paths and conditions that lack handling. Discard handled ones silently. Do not editorialize, add filler, or assign severity/priority labels.

## Inputs

- **content** — the diff, full file, or function under review (if not supplied, use the current working diff: `git diff` / `git diff --cached`)
- **also_consider** (optional) — extra areas to keep in mind alongside normal edge-case analysis

## Execution (in order)

### Step 1 — Receive content
Load the content strictly from the provided input (or the current diff). If it is empty or cannot be decoded as text, emit the empty-input finding (see Halt) and stop. Identify the content type (diff, full file, or function) to set scope.

### Step 2 — Exhaustive path analysis
Walk every branching path and boundary condition within scope, report only the unhandled ones:
- **Control flow:** conditionals, loops, error handlers, early returns.
- **Domain boundaries:** where values, states, or conditions transition. Derive the relevant edge classes from the content itself, do not rely on a fixed checklist. Examples: missing else/default, unguarded inputs, off-by-one loops, arithmetic overflow, implicit type coercion, race conditions, timeout gaps, empty/null collections.
- **Implicit branches:** when the change special-cases one or more members of a fixed set (enum, status code, sentinel, type tag, flag, value range), the rest of the set is an implicit branch. Example: the diff changes the `RED` and `YELLOW` cases of a `RED`/`YELLOW`/`GREEN` enum, so `GREEN` is an implicit branch that must be checked.
- For each path, determine whether the content handles it. Collect only the unhandled paths.

### Step 3 — Validate completeness
Revisit every edge class from Step 2 (missing else/default, null/empty inputs, off-by-one, overflow, coercion, races, timeouts). Add any newly found unhandled paths; drop any you confirm are handled.

### Step 4 — Deletion check (only if the diff removed or replaced meaningful code)
Ignore pure renames and whitespace. For each removed/replaced chunk, ask: did it carry behavior or a contract that the change neither re-established nor intentionally retired? Add a finding for any resulting regression, orphaned reference, or newly-dead code. Skip anything already covered above. Deletion findings add `kind: "deletion"` and a `confidence` of high/medium/low (these are inferences, rate them). For a deletion finding, the four fields read as: `location` = the removed item, `trigger_condition` = the behavior/contract it enforced, `guard_snippet` = where/how to re-establish it, `potential_consequence` = the regression or orphan.

### Step 5 — Present findings
Emit all findings as a single JSON array, exactly the Output Format below. No extra text, no markdown wrapping.

## Output format

```json
[{
  "location": "file:start-end (or file:line, or file:hunk when exact line unavailable)",
  "trigger_condition": "one-line description (max 15 words)",
  "guard_snippet": "minimal code sketch that closes the gap (single-line, escaped, no raw newlines)",
  "potential_consequence": "what could actually go wrong (max 15 words)"
}]
```

An empty array `[]` is valid when nothing is unhandled. Deletion findings go in the same array with the two extra fields.

## Halt conditions

- Empty or undecodable content: return
  `[{"location":"N/A","trigger_condition":"Input empty or undecodable","guard_snippet":"Provide valid content to review","potential_consequence":"Review skipped — no analysis performed"}]`
  and stop.

## See also

- `pr-review-panel` / `team-review` — run edge-case-hunter as one lens alongside correctness, security, and readability reviewers.
- `security-review`, `dry`, `ux-audit` — the other single-pass review lenses; each is attitude/domain driven, this one is method (path enumeration) driven.
