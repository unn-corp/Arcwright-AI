# Arcwright Hooks Guide

Recommended Claude Code hooks for Arcwright workflows, and how they wire into our
skills/agents. Hooks run deterministically in the harness (not by the model), so they're
how you *enforce* behavior that a prompt can only *request*.

Author hooks interactively with the `hookify` skill (`/hookify "<behavior>"`) — it maps a
natural-language behavior to the right event + matcher + command and safe-merges it into
`.claude/settings.json`. This guide is the curated catalog `hookify` draws from.

## Hook events (reference)

| Event | Fires | Can block? | Typical Arcwright use |
|-------|-------|-----------|------------------------|
| `SessionStart` | session begins / resumes | no | load `project-context` (CLAUDE.md / AGENTS.md) |
| `UserPromptSubmit` | user sends a prompt | yes (deny) | inject context |
| `PreToolUse` | before a tool runs | yes (deny) | guard secrets, block destructive git/fs, protect files |
| `PostToolUse` | after a tool succeeds | no | typecheck/lint changed files, run LSP diagnostics |
| `Stop` | main agent finishes a turn | no | session-handoff, session-report, LEARNINGS capture |
| `SubagentStop` | a spawned subagent finishes | no | verifier gate, registry update, decision-log append |
| `PreCompact` | before context compaction | no | flush planning STATE to disk so nothing is lost |
| `Notification` | permission/idle notifications | no | desktop ping on long runs |

Matchers filter by tool name (`Write|Edit`, `Bash`, etc.) or are omitted to match all.

## Recommended hooks for our workflows

### 1. Quality gates (PostToolUse) — catch errors at the source
- **Typecheck on TS edits** → after `Write|Edit` on `*.ts|*.tsx`, run our `lsp-diagnostics`
  path (`tsc --noEmit` scoped to changed files). Turns "looks right" into "compiles".
- **Pyright on Python edits** → same for `*.py`, run per-file in plain text (not
  `--outputjson`: the JSON envelope costs the model more context than the diagnostics).
- **DRY/format nudge** → after edits in `src/`, surface a one-line reminder to run `/dry`
  before merge (non-blocking).

### 2. Safety guards (PreToolUse) — deny dangerous actions
- **Secret-scan before write** → on `Write|Edit`, block if the content contains obvious
  credential patterns (API keys, `.env` secrets, private keys). Pairs with `security-review`.
- **Block destructive git/fs** → on `Bash`, deny `git push --force` to protected branches,
  `rm -rf` outside the project, and history rewrites unless explicitly confirmed.
- **Protect sensitive files** → on `Write|Edit`, deny edits to `.env`, key material, and the
  managed `# ─── Arcwright installation ───` gitignore block.

### 3. Memory & continuity (Stop / SubagentStop / PreCompact)
- **Auto-handoff on Stop** → when a long session ends, run `session-handoff` to write
  `_arcwright-output/handoffs/handoff-{date}.md` (via `caveman`). Survives context resets.

### 4. Orchestration (SubagentStop) — enforce our review model
- **Verifier sign-off** → after a dev subagent finishes an implementation task, the
  orchestrator's `SubagentStop` data feeds the `goal-backward-verify` gate before sign-off
  (mirrors the `review-orchestrator` flow, made deterministic).
- **Registry update** → mark the Session Agent Registry row `closed` automatically.

### 5. Context loading (SessionStart) — start every session grounded
- **Load project context** → run `project-context` scan (CLAUDE.md / AGENTS.md). This is the
  single most useful hook for our workflows.

