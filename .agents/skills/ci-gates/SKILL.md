---
name: ci-gates
description: Set up CI quality gates and the local hooks that mirror them. Installs tiered Claude Code hooks (advisory lint/format on every edit, blocking secret scan + advisory conventional-commit check at commit time) and scaffolds a fast-fail GitHub Actions workflow (format, lint, type-check, unit tests + 80/80/70 coverage, secret/dep/SAST security) plus branch-protection guidance. Node/TS (Vitest or Jest) + Python (Ruff/Pyright/pytest) + cross-ecosystem security. Installs globally or per-project. Use for "set up CI gates", "add quality gates", "wire pre-commit checks", "CI pipeline for this repo".
allowed-tools: Bash(*) Read Write Edit Glob Grep
---

# Skill: ci-gates

Stand up the standard quality-gate stack for a repo: the **local** Claude Code
hooks that catch problems as you edit/commit, and the **CI** workflow that is the
authoritative merge gate. The two stay in sync (a hook can be bypassed with
`--no-verify`, so CI must re-run every gate).

> Layers on top of the installer's `--hooks safe|full` posture additively. It
> does NOT touch `settings.json`'s existing Arcwright guard entries — it adds new
> ones carrying the same `arcwright-hooks` marker, so re-runs replace cleanly.

## What it installs

**Local hooks** (tiered enforcement — lint warns, secrets block):
- `gate-lint.js` — `PostToolUse(Write|Edit)`, **advisory**. Lints/format-checks
  the single changed file (ESLint + Prettier for JS/TS, Ruff for Python),
  surfaces findings to the model, never blocks. Fast (one file).
- `gate-precommit.js` — `PreToolUse(Bash)` on `git commit`, **tiered**. Blocks
  (exit 2) when a secret is staged (gitleaks, or a built-in high-confidence
  fallback); warns when the commit subject is not Conventional Commits.

**CI** (the real merge gate):
- `.github/workflows/ci.yml` — fast-fail jobs: static (format/lint/type-check),
  test (unit + 80/80/70 coverage), python (optional), security (gitleaks +
  trivy + semgrep), pr-title.
- Config snippets for Vitest/Jest coverage thresholds and pytest `--cov-fail-under`.

See `references/gate-catalog.md` (the gate set + 3-layer model),
`references/tooling.md` (per-ecosystem commands), and
`references/branch-protection.md` (make the jobs required).

## Step 1 — Choose scope (global or project)

Ask the user (or honor what they already said):

- **Project** — hooks go in `./.claude/arcwright-hooks/`, wired into
  `./.claude/settings.json` with `$CLAUDE_PROJECT_DIR`-relative paths (portable,
  committed with the repo). CI + config files are written into the repo.
- **Global** — hooks go in `~/.claude/arcwright-hooks/`, wired into
  `~/.claude/settings.json` with absolute paths (apply in every project). The
  CI workflow + coverage config are still per-repo, so for a global install ask
  whether to also scaffold `ci.yml` into the current repo or skip it.

Set `CLAUDE_DIR` accordingly: project → `./.claude`, global → `$HOME/.claude`.

## Step 2 — Detect the stack

```bash
ls package.json 2>/dev/null && grep -El '"(vitest|jest)"' package.json
ls pyproject.toml requirements.txt 2>/dev/null
ls .github/workflows/ 2>/dev/null
```

Pick the matching gates: Node/TS always if `package.json`; Vitest vs Jest from
deps; Python jobs only if `pyproject.toml`/`requirements.txt`. Security gates are
language-agnostic — always include.

## Step 3 — Install the hooks

```bash
# SKILL_DIR = the absolute path to THIS skill's directory. There is no $0 when a
# skill runs, so resolve it yourself: it's the ci-gates dir under whichever
# skills root applies (project ./.agents/skills/ci-gates or a global skills dir).
SKILL_DIR="<abs path to .agents/skills/ci-gates>"
DEST="$CLAUDE_DIR/arcwright-hooks"
mkdir -p "$DEST"
cp "$SKILL_DIR/templates/gate-lint.js" "$DEST/gate-lint.js"
cp "$SKILL_DIR/templates/gate-precommit.js" "$DEST/gate-precommit.js"
```

