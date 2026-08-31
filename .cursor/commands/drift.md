# /drift, VibeDrift drift detection and prevention

Keep AI-written code consistent with the conventions a repo already settled on.
Run a drift scan over the project (audit / CI gate), or check a single proposed
function against the repo's dominant patterns and existing functions before it
lands. Drives the local `@vibedrift/cli` (MIT, runs on your machine, no MCP server
required).

## Instructions

1. Load `.agents/skills/drift/SKILL.md` for the full protocol (scan modes, the
   in-loop `tools` checks, how to read each result, and the core "deviation from
   the repo's own dominant pattern" principle). Follow it.

2. Confirm prerequisites: Node.js >= 20 with `npx`. Nothing to install , 
   `npx -y @vibedrift/cli` fetches on demand. Base checks are local and free; the
   optional `--deep` AI pass needs `vibedrift login` and degrades gracefully, so
   never block on it.

3. Pick the mode from `the user's command input` (default: scan the current directory):
   - **Scan / audit**, `npx -y @vibedrift/cli . --format json --local-only`. Add
     `--diff [ref]` to bound it to changed files, or `--fail-on-score <n>` for a
     CI gate. Report the Vibe Drift Score plus per-category findings (architectural
     inconsistency, hidden duplicates, convention drift, security gaps, dead code,
     complexity, half-finished implementations), each at its exact file and line.
   - **In-loop check**, pipe a function body on stdin to
     `npx -y @vibedrift/cli tools validate-change --root . --file <path>` (or
     `find-similar`, `check-file`, `dominant --dimension <d>`, `intent`). Act on
     the JSON: `validate-change` when `ok` is false (`conflicts[]` = drift,
     `duplicateOf[]` = reuse instead), `find-similar` when `found` is true.

4. If any check returns `status: "no_baseline"`, run a plain `npx -y
   @vibedrift/cli` scan once to build the cached baseline, then retry.

5. **Report only, do not bulk-auto-fix.** Group findings, then hand remediation
   to `/dry`, `/triage`, or the relevant specialist. Only flag genuine deviations
   from the repo's own dominant pattern, not generic lint issues.

## Arguments

`the user's command input`, optional. A path to scan, a mode hint (`scan` / `validate` /
`dominant <dimension>` / `init`), and/or extra flags (`--diff`, `--deep`,
`--fail-on-score <n>`). Empty = scan the current directory as a local-only audit.