## Example: `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "bash -c 'case \"$CLAUDE_FILE_PATHS\" in *.ts|*.tsx) npx tsc --noEmit 2>&1 | head -20;; esac'" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "arcwright-guard-bash" }
        ]
      }
    ],
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "echo 'Run project-context scan'" } ] }
    ]
  }
}
```

Use `/hookify` to generate the exact JSON for any of the above — it handles matcher syntax
and merges without clobbering existing hooks.

## Cost rules for any hook that shells out

A PostToolUse hook runs on **every single edit**, so its cost is paid hundreds of times
per session and its output is spent from the model's context budget. Four rules, each
learned from a gate in this repo that violated it:

1. **Never invoke a linter through `npx`.** Even `npx --no-install` boots npm on every
   call (measured here: ~930ms for eslint, ~230ms for prettier) *before* the tool starts.
   Resolve `node_modules/.bin/<tool>` by walking up from the edited file and spawn it
   directly.
2. **Only run project-local binaries.** `npx --no-install` silently falls back to a
   globally installed tool, which carries an unrelated version and no project config —
   so it reports findings that the project's real gate would never produce.
3. **Resolve the project from the edited file, not the process cwd.** Walk up to the
   nearest `eslint.config.*` / `tsconfig.json` / `pyproject.toml` and run there. In a
   monorepo with submodules and nested apps, the repo root is usually the wrong project.
   Skip the tool entirely when no config exists — no config means the project does not
   use that tool, and running it anyway is pure false signal.
4. **Bound every wait, and never spawn a process to sleep.** A poll loop needs a separate,
   short cap on "nothing has started yet" versus "still running" — otherwise a push to a
   branch that triggers no workflow blocks the turn for the full timeout. Use
   `Atomics.wait` on a `SharedArrayBuffer` for a synchronous sleep; spawning
   `node -e setTimeout(...)` costs a full interpreter boot per tick.

One more, specific to type-checking: a **solution-style** `tsconfig.json` (`"files": []`
plus `"references"`, the shape Vite scaffolds emit) has no inputs of its own, so plain
`tsc --noEmit` checks *nothing* and exits 0 in ~50ms. That reads as a passing gate while
catching zero errors. Detect that shape and use build mode (`tsc -b --noEmit`, TS >= 5.6).

## Integration map — hooks ↔ Arcwright

| Hook | Skill/agent it makes deterministic |
|------|------------------------------------|
| PostToolUse typecheck | `lsp-diagnostics`, `typescript-best-practices`, `python-backend` |
| PreToolUse secret-scan | `security-review`, `security-best-practices` |
| Stop handoff | `session-handoff` |
| SubagentStop verify | `goal-backward-verify`, `review-orchestrator` |
| SessionStart context | `project-context` |
| UserPromptSubmit DynamoDB/AWS data routing | `dynamodb-best-practices` |
| SessionStart/UserPromptSubmit/PostToolUse Amplify routing and advisory review | `amplify-best-practices` |
| SessionStart/UserPromptSubmit/PostToolUse CloudFront/CDN routing and advisory review | `cloudfront-best-practices` |
| SessionStart/UserPromptSubmit/PostToolUse S3/storage routing and advisory review | `s3-best-practices` |
| SessionStart/UserPromptSubmit/PostToolUse Aurora database routing and advisory review | `aurora-db-best-practices` |
| SessionStart/UserPromptSubmit/PostToolUse SES/SNS/SMTP messaging routing and advisory review | `ses-sns-smtp-best-practices` |
| SessionStart/UserPromptSubmit/PostToolUse EventBridge routing and advisory review | `eventbridge-best-practices` |
| SessionStart/UserPromptSubmit/PostToolUse Cognito/Auth routing and advisory review | `cognito-best-practices` |
| SessionStart/UserPromptSubmit/PostToolUse Lambda/runtime routing and advisory review | `lambda-best-practices` |
| SessionStart/UserPromptSubmit/PostToolUse Step Functions/workflow routing and advisory review | `step-functions-best-practices` |

## Seeding hooks with the installer

The installer **prompts** for an autonomy posture during interactive setup (alongside the
gitignore choice). The default is **safe (autonomous)** — `--yes` and non-interactive installs
get it automatically. Set it explicitly to skip the prompt:

```bash
npx @arcwright-ai/agent-orchestration --hooks safe   # autonomous + guards (default)
npx @arcwright-ai/agent-orchestration --hooks full   # + tsc/pyright typecheck on edits
npx @arcwright-ai/agent-orchestration --hooks none   # conservative: ask-first, no hooks
```

`safe` and `full` also seed read-only domain routers for DynamoDB, Amplify, CloudFront,
S3, Aurora, SES/SNS/SMTP, EventBridge, Cognito/Auth, Lambda, and Step Functions. They inject review guidance only when a prompt or repository matches
the domain; the adapters never contact AWS, read credentials, mutate resources, run
SQL, or block an edit. The post-edit adapters add concise advisory checks for
cache/security/data-protection/database risks after relevant `Write|Edit` operations.

- **safe (default, autonomous)** — sets `permissions.defaultMode: "acceptEdits"` so agents
  apply edits without stopping to ask, with PreToolUse(Bash) destructive-command guard,
  PreToolUse(Write|Edit) secret/key-file guard, and a SessionStart context reminder. The
  guards are what make auto-accept safe: edits flow, but `rm -rf /`, force-push to main, and
  secret writes are blocked, and ordinary bash still prompts (`acceptEdits` only auto-accepts
  file edits).
- **full (autonomous + typecheck)** — `safe` plus a PostToolUse(Write|Edit) typecheck
  (`tsc --noEmit` / `pyright`).
- **none (conservative)** — no Arcwright hooks; Claude Code's default ask-first permission
  mode. For users who want to approve each action.

The permission mode is only set if you haven't chosen your own — a user-set `defaultMode` is
never overwritten.

Guard scripts are copied to `.claude/arcwright-hooks/` (`guard-bash.js`, `guard-write.js`,
`typecheck.js`). The merge into `.claude/settings.json` is **idempotent** — Arcwright entries
are tagged and replaced in place, so re-running never duplicates and your own hooks are left
untouched. The chosen mode is recorded in the manifest and restored on `--yes` updates.

Project installs reference the scripts via `$CLAUDE_PROJECT_DIR` (portable across machines);
global installs use the absolute `~/.claude/arcwright-hooks/` path. To remove them, run with
`--hooks none` and delete the `.claude/arcwright-hooks/` directory, or edit `settings.json`.