Then merge entries into `$CLAUDE_DIR/settings.json` (create if absent). Use the
**absolute** node path for a global install, the `$CLAUDE_PROJECT_DIR`-relative
path for a project install. Match the existing Arcwright merge style: identify
Arcwright entries by the `arcwright-hooks` substring in the command and replace
in place (never duplicate, never clobber user hooks).

Target shape (project install):

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Write|Edit",
        "hooks": [{ "type": "command",
          "command": "node \"$CLAUDE_PROJECT_DIR/.claude/arcwright-hooks/gate-lint.js\"" }] }
    ],
    "PreToolUse": [
      { "matcher": "Bash",
        "hooks": [{ "type": "command",
          "command": "node \"$CLAUDE_PROJECT_DIR/.claude/arcwright-hooks/gate-precommit.js\"" }] }
    ]
  }
}
```

Global install: replace the command with `node "/home/<user>/.claude/arcwright-hooks/gate-lint.js"`
(absolute), same for `gate-precommit.js`.

**Coexistence note:** the installer's `full` posture already adds a
`PostToolUse(Write|Edit)` typecheck entry, and `safe` adds a `PreToolUse(Bash)`
destructive guard and `PreToolUse(Write|Edit)` secret-file guard. Those are
separate entries (different command/script) and run alongside these — append, do
not replace them. `gate-precommit.js` (commit-time secret scan of the staged
diff) complements `guard-write.js` (blocks writing a secret file in the first
place); keep both.

## Step 4 — Scaffold CI (skip on global-only if the user declined)

```bash
mkdir -p .github/workflows
cp "$SKILL_DIR/templates/ci.yml" .github/workflows/ci.yml
```

Trim jobs to the detected stack (drop `python` if no Python; pick the Vitest or
Jest line in `test-node`). Add the coverage threshold to the project's test
config per `references/tooling.md` (Vitest `coverage.thresholds`, Jest
`coverageThreshold`, or pytest `--cov-fail-under=80` — all 80/80/70).

**Runners (self-hosted-first):** the template targets **self-hosted** runners by
default (`runs-on: [self-hosted, linux, x64]`), no GitHub-hosted fallback — a job
queues until a matching runner is online. Pin to a fleet by adding a custom org
label (e.g. `unn` for the unn-corp mothership runners → `[self-hosted, linux,
x64, unn]`). All jobs share one `runs-on`; change it once. To use GitHub-hosted
instead, set `runs-on: ubuntu-latest`. Full guidance + the unn-corp fleet (org
runners `ci-runner-runner-{1,2,3}` on the mothership VPS) and a "queued forever"
checklist: `references/self-hosted-runners.md`.

**Monorepo:** the template's `npm ci` assumes a root `package-lock.json`. If the
lockfile lives in a subdir (e.g. `website/`), set the job's `working-directory`
and `cache-dependency-path` to that subdir, or `npm ci` fails with "can only
install with an existing package-lock.json". See this repo's own
`.github/workflows/ci.yml` for a worked monorepo example.

**gitleaks license:** `gitleaks-action@v2` runs free on public repos but needs a
`GITLEAKS_LICENSE` repo secret on **private** repos, or the `security` job errors
at startup. To publish findings to the Security tab, give the job
`permissions: security-events: write` (the workflow default `contents: read`
silently skips the SARIF upload). `semgrep` `config: auto` uses OSS rules only
unless a `SEMGREP_APP_TOKEN` is set; `trivy-action` is version-pinned — bump it
periodically.

## Step 5 — Make the gates required (optional, asks first)

Walk the user through `references/branch-protection.md` to promote the CI jobs to
required status checks. This is a remote, outward-facing change — confirm before
running any `gh api` write.

## Step 6 — Report

State: scope (global/project), which hooks were wired and where, which CI jobs
were scaffolded vs trimmed, the coverage config touched, and the branch-
protection step (done or left to the user). Remind: local hooks take effect next
session; CI runs on the next push/PR; required checks need step 5.

## Kiro note

Kiro hooks live inside agent JSON, not `settings.json`. For Kiro, install the two
gate scripts the same way but register them in the relevant agent's `hooks`
block (PreToolUse/PostToolUse with the `execute_bash`/`fs_write` tool names).
The `ci.yml` + branch-protection guidance is IDE-agnostic.
