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
| `SessionStart` | session begins / resumes | no | load `project-context`, planning STATE, constitution version |
| `UserPromptSubmit` | user sends a prompt | yes (deny) | inject context, gate on constitution |
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
- **Pyright on Python edits** → same for `*.py` via `pyright --outputjson`.
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
- **Flush STATE on PreCompact** → write planning `STATE.md` (`project-memory`) before
  compaction so `next_action` is never lost.
- **Decision-log on SubagentStop** → when a review/verifier subagent returns, append its
  verdict to `DECISIONS.md` (D-NN).

### 4. Orchestration (SubagentStop) — enforce our review model
- **Verifier sign-off** → after a dev subagent finishes an implementation task, the
  orchestrator's `SubagentStop` data feeds the `goal-backward-verify` gate before sign-off
  (mirrors the `review-orchestrator` flow, made deterministic).
- **Registry update** → mark the Session Agent Registry row `closed` automatically.

### 5. Context loading (SessionStart) — start every session grounded
- **Load project context** → run `project-context` scan; surface STATE + constitution
  version. This is the single most useful hook for our workflows.
- **Constitution check** → if `CONSTITUTION.md` exists, note its version so agents honor it.

### 6. Constitution enforcement (UserPromptSubmit) — optional, strict teams
- Gate implementation prompts against `CONSTITUTION.md` non-negotiables; deny + explain when
  a request violates a standing principle (e.g. "skip tests"). Off by default — opt-in.

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

## Integration map — hooks ↔ Arcwright

| Hook | Skill/agent it makes deterministic |
|------|------------------------------------|
| PostToolUse typecheck | `lsp-diagnostics`, `typescript-best-practices`, `python-backend` |
| PreToolUse secret-scan | `security-review`, `security-best-practices` |
| Stop handoff | `session-handoff`, `project-memory` |
| PreCompact flush | `project-memory` (STATE.md) |
| SubagentStop verify | `goal-backward-verify`, `review-orchestrator` |
| SessionStart context | `project-context`, `constitution` |
| UserPromptSubmit gate | `constitution` |

## Seeding hooks with the installer

The installer **prompts** for a hooks mode during interactive setup (alongside the gitignore
choice). You can also set it non-interactively with the `--hooks <none|safe|full>` flag, which
skips the prompt (`--yes` defaults to `none`):

```bash
npx @arcwright-ai/agent-orchestration --hooks safe   # guards + SessionStart context
npx @arcwright-ai/agent-orchestration --hooks full   # + tsc/pyright typecheck on edits
```

- **safe** — PreToolUse(Bash) destructive-command guard, PreToolUse(Write|Edit) secret/key-file
  guard, and a SessionStart context reminder.
- **full** — `safe` plus a PostToolUse(Write|Edit) typecheck (`tsc --noEmit` / `pyright`).

Guard scripts are copied to `.claude/arcwright-hooks/` (`guard-bash.js`, `guard-write.js`,
`typecheck.js`). The merge into `.claude/settings.json` is **idempotent** — Arcwright entries
are tagged and replaced in place, so re-running never duplicates and your own hooks are left
untouched. The chosen mode is recorded in the manifest and restored on `--yes` updates.

Project installs reference the scripts via `$CLAUDE_PROJECT_DIR` (portable across machines);
global installs use the absolute `~/.claude/arcwright-hooks/` path. To remove them, run with
`--hooks none` and delete the `.claude/arcwright-hooks/` directory, or edit `settings.json`.
