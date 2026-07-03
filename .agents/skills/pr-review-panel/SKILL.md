---
name: pr-review-panel
description: Parallel multi-lens PR reviewer — fan-out N reviewers (correctness, security, performance, tests, API/contract, readability), each with a 0-100 confidence score and severity, then aggregate + dedup into a ranked report + overall verdict. Use when reviewing a diff, PR, or set of changed files before merge.
allowed-tools: Read, Grep, Glob, Bash, Agent, SendMessage
---

# PR Review Panel Skill

Fan-out parallel code review across 6 lenses. Aggregate findings by confidence. Produce a ranked report + merge verdict.

---

## 1. Composition with review-orchestrator

`pr-review-panel` is the **PR-level gate**. `review-orchestrator` runs the tri-layer AR cycle (Blind → Edge → Acceptance) for architectural depth. They compose:

```
/pr-review
  └─ pr-review-panel (this skill) — 6 lenses, confidence scoring, ranked report
       └─ [optional] review-orchestrator RO-FULL — deep AR cycle on flagged files
```

Call `review-orchestrator` only when panel finds Critical/High findings and the user wants a full AR cycle. Pass `review_type: concurrent` for parallelism.

---

## 2. Determine Scope

```bash
# Default: files changed in this branch vs main
git diff --name-only main...HEAD

# If $ARGUMENTS is a PR URL or number, fetch diff:
gh pr diff <number>

# If $ARGUMENTS is a file list, use those directly.
```

Attach the diff (not whole files) to each reviewer prompt to keep tokens low. If a reviewer needs more context for a specific finding, it reads that file directly.

---

## 3. Reviewer Lenses

Spawn all 6 in **one assistant message** (parallel Agent tool calls). Each is a disposable sub-agent — do NOT reuse via SendMessage.

| ID | Lens | Focus |
|----|------|-------|
| R1 | Correctness | Logic bugs, null/undefined, off-by-one, race conditions, data corruption |
| R2 | Security | OWASP Top 10, injection, auth, secrets, trust boundaries — follow `security-review` skill rules |
| R3 | Performance | N+1 queries, unbounded loops, memory leaks, missing indexes, blocking I/O |
| R4 | Tests/Coverage | Missing tests for changed paths, broken assertions, mocked-too-much, edge cases |
| R5 | API/Contract | Breaking changes, schema drift, backward compat, versioning, error shapes |
| R6 | Readability | Naming, complexity, dead code, missing docs on public interfaces |

### Reviewer Prompt Template

```
You are a focused code reviewer. Lens: <LENS_NAME> only — do NOT report findings outside your lens.

Diff:
<diff content>

Rules:
- Report only findings you are ≥60% confident in.
- Assign each finding a confidence score 0-100 and severity: Critical / High / Medium / Low.
- Findings below 60 confidence: omit entirely.
- Max 10 findings per lens.
- If your first pass finds zero findings, treat that as suspicious rather than a clean result: re-analyze the diff once, specifically looking for what's missing (not just what's wrong), before returning empty.
- Format each finding as:
  FINDING: <R1-001 style ID using your lens prefix>
  FILE: path:line
  SEVERITY: Critical|High|Medium|Low
  CONFIDENCE: 0-100
  TITLE: one-line summary
  DETAIL: ≤3 sentences. What is wrong, what breaks, suggested fix.
- End with: LENS_DONE
```

---

## 4. Aggregation Rules

Collect all 6 reviewer outputs. Aggregator runs **serially** after all lenses complete.

### 4.1 Confidence Threshold

Default threshold: **70**. Configurable via `$ARGUMENTS` as `--threshold N`.

Discard any finding with confidence < threshold.

### 4.2 Deduplication

Two findings are duplicates when:
- Same file + same line range (±5 lines), AND
- Same root issue (semantic match, not string match)

Keep the finding with the higher confidence score. If equal confidence, keep higher severity.

### 4.3 Ranking

Sort surviving findings:

1. Severity order: Critical → High → Medium → Low
2. Within same severity: descending confidence
3. Within same severity + confidence: ascending file path (stable)

### 4.4 Overall Verdict

| Condition | Verdict |
|-----------|---------|
| Any Critical finding | BLOCK — do not merge |
| ≥2 High findings | BLOCK — address before merge |
| 1 High OR ≥3 Medium | REVISE — fix or document acceptance |
| Low/Medium only | APPROVE WITH NOTES |
| Zero findings | APPROVE |

---

## 5. Output Format

```markdown
## PR Review Panel — <branch or PR title>

**Verdict: <BLOCK | REVISE | APPROVE WITH NOTES | APPROVE>**
Confidence threshold: 70 | Lenses: 6 | Raw findings: N → after dedup/filter: M

---

### Findings

#### [R2-001] Hardcoded API key in env loader (Critical, confidence 95)
- **File:** `src/config/env.ts:42`
- **Lens:** Security
- **Detail:** `API_KEY = "sk-prod-..."` is committed. Rotate the key. Use `process.env.API_KEY` instead.

#### [R1-002] Off-by-one in pagination slice (High, confidence 82)
...

---

### Needs AR Cycle
> These findings touch architecture or contracts. Consider running review-orchestrator RO-FULL:
> - [R5-003] Breaking change in UserResponse schema

### Skipped (below threshold or deduped)
N findings omitted. Use --threshold 50 to see more.
```

---

## 6. Wave Planning (subagent-protocol rules)

- **Wave 1:** All 6 lens agents in parallel (one assistant message, 6 Agent calls).
- **Wave 2:** Aggregator (serial, no Agent tool — aggregator is the orchestrator itself).
- **Wave 3 (optional):** If findings warrant, spawn `arcwright-review-orchestrator` via Agent tool with `review_type: concurrent`.
- Max parallel agents: 6 (one per lens). Never exceed 8 Agent calls in one message.
- Sonnet for all lenses. Escalate to Opus for Wave 3 AR only with user permission.

---

## 7. Arguments

`$ARGUMENTS` accepts:
- A PR number or URL (uses `gh pr diff`)
- File paths or globs
- `--threshold N` — override confidence filter (default 70)
- `--lens r1,r3` — run only specific lenses
- `--ar` — auto-trigger review-orchestrator RO-FULL if BLOCK verdict
