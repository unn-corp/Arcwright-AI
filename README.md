# Arcwright

> AI-native agile workflow orchestration for Claude Code, Kiro, Cursor, and more coding agents.

Arcwright installs specialist agents, model-invocable skills, and workflows into projects across supported coding hosts. The orchestrator routes work through spec, research, UX, implementation, review, and QA using the available native or Arcwright Code task tools. Herdr pane visibility is opt-in.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Packages](#packages)
- [Slash Commands](#slash-commands)
  - [Agent Teams (`/team`)](#agent-teams-team)
  - [Utility Commands](#utility-commands)
- [Specialist Agents](#specialist-agents)
- [Agent Teams Catalog](#agent-teams-catalog)
- [Supported IDEs](#supported-ides)
- [Herdr Setup](#herdr-setup)
- [Migrating from bmad](#migrating-from-bmad)
- [Building from Source](#building-from-source)
- [License](#license)

---

## Quick Start

```bash
npx @arcwright-ai/agent-orchestration
```

During install you'll be asked **how autonomous Arcwright agents should run**. The default is
**Autonomous (recommended)** — agents apply edits without stopping to ask, while safety hooks
block the dangerous stuff. Pick **Conservative** if you'd rather approve each action. See
[Autonomy & Safety](#autonomy--safety) below.

Then use a slash command to kick off a workflow:

```
/triage "your task description"
```

---

## Autonomy & Safety

Arcwright is **autonomous by default, with guardrails**. On install (and with `--yes`) it sets
up the `safe` posture in `.claude/settings.json`:

- **Auto-accept edits** — `permissions.defaultMode: "acceptEdits"`, so agents apply file edits
  without a prompt on every write. Plain bash still prompts (`acceptEdits` only covers edits).
- **Destructive-command guard** (PreToolUse Bash) — blocks force-push to `main`, `rm -rf /`,
  fork bombs, raw-disk writes, etc. *before* they run.
- **Secret/key-file guard** (PreToolUse Write/Edit) — blocks writing AWS/GitHub/Slack tokens or
  private keys, and edits to `.env`/`.pem`.
- **SessionStart context** — points to the project's AGENTS.md; loads project-context only for missing task context.

The guards are what make auto-accept safe to leave on. Three postures:

| `--hooks` | Posture | What you get |
|-----------|---------|--------------|
| `safe` *(default)* | Autonomous | acceptEdits + the guards + SessionStart context |
| `full` | Autonomous + typecheck | `safe` + `tsc`/`pyright` on every edit (slower, tighter) |
| `none` | Conservative | No hooks; Claude Code's ask-first default — approve each action |

Guard scripts are dependency-free Node and land in `.claude/arcwright-hooks/`. The merge into
`settings.json` is idempotent and never overwrites a permission mode you've set yourself. Full
catalog and recipes: [`docs/hooks-guide.md`](docs/hooks-guide.md).

---

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| `@arcwright-ai/agent-orchestration` | Agents, skills, workflows, IDE configs, slash commands | `npx @arcwright-ai/agent-orchestration` |

Arcwright ships a `herdr` skill and managed defaults for [Herdr](https://herdr.dev), a terminal workspace manager built for AI coding agents. You install Herdr itself; Arcwright configures it when detected. See [Herdr Setup](#herdr-setup) below.

---

## Slash Commands

Arcwright ships native slash commands for Claude Code, Kiro, and Cursor. Cursor commands install to `.cursor/commands/`; Claude Code commands install to `.claude/commands/`.

Use **`/triage <task description>`** to select an approach from the installed
capabilities: direct work, authorized specialists, a team preset, or a bounded
review/goal workflow. A supplied task runs directly; use routing-only mode when
you want a recommendation. Host-specific runtimes such as `ultracode` are optional
and apply only where available. See [triage](.agents/skills/triage/SKILL.md).

### Agent Teams (`/team`)

Use `/team arch-dev` to select a preset directly; `/team` without a selection offers the 17-team picker.

Teams use the shared [subagent protocol](.agents/skills/subagent-protocol/SKILL.md). Inherit the user's provider/model choices, discover live capabilities, and use compatible native tasks or Arcwright Code delegation. Reuse native specialists only where supported; every Arcwright Code review round is a fresh delegated task.

**Herdr pane visibility is opt-in.** When the user asks to watch agents and Herdr is available, load the `herdr` skill's viewing guidance. The shared subagent protocol still owns delegation.

Use `/triage <task>` when the task needs help selecting a team or execution approach.

See the full team catalog below.

### Utility Commands

| Command | Purpose |
|---------|---------|
| `/triage` | Select an installed execution approach and run a supplied task, or return a recommendation in routing-only mode. |
| `/herdr` | Loads the Herdr terminal-workspace reference (sessions, workspaces, tabs, panes, agent spawning, wait-on-status) for the [Herdr](https://herdr.dev) terminal manager. Herdr panes are a *viewing surface* for in-process orchestration, not the spawn mechanism. |
| `/gsudo` | Loads the gsudo skill and runs a command with Windows elevated privileges. Works from WSL2, Git Bash, or native Windows. Takes `$ARGUMENTS` for the command to run. |
| `/arcwright-migrate` | Migrates an existing bmad installation to arcwright naming. Runs a dry-run first, then applies the rename. See [Migrating from bmad](#migrating-from-bmad). |

**Workflow & quality commands** (added from the current Claude Code ecosystem):

| Command | Purpose |
|---------|---------|
| `/hookify` | Describe a behavior in plain language → a correct, safely-merged hook in `settings.json`. |
| `/handoff` | Compress the session into a continuation artifact for a fresh agent or worktree. |
| `/grill` | Adversarial pre-implementation design interrogation — locks the design before any code. |
| `/tasks` | Decompose an epic/SPEC into task files with a dependency graph + conflict-free wave execution; optional GitHub Issues sync. |
| `/pr-review` | Parallel 6-lens PR review with 0–100 confidence scoring and a ranked merge verdict. |
| `/review-loop` | Ask which model to use, then find, fix, verify, and re-review substantive issues in bounded rounds. `/sol-loop` remains a compatibility alias. |
| `/full-send` | Explicitly authorize implementation, verification, review, and a protected PR merge through Arcwright Code/T3 Code. |
| `/full-stop` | Complete the same delivery checks, then leave an open PR ready for your merge. Never merges or enables automatic merging. |
| `/code-graph` | Local symbol-dependency graph — query change blast radius without loading whole files. |
| `/lsp` | Validate edits against `tsc`/`pyright` in a fix loop. |
| `/commit`, `/commit-push-pr`, `/clean-gone` | Lightweight daily git trio (shows the message before committing). |
| `/agent-instructions` | Audit or maintain shared AGENTS.md rules and required host imports. `/claude-md` remains a compatibility alias. |
| `/correct-course` | Structured mid-task course-correction when a constraint or blocker invalidates the plan. |
| `/caveman` | Concise-output mode — cut output tokens while keeping technical accuracy. |
| `/explain-mode` | Verbose teaching dial — explain the "why" or leave learning checkpoints. |

Review Loop uses the selected model through supported native or Arcwright Code/T3
Code delegation. Full Send and Full Stop retain Arcwright Code/T3 Code PR
registration, watching, and evidence operations. Codex invokes them as
`$review-loop`, `$full-send`, and `$full-stop`. The delivery skills require an
explicit request and use Review Loop for review and repair; an explicit reviewer
choice is reused for that run.
Their generated commits, PR content, comments, and handoffs contain no AI
attribution or model credits. They do not authorize the separate Unnamed
Development MCP.

---

## Specialist Agents

| Agent | Role |
|-------|------|
| Analyst | Requirements elicitation, business analysis |
| Architect | System design, technical decisions |
| Developer | Implementation |
| PM | Product management, PRDs |
| QA | Testing, validation, Playwright |
| Scrum Master | Sprint management, team coordination |
| Tech Writer | Documentation |
| UX Designer | Interface design, accessibility |
| Verifier | Goal-backward verification (exists → substantive → wired → real data flows) before sign-off |

Plus meta-agents for building new agents, workflows, and modules (Arcwright Builder).

---

## Agent Teams Catalog

17 pre-built team compositions. Use `/team <code>` or just `/team` for the picker.

Teams share the provider-neutral [delegation lifecycle](.agents/skills/subagent-protocol/SKILL.md), with role order, review gates, and budgets defined by each preset. Native reuse and fresh app-owned review tasks follow the host's actual capabilities. Herdr viewing remains opt-in.

Use `/triage <task>` when the task needs help selecting a team or execution approach.

### Development Teams

| Code | Name | Composition | When to Use |
|------|------|-------------|-------------|
| `arch-dev` | **The Foundry** | Architect + Dev | Architect designs approach, Dev implements, Architect spot-checks — for non-trivial features needing upfront design |
| `full-dev` | **The Engine Room** | Dev + QA + on-call Architect | Main dev loop with QA validation; Architect available for complex decisions |
| `dev-qa` | **Dev + QA Loop** | Dev + QA | Iterative: Dev implements, QA validates with playwright-cli, failures loop back to Dev |
| `tdd` | **The Forge** | QA + Dev | TDD: QA writes failing tests first, Dev implements to green, QA verifies |
| `solo-dev` | **Ghost** | Single quick-flow-solo-dev | Sequential task queue; dev signals completion each time |

### Review & Audit Teams

| Code | Name | Composition | When to Use |
|------|------|-------------|-------------|
| `review` | **Review + Fix Loop** | Architect + UX + Dev | Architect and UX review concurrently, batched findings go to Dev, loop until clean |
| `audit` | **The Crucible** | Architect + UX + Security | Full audit with three specialists running concurrently; Security has final sign-off |
| `sec-qa` | **The Vault** | Security + Dev + QA | Security finds vulnerabilities, Dev remediates, QA closes the exploit path, Security signs off |

### Planning & Research Teams

| Code | Name | Composition | When to Use |
|------|------|-------------|-------------|
| `blueprint` | **War Room** | PM + Analyst + Architect | Strategic planning before any build — PRDs, research, architecture |
| `research` | **Recon Pod** | Analyst + PM + Tech Writer | Analyst researches, PM synthesizes briefs, Tech Writer documents outputs |
| `ux-arch` | **The Blueprint Room** | UX + Architect | Design artifacts only — no implementation, no iterative loop |

### Specialist Teams

| Code | Name | Composition | When to Use |
|------|------|-------------|-------------|
| `sprint` | **The Strike Team** | SM + Dev + QA | SM manages sprint queue, Dev implements stories in sequence, QA validates each before SM marks done |
| `docs` | **The Library** | Tech Writer + Architect | Tech Writer drafts, Architect reviews for technical accuracy |
| `ux-qa` | **The Atelier** | UX Designer + QA | UX Designer implements (writes code), QA validates live UI with playwright-cli, loop until clean |
| `hotfix` | **Rapid Response** | Dev + Security | Emergency fix — max 4 files, isolated subsystem, Security reviews before merge |

### Solo Teams

| Code | Name | Composition | When to Use |
|------|------|-------------|-------------|
| `solo-arch` | **The Oracle** | Single Architect | Architecture analysis, design proposals, prototyping — with full dev skill access |
| `solo-qa` | **The Inquisitor** | Single QA | Regression runs, playwright-cli sessions, pass/fail reports |

---

## Supported IDEs

Claude Code, Kiro (IDE + CLI), Cursor (IDE + Agent CLI), Codex, Hermes, OpenCode, Grok (xAI CLI)

```bash
# Install for specific IDEs
npx @arcwright-ai/agent-orchestration --tools claude-code,kiro,cursor

# Global install (applies to all projects via ~/ config dirs)
npx @arcwright-ai/agent-orchestration --global
```

Cross-platform: Windows (WSL2), Linux, macOS.

WSL2 dual-home aware — terminal tools (Claude Code, Codex, Hermes, OpenCode) use the Linux home (`~`); GUI IDEs (Kiro) use the Windows home (`/mnt/c/Users/<name>`).

### Install Flags

| Flag | Default | What it does |
|------|---------|--------------|
| `--yes`, `-y` | false | Skip interactive prompts, accept all defaults |
| `--global`, `-g` | false | Install to `~/.arcwright` / `~/.claude/` / `~/.kiro/` |
| `--directory <path>`, `-d` | cwd | Target project root |
| `--tools <ids>` | `claude-code` | Comma-sep: `claude-code,kiro,cursor,codex,hermes,opencode,grok` |
| `--modules <ids>` | `awm,awb,core,_memory` | Which modules to install |
| `--user-name <name>` | prompted | Your name (written into config.yaml) |
| `--output-folder <path>` | `_arcwright-output` | Where Arcwright writes output artifacts |
| `--no-teams` | teams included | Skip the 17 team-* skills and `/team` command |
| `--docker-check` | not installed | Opt in to `/docker-check` and the `docker-type-check` skill |
| `--matt-pocock` | not installed | Install the optional Matt Pocock skill pack and `/matt-pocock` router; retained on update |
| `--no-matt-pocock` | omitted | Remove the optional pack on update, preserving modified files |
| `--model-surface` | false | Install/configure Hermes CLI as the primary model surface through OmniRoute `agent-fallback` (grouped Claude/Codex subscriptions + free fallback). Selects Hermes automatically and installs the Hermes CLI if missing. |
| `--omniroute-base-url <url>` | env or `http://omniroute:20128/v1` | OmniRoute OpenAI-compatible base URL for `--model-surface` |
| `--omniroute-api-key <key>` | env | OmniRoute gateway API key for `--model-surface`; prefer `ARCWRIGHT_OMNIROUTE_API_KEY` or `OMNIROUTE_API_KEY` |
| `--omniroute-model <id>` | `agent-fallback` | Hermes model id used by `--model-surface` |
| `--model-launchers` | false | Also install legacy Claude direct-provider launchers (`claude-glm`, `claude-minimax`, `claude-qwen`, `claude-sub`). Hermes + OmniRoute is the preferred path. |
| `--gitignore <mode>` | prompted | One of: `full`, `skills`, `output-only`, `none` (see gitignore section below) |
| `--channel <stable\|next>` | `stable` | Release channel to track. Recorded in the manifest; `next` opts into pre-release builds when available. |
| `--hooks <safe\|full\|none>` | prompted (`safe`) | Autonomy posture in `.claude/settings.json` (asked interactively; **`safe` with `--yes`**). `safe` = autonomous: auto-accept edits + destructive-command/secret guards + SessionStart context. `full` adds tsc/pyright typecheck on edits. `none` = conservative (ask-first, no hooks). Idempotent merge; scripts land in `.claude/arcwright-hooks/`. See [`docs/hooks-guide.md`](docs/hooks-guide.md). |

**TOML customization (3-layer overrides):** on install, `_arcwright/custom/` is scaffolded with a commented `example.toml`. Drop `<name>.toml` (team) and `<name>.user.toml` (personal) there to override shipped defaults. Resolution order **base < team < user**: scalars override; arrays with a `<key>__append = true` sibling accumulate; keyed arrays (`id`/`name`) match-and-patch. No files present = unchanged behavior. Gitignore your `*.user.toml`.

For Claude installations, the installer configures `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` for native teammate support. This is a host adapter setting; it does not select models or change another host's delegation protocol.

### Gitignore Options

When you install into a project (not `--global`), the installer asks how you want Arcwright files handled in git:

| Mode | What's committed | What's ignored |
|------|------------------|----------------|
| `output-only` | Everything Arcwright (config, skills, commands) | `_arcwright-output/` only — your work output (recommended) |
| `skills` | `_arcwright/`, commands, steering — everything except skills | `_arcwright-output/`, `.agents/skills/`, `.kiro/skills/` |
| `full` | Nothing Arcwright-related | `_arcwright/`, `.agents/skills/`, `.claude/agents/`, `.claude/commands/arcwright-*.md`, `.kiro/agents/`, `.kiro/skills/`, `.kiro/steering/arcwright-*.md`, `_arcwright-output/` |
| `none` | Everything | Nothing — commit it all, no `.gitignore` changes |

The installer **never** commits to git on your behalf. It only writes to `.gitignore` (appending or replacing a managed block, never overwriting unrelated entries). Use `--gitignore <mode>` for non-interactive installs.

Global installs skip gitignore logic entirely since they write to `~/` config dirs outside your project.

### Global Install & Updates

Global installs write to user-level config dirs instead of a project:

| Target | Linux / macOS | Windows (WSL2) |
|--------|---------------|----------------|
| Core modules | `~/.arcwright/` | `~/.arcwright/` (WSL Linux home) |
| Claude Code assets | `~/.claude/`; shared rules in `~/.arcwright/AGENTS.md` via import | same, WSL Linux home |
| Codex assets | `~/.codex/AGENTS.md`, `~/.agents/skills/` | same, WSL Linux home |
| Hermes assets | `~/.hermes/skills/`, `~/.hermes/skill-bundles/` | same, WSL Linux home |
| OpenCode assets | `~/.config/opencode/AGENTS.md`, `~/.agents/skills/`, `~/.config/opencode/commands/` | same, WSL Linux home |
| Grok assets | `~/.grok/AGENTS.md`, `~/.grok/skills/`, `~/.grok/commands/`, `~/.grok/agents/` | same, WSL Linux home |
| Kiro assets | `~/.kiro/` | `/mnt/c/Users/<name>/.kiro/` (Windows home) |
| Cursor assets | Project: `AGENTS.md`, `.cursor/rules/arcwright.mdc`, `.cursor/commands/` | same; global install stages `~/.cursor/arcwright-user-rules.md` for Cursor Settings → Rules → User Rules |

**Updating a global install:**

```bash
npx @arcwright-ai/agent-orchestration update --global
```

The updater reads the global manifest at `~/.arcwright/_config/manifest.yaml`, applies changes for new versions, removes orphaned files from prior versions, and preserves:
- User-created agent overlays at `~/.arcwright/overlays/customize-agents/`
- Your `config.yaml` (only version metadata is refreshed)

Global installs skip the project-level gitignore prompt. On `update --yes --global`, the installer restores your previous choices for `--tools`, `--teams`, and `--docker-check` from the manifest automatically — no need to re-pass flags.

**Switching between global and project installs:**

These are independent — installing globally does not replace a project-level install. Claude Code and Kiro merge global and project configs at runtime. If both exist, the project-level entries take precedence.

**Multiple Claude accounts on one machine:**

If you run several Claude Code accounts (e.g. Personal / Work / Alt, each with its own
`CLAUDE_CONFIG_DIR`), you can install Arcwright **once** and share it — plus your
conversation transcripts — across all of them via symlinks. Works the same on native
Linux/macOS and on WSL2 (the only Windows-specific part is the launcher, which becomes a
small shell function on Linux). Full walkthrough, launchers for both platforms, and
revert steps: [`docs/multi-account-setup.md`](docs/multi-account-setup.md).

**Hermes as the preferred global CLI agent:** for Codex global `AGENTS.md` bases or other
machine-wide coding-agent policy, use Hermes CLI as the default model surface when OmniRoute
is available. Enable it with `--model-surface`; Arcwright selects the Hermes integration,
installs the Hermes CLI package if `hermes` is missing, and configures the colon-less
`agent-fallback` model id when an OmniRoute gateway key is available. OmniRoute then groups
paid Claude/Codex subscription capacity with free-model fallback. Operational details are in
[`packages/agent-orchestration/docs/dev/model-launchers.md`](packages/agent-orchestration/docs/dev/model-launchers.md#preferred-global-cli-agent-hermes-through-omniroute).

---

## Herdr Setup

Arcwright ships a `herdr` skill and configures an existing [Herdr](https://herdr.dev) installation. Herdr remains a standalone app that you install from [herdr.dev](https://herdr.dev). Run the setup again at any time with:

```bash
arcwright herdr
```

The managed defaults install Claude and Codex integrations, the standard plugin set, MIME-aware `Ctrl+V` for text and images, native conversation restoration, `--yolo` for Codex, and `--dangerously-skip-permissions` for Claude. Claude sessions record their `CLAUDE_CONFIG_DIR`, so restored conversations return to the correct account when multiple profiles are used.

New panes and tabs use `terminal.new_cwd = "follow"`. Give each space its own root with `herdr workspace create --cwd /path/to/project`; descendants inherit that directory unless `--cwd` is supplied explicitly. Agents are grouped by space with `ui.agent_panel_sort = "spaces"`. Herdr 0.7.1 cannot hide agents belonging to inactive spaces.

**Herdr provides optional visibility.** Arcwright delegates through the host's native or app-owned task tools under [subagent-protocol](.agents/skills/subagent-protocol/SKILL.md). Use panes only when the user requests a visible workspace.

Use `/herdr` inside an agent conversation to load the command reference.

Loads the Herdr quick reference: pane splits/focus/resize, `herdr pane run`/`herdr pane read`, `herdr wait agent-status`/`herdr wait output`, named sessions (`herdr --session <name>`), workspaces, tabs, worktrees, and the plugin catalog.

**Spawning a visible agent (opt-in):**

```bash
herdr agent start <role> --split right -- \
  claude --dangerously-skip-permissions '<task>'

herdr wait agent-status <role> --status blocked --timeout 600000
herdr pane run <role> '<follow-up>'
herdr pane close <role>
```

The pane provides visibility; [subagent-protocol](.agents/skills/subagent-protocol/SKILL.md) still governs delegation. The [Herdr skill](.agents/skills/herdr/SKILL.md) retains the native command reference and migration mapping.

**Watching agents from your phone:** the `collie` Herdr plugin puts a phone PWA in front of your agent herd over Tailscale, so you can reply to a blocked agent from your phone keyboard. It's remote shell access to your machine by design and not installed by default — full install, security posture, and teardown steps are in [`docs/herdr-collie-tailscale-pwa.md`](docs/herdr-collie-tailscale-pwa.md).

---

## Migrating from bmad

If your project was set up with the old `bmad` framework (directories like `_bmad/`, `_bmad-output/`, `.claude/commands/bmad-*.md`), run the migration command:

```
/arcwright-migrate
```

Or via CLI:

```bash
npx @arcwright-ai/agent-orchestration migrate --dry-run   # preview
npx @arcwright-ai/agent-orchestration migrate             # apply
```

**What it renames:**

| Old | New |
|-----|-----|
| `_bmad/` | `_arcwright/` |
| `_bmad-output/` / `_bmad_output/` | `_arcwright-output/` |
| `bmm/` (module) | `awm/` |
| `bmb/` (module) | `awb/` |
| `bmb-creations/` | `awb-creations/` |
| `bmad-quick-flow/` (workflow) | `arcwright-quick-flow/` |
| `bmad-master` | `arcwright-master` |
| `BMAD Method` / `BMAD Builder` | `Arcwright Method` / `Arcwright Builder` |
| `BMM Module` / `BMB Module` | `AWM Module` / `AWB Module` |
| `@devo-bmad-custom/*` | `@arcwright-ai/*` |

The slash command guides the AI through a 7-step verification pass after the rename, catching anything the script missed in `.cursor/rules/`, `.gemini/commands/`, `CLAUDE.md`, and other IDE-specific files.

---

## Building from Source

```bash
node build/build.js

cd packages/agent-orchestration && npm publish --access public
```

The build pipeline:

1. **buildGenericPackage** — copies `_arcwright/{awb,awm,core,_memory}/` and `.agents/skills/` → `src/`
2. **buildKiroAssets** — generates Kiro steering docs; the installer adapts generic skills when it installs them
3. **bundleKiroAgents** and **bundleTrackCommands** — generate Kiro agents and package the curated Claude command set
4. **bundleSpecialistCommands** and **bundleSkillCommands** — generate specialist and per-skill command launchers
5. **verifySkillReferences** and **verifyNoLeaks** — validate skill links and scan for Squidhub content; the build fails on either problem

Source of truth lives in `_arcwright/` (modules). `packages/agent-orchestration/src/` is wiped and regenerated on every build — never edit it directly.

Workshop instructions live in [AGENTS.md](AGENTS.md). Root and nested workshop
`CLAUDE.md` imports are retired; do not recreate them. The shared file records the
retirement policy honored by the installer. See the [workshop guide](docs/workshop-guide.md#installer).

To manage Arcwright Code and skills across connected devices from this checkout,
run `npm run fleet:init`. Inventory, rollout records, artifacts, and recovery notes
stay in Git-ignored `.fleet/`; routine updates need no repository commits. See
[fleet setup and update standards](docs/fleet-management.md).

### Locally maintained Matt Pocock skills

Arcwright maintains local versions of 27 engineering and productivity skills adapted from [`mattpocock/skills`](https://github.com/mattpocock/skills), under `.agents/skills/matt-pocock*/`. These are ordinary editable source, with supporting resources, licenses, and provenance included. Builds and CI need no upstream checkout. The `matt-pocock-*` invocation names remain stable.

Enable the optional pack with `--matt-pocock` during installation or update. Use `/matt-pocock` to choose a skill, or `$matt-pocock` in Codex. Source checkouts already contain the skills and command wrappers. See [setup, skill catalog, and maintenance procedure](docs/matt-pocock-skills.md).

### Taste frontend skill

The default library includes [Taste v2](.agents/skills/design-taste-frontend/SKILL.md) from [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill). Use `$design-taste-frontend` in Codex or `/design-taste-frontend` in hosts with generated skill commands for landing pages, marketing sites, portfolios, and public product pages. It includes the direction libraries, imagery discovery, source checks, and a three-round visual critique loop, while preserving the project's `DESIGN.md` and preferring native Arcwright Code/T3 Code preview tools.

Working files and standalone browser profiles stay under the active project's `_arcwright/_memory/skill-runs/taste-<run>/`; host-managed screenshots use conversation evidence storage. The helpers enforce project output boundaries. Source checks and drawing need Node 18+; the optional standalone browser inspector needs Node 22+ and Chrome, Edge, or Chromium. See the [source, license, and adaptation notes](.agents/skills/design-taste-frontend/UPSTREAM.md).

### Context-efficient model invocation

Skills use short entrypoints and conditional topic guides. Agent profiles accept a supplied task directly and share one runtime contract; menus are optional navigation. Native skill catalogs supply discovery instead of an additional full catalog in always-loaded Kiro steering.

Models can select all installed skills, including the optional Matt Pocock pack. The portable [`arcwright` skill](.agents/skills/arcwright/SKILL.md) also resolves slash commands and specialist profiles for hosts without an equivalent native invocation surface. Its lookup returns a small set of matching installed routes. Optional packs remain opt-in, and invocation never grants extra authority for external actions.

Run `npm run audit:context` for measured entrypoint sizes and invocation blockers. The build rejects disabled model invocation and incomplete agent profiles. See the [cleanup report](docs/research/context-efficiency-2026-10-17.md) for scope, measured savings, validation, and limits.

---

## License

MIT

## Keeping imported skills current

The [upstream source record](docs/skill-sources.json) pins reviewed repositories and source files, licenses, local adaptations, and file hashes. The [October 2026 refresh](docs/research/upstream-skills-refresh-2026-10-17.md) records the changes and validation. Run `npm run check:skill-sources` to detect unrecorded local source drift; CI runs the same check before packaging. After reviewing an intentional edit, `node build/skill-sources.js --refresh-local` updates only local hashes. It does not fetch upstream, change source pins, or establish that an adapted file matches upstream. Review source revisions and upstream hashes separately when importing new material.

Superpowers-derived skills keep their installed bundles read-only. Their generated notes, ledgers, review packages, logs, fixtures, and diagrams live under the active project’s `_arcwright/_memory/skill-runs/`; new skill drafts use `_arcwright/_memory/skills/`. The [runtime storage contract](.agents/skills/SOURCES-SUPERPOWERS.md) explains project selection and helper safeguards. Local runs are excluded from package builds.
