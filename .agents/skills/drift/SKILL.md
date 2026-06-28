---
name: drift
description: Catch codebase drift with VibeDrift, keep AI-written code consistent with a repo's own conventions and avoid re-implementing functions that already exist. Use when scanning a project for architectural inconsistency, hidden duplicates, convention drift, dead code, or security gaps; when gating CI on a drift score; or in the write loop to check a proposed function against the repo's dominant patterns BEFORE it lands. Drives the local @vibedrift/cli (no MCP server required). Triggers on "check drift", "is this consistent with the codebase", "find duplicate functions", "vibedrift", "drift score", or "/drift".
allowed-tools: Bash(*) Read Write Edit Glob Grep
---

# Skill: drift

Detect and prevent **drift**, the gap between the patterns a codebase started
with and the patterns new code keeps introducing. A fresh AI agent session has no
memory of the conventions a repo already settled on, so it makes reasonable-but-
different choices: one handler throws a typed error, the next returns a plain
object; eight services use a repository layer, the ninth reaches for raw SQL.
Everything compiles and passes review, yet the codebase slowly stops agreeing with
itself. Linters miss this because they check one file at a time; VibeDrift checks
the codebase **against itself**.

This skill drives [VibeDrift](https://github.com/VibeDrift/VibeDrift) (the
`@vibedrift/cli` npm package, MIT). It runs locally, sends no source code, and
needs no login for the base checks. **No MCP server is involved**, this skill
talks to the CLI directly via `npx`.

## When to use

- **Audit / CI gate**, score a whole project (or a diff) against its own
  conventions and optionally fail below a threshold.
- **In the write loop (prevention)**, before finalizing a new function, check it
  against the repo's dominant patterns and existing functions so it matches the
  first time instead of getting flagged in a later review.
- **Onboarding to an unfamiliar repo**, learn the declared rules and the majority
  patterns before writing anything.

Supported languages: JavaScript, TypeScript, Python, Go, Rust.

## Prerequisites

- Node.js >= 20 with `npx` available. Nothing to install, `npx -y @vibedrift/cli`
  fetches on demand. (Optional: `npm i -g @vibedrift/cli` for a persistent
  `vibedrift` binary.)
- Base checks are fully local and free. The optional `--deep` AI pass needs
  `vibedrift login`; it degrades gracefully when offline or signed out, so never
  block on it.
- First run in a repo builds a drift baseline (one-time, then cached). If any
  check reports `no_baseline`, run a plain `vibedrift` scan once, then retry.

## Mode A, Scan / audit a project

```bash
# Default: scan ./ and produce a report. For agent use, prefer json to stdout.
npx -y @vibedrift/cli . --format json --local-only

# Scan only what changed (fast pre-PR check)
npx -y @vibedrift/cli . --format json --diff           # vs HEAD
npx -y @vibedrift/cli . --format json --diff main      # vs a branch/ref

# CI gate: exit 1 when the Vibe Drift Score falls below the floor
npx -y @vibedrift/cli . --fail-on-score 70 --local-only
```

Useful flags: `--format <html|terminal|json|csv|docx>` (html is the interactive
default; use `json` when an agent parses the result), `--include`/`--exclude
<glob>` (repeatable file filters), `--local-only` (skip every network call),
`--deep` (cloud AI pass, requires login). Full list: `npx @vibedrift/cli --help`.

**Reading a scan:** the result rolls findings into a **Vibe Drift Score** (how
consistent the code is with itself, 0-100) plus per-category findings:
architectural inconsistency, hidden duplicates, convention drift (naming, imports,
error handling, async style, logging), security gaps, dead code, complexity, and
half-finished/placeholder implementations. Each finding points at the exact file
and line. Report findings; do not bulk-auto-fix, hand remediation to `/dry`,
`/triage`, or the relevant specialist.

## Mode B, In-loop prevention (per function)

Run these around the act of writing a function. They take the function body on
**stdin**, so multi-line source pipes cleanly. Use `printf '%s'` (not `echo`) to
avoid mangling the body:

```bash
# 1. Before writing, does the repo already have one like this? Reuse if so.
printf '%s' "$PROPOSED_BODY" | npx -y @vibedrift/cli tools find-similar --root .

# 2. After writing, before committing, would it drift or duplicate?
printf '%s' "$PROPOSED_BODY" | npx -y @vibedrift/cli tools validate-change \
  --root . --file src/handlers/order.ts

# 3. Learn a convention before you start (dimension: async, imports, exports,
#    naming, error_handling, data_access, logging, auth)
npx -y @vibedrift/cli tools dominant --root . --dimension async

# 4. Read the team's declared rules (CLAUDE.md / AGENTS.md / .cursorrules)
npx -y @vibedrift/cli tools intent --root .

# 5. Before editing an existing file, see where it already deviates
npx -y @vibedrift/cli tools check-file --root . --file src/handlers/order.ts
```

> If the installed `@vibedrift/cli` version does not expose a `tools`
> subcommand, fall back to a single full scan (Mode A) with `--diff` to bound the
> proposed change, or import the same engine in a tiny Node script:
> `import { validateChange, findSimilarFunction } from "@vibedrift/cli/tools"`
> (see `references/tools-api.md`). Same verdicts, no transport.

**Acting on the JSON result:**

- `validate-change`: act when `ok` is `false`. `conflicts[]` lists each dimension
  the change deviates on, with `dominantPattern` (what the repo does),
  `yourPattern` (what the change does), and a `fixHint`. `duplicateOf[]` lists
  existing functions it would clone, reuse one instead of writing a third copy.
- `find-similar`: act when `found` is `true`; `matches[]` are existing functions
  with file, name, line, and similarity.
- `check-file`: act when `fits` is `false`; `deviations[]` shows the departures.
- `status: "no_baseline"` → run a plain `vibedrift` scan once, then retry.
- If the result carries a `nudge`, relay its `message` to the user as a plain
  yes/no offer (an occasional deep-scan suggestion). Never block on it.

## Configure once (committable, optional)

```bash
npx -y @vibedrift/cli init                 # wizard: exclusions, CI floor, format
npx -y @vibedrift/cli ignore "**/fixtures/**"   # add a glob to .vibedriftignore
```

`init` writes `.vibedriftignore` (gitignore syntax) and `.vibedrift/config.json`.
Commit them so the whole team scans the same way. Use ignores for test fixtures,
generated code, and vendored files that are not really *yours*, excluded paths
stop counting toward the score.

## Core principle (do not violate)

Only flag **real deviations from the repo's own dominant pattern**. A file is not
wrong for using raw SQL; it is *drifting* when its siblings use a repository and it
does not. Drift always needs a baseline (a peer group) to deviate from. Do not turn
this into a generic linter, that is what ESLint, Semgrep, and CodeQL are for.

## Notes

- Privacy: base checks run on the machine and send no source, file contents, or
  paths. The deep AI pass sends function snippets only (never full files), in
  memory, not stored. `--local-only` disables all network calls including the
  telemetry beacon and update check.
- Upstream is MIT-licensed. This skill references the CLI rather than vendoring its
  code, see `SOURCES.md`. The deeper command/tool reference lives in
  `references/tools-api.md`.
