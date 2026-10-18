---
name: edge-case-hunter
description: "Inspect scoped code for substantive boundary, state, and error-path defects. Use for an edge-case audit rather than routine cosmetic review."
allowed-tools: Read, Grep, Glob, Bash
metadata:
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
- **claims_file** (optional) — the author's behavior, preservation, or parity claims. Keep it unread until independent tracing and the deletion check finish.

## Execution (in order)

### Step 1 — Receive content
Load the content strictly from the provided input (or the current diff). If it is empty or cannot be decoded as text, emit the empty-input finding (see Halt) and stop. Identify the content type (diff, full file, or function) to set scope.

### Step 2 — Exhaustive path analysis
Walk every branching path and boundary condition within scope, report only the unhandled ones:
- **Control flow:** conditionals, loops, error handlers, early returns.
- **Domain boundaries:** where values, states, or conditions transition. Derive the relevant edge classes from the content itself, do not rely on a fixed checklist. Examples: missing else/default, unguarded inputs, off-by-one loops, arithmetic overflow, implicit type coercion, race conditions, timeout gaps, empty/null collections.
- **Implicit branches:** when the change special-cases one or more members of a fixed set (enum, status code, sentinel, type tag, flag, value range), the rest of the set is an implicit branch. Example: the diff changes the `RED` and `YELLOW` cases of a `RED`/`YELLOW`/`GREEN` enum, so `GREEN` is an implicit branch that must be checked.
- **Handle lifetime:** when changed code rechecks a held handle/index/id/pointer, identify the intervening call that can invalidate it. Trace what is silently skipped when the recheck fails.
- **Changed calls:** for added or changed call sites in production and tests, read the actual callee declaration and check argument count, order, types, and defaults. Report actual mismatches, not plausible compatibility concerns.
- For each path, determine whether the content handles it. Collect only the unhandled paths.

### Step 3 — Validate completeness
Revisit every edge class from Step 2 (missing else/default, null/empty inputs, off-by-one, overflow, coercion, races, timeouts). Add any newly found unhandled paths; drop any you confirm are handled.

### Step 4 — Deletion check (only if the diff removed or replaced meaningful code)
Ignore pure renames and whitespace. For each removed/replaced chunk, ask: did it carry behavior or a contract that the change neither re-established nor intentionally retired? Add a finding for any resulting regression, orphaned reference, or newly-dead code. Skip anything already covered above. Deletion findings add `kind: "deletion"` and a `confidence` of high/medium/low (these are inferences, rate them). For a deletion finding, the four fields read as: `location` = the removed item, `trigger_condition` = the behavior/contract it enforced, `guard_snippet` = where/how to re-establish it, `potential_consequence` = the regression or orphan.

### Step 5 — Check author claims (only when claims_file was supplied)
Read the claims file for the first time now. Extract checkable behavior, preservation, ordering, arithmetic, and parity claims, then try to falsify each against the independently traced code. A narrative and a comment repeating it are testimony, not independent evidence. Read a referenced callee or compared implementation when it decides the claim. Verified or undecidable claims produce no finding; report only concrete contradictions.

Claim findings use the same four fields with `kind: "claim"` and high/medium/low confidence. Location is the contradicting code; Trigger names the claim; Guard states actual behavior/correction; Consequence names the harm to someone relying on the claim.

### Step 6 — Present findings
Emit a concise, human-readable Markdown report using the Output Format below. Do not
emit XML, JSON envelopes, tool-call payloads, or agent-internal markup. Do not wrap
the report in a code fence or add an introduction/conclusion.

## Output format

### Unhandled edge cases

1. **Location:** `file:start-end` (or `file:line` / `file:hunk` when exact lines are unavailable)
   **Trigger:** One-line description, maximum 15 words.
   **Guard:** `minimal code sketch that closes the gap`
   **Consequence:** What could actually go wrong, maximum 15 words.

For deletion or claim findings, add these two lines after **Location**:

   **Kind:** deletion | claim
   **Confidence:** high | medium | low

If nothing is unhandled, output exactly:

No unhandled edge cases found.

## Halt conditions

- Empty or undecodable content: return
  `Input empty or undecodable — provide valid content to review. Review skipped.`
  as a single readable line and stop.

## See also

- `pr-review-panel` / `team-review` — run edge-case-hunter as one lens alongside correctness, security, and readability reviewers.
- `security-review`, `dry`, `ux-audit` — the other single-pass review lenses; each is attitude/domain driven, this one is method (path enumeration) driven.

Updated from [BMAD v6.12.4 edge-case lens](https://github.com/bmad-code-org/BMAD-METHOD/blob/bab9082c3e884e0d72c759bcd1a6d90bcc01be84/src/core-skills/bmad-review/references/lens-edge-case-hunter.md), under the [upstream license](UPSTREAM-LICENSE). Arcwright retains Markdown output.
