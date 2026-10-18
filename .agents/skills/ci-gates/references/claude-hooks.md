# Claude Code local-hook adapter

Use only for this host and authorized scope. Check the current [hook schema](https://code.claude.com/docs/en/hooks); command payloads arrive as JSON on stdin. Host event names and blocking codes are not portable to other runtimes.

# Skill: ci-gates

For a Claude Code host, use this conditional local-hook adapter: the **local** Claude Code
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
- `gate-ci-verify.js` — `PostToolUse(Bash)` on `git push`, **tiered**. After a
  push succeeds it polls GitHub Actions for that commit, waits for the workflow
  runs to finish, and reports the verdict to the model — exit 2 if any CI gate
  concluded failure (so the model fixes and re-pushes), exit 0 when all passed,
  still running, or unknowable (no `gh`/auth/remote → skips cleanly). Closes the
  loop: the local hooks mirror CI but can be bypassed, so this confirms the
  authoritative remote gate actually went green. Tunables: `ARCWRIGHT_CI_VERIFY=0`
  to disable, `ARCWRIGHT_CI_TIMEOUT_SECONDS` (default 180), `ARCWRIGHT_CI_POLL_SECONDS`
  (max backoff between polls, default 10), `ARCWRIGHT_CI_REGISTER_SECONDS`
  (default 30) — how long to wait for a run to *appear* before concluding this
  branch triggers no workflow. That second cap matters: without it, pushing a
  branch outside the workflow's `on: push` list blocks the turn for the full
  `ARCWRIGHT_CI_TIMEOUT_SECONDS` just to report that nothing ran.

**CI** (the real merge gate):
- `.github/workflows/ci.yml` — fast-fail jobs: static (format/lint/type-check),
  test (unit + project-configured coverage), python (optional), security (gitleaks + trivy
  + OSV-Scanner/OSV.dev), sast (semgrep), pr-title. OSV-Scanner matches the
  artifact's committed lockfiles against OSV.dev and fails on a known vuln; fix
  by bumping the dependency to the version it reports. See `tooling.md`.
- The security scanners run as **native release binaries** (not their GitHub
  Actions or `docker run -v`), and semgrep runs via **`docker cp`** into its
  image — both deliberate, so the gates work on self-hosted DinD runners where
  bind-mounts silently mount nothing. The template also carries a commented
  public-registry override for repos behind a private npm mirror. Full rationale:
  `self-hosted-runners.md` (the DinD trap) and `tooling.md`
  (CI runner realities: gitleaks license, `.gitleaks.toml`, semgrep noise).
- Config snippets for Vitest/Jest coverage thresholds and pytest `--cov-fail-under`.

See `gate-catalog.md` (the gate set + 3-layer model),
`tooling.md` (per-ecosystem commands), and
`branch-protection.md` (make the jobs required).

## Step 1 — Choose scope (global or project)

Ask the user (or honor what they already said):

- **Project** — hooks go in `./_arcwright/core/arcwright-hooks/`, wired into
  `./.claude/settings.json` with `$CLAUDE_PROJECT_DIR`-relative paths (portable,
  committed with the repo). CI + config files are written into the repo.
- **Global** — hooks go in `~/.arcwright/core/arcwright-hooks/`, wired into
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
DEST="<project-root>/_arcwright/core/arcwright-hooks" # use the authorized global Arcwright path only for global scope
mkdir -p "$DEST"
cp "$SKILL_DIR/templates/gate-lint.js" "$DEST/gate-lint.js"
cp "$SKILL_DIR/templates/gate-precommit.js" "$DEST/gate-precommit.js"
cp "$SKILL_DIR/templates/gate-ci-verify.js" "$DEST/gate-ci-verify.js"
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
          "command": "node \"$CLAUDE_PROJECT_DIR/_arcwright/core/arcwright-hooks/gate-lint.js\"" }] },
      { "matcher": "Bash",
        "hooks": [{ "type": "command",
          "command": "node \"$CLAUDE_PROJECT_DIR/_arcwright/core/arcwright-hooks/gate-ci-verify.js\"" }] }
    ],
    "PreToolUse": [
      { "matcher": "Bash",
        "hooks": [{ "type": "command",
          "command": "node \"$CLAUDE_PROJECT_DIR/_arcwright/core/arcwright-hooks/gate-precommit.js\"" }] }
    ]
  }
}
```

Global install: replace the command with `node "/home/<user>/.arcwright/core/arcwright-hooks/gate-lint.js"`
(absolute), same for `gate-precommit.js` and `gate-ci-verify.js`.

**Coexistence note:** the installer's `full` posture already adds a
`PostToolUse(Write|Edit)` typecheck entry, and `safe` adds a `PreToolUse(Bash)`
destructive guard and `PreToolUse(Write|Edit)` secret-file guard. Those are
separate entries (different command/script) and run alongside these — append, do
not replace them. `gate-precommit.js` (commit-time secret scan of the staged
diff) complements `guard-write.js` (blocks writing a secret file in the first
place); keep both.

