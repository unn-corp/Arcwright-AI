# Arcwright

> AI-native agile workflow orchestration for Claude Code, Kiro, and 5 more IDEs.

Arcwright installs a structured system of specialist AI agents, in-process subagent orchestration, and a 47-skill library into any project. The orchestrator routes work through spec, research, UX, implementation, review, and QA — using **in-process `Agent` tool calls with `SendMessage` reuse** by default. tmux pane visibility is opt-in for users who want to watch.

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
- [tmux Setup](#tmux-setup)
- [Migrating from bmad](#migrating-from-bmad)
- [Building from Source](#building-from-source)
- [License](#license)

---

## Quick Start

```bash
npx @arcwright-ai/agent-orchestration
```

Then use a slash command to kick off a workflow:

```
/triage "your task description"
```

---

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| `@arcwright-ai/agent-orchestration` | Agents, skills, workflows, IDE configs, slash commands | `npx @arcwright-ai/agent-orchestration` |
| `@arcwright-ai/tmux-setup` | tmux config + scripts for AI agent workflows | `npx @arcwright-ai/tmux-setup` |

The tmux setup is also bundled inside the main package — you can install it with `npx @arcwright-ai/agent-orchestration tmux` or decline during the main install and grab it later from the standalone package. The two installs produce identical files.

---

## Slash Commands

Arcwright ships slash commands for Claude Code (and the equivalents for Kiro / Cursor / etc. where supported). All commands live in `.claude/commands/` after install.

For new work, the recommended entry point is **`/triage <task description>`** — the workflow router (`.agents/skills/triage/SKILL.md`) reads the task and recommends an execution approach:

- **Plain in-process agent(s)** — direct `Agent` tool spawn for focused, well-shaped work
- **`ultracode` dynamic workflow** — Claude Code's multi-agent workflow runtime for comprehensive, multi-stage, or unknown-size work (`docs/dev/claude-code-patterns/ultracode.md`)
- **`/goal` loop** — autonomous "keep working until this condition is true" loop for verification-check end states (`docs/dev/claude-code-patterns/orchestration.md`)

`/triage` does not execute the work — it recommends an approach and the trigger to run it.

### Agent Teams (`/team`)

The `/team` command is an interactive team selector. It presents all 17 teams organized by category and asks you to pick one (or pass a code directly: `/team arch-dev`).

**Teams run in-process by default** — each teammate is spawned via the `Agent` tool and the orchestrator captures returned `agentId` values into a **Session Agent Registry** (role → agentId table). Subsequent tasks for the same role re-engage the existing agent via `SendMessage(to: agentId, ...)`, so context carries across turns instead of being rebuilt from scratch. See `.agents/skills/claude-subagent-protocol/SKILL.md` for the full protocol (canonical spawn pattern, sonnet-first default, permission-before-opus).

**tmux pane visibility is opt-in.** When the user has explicitly asked to watch agents in split panes **and** `$TMUX` is set, load the `tmux` skill's "Watching agents in panes (opt-in)" section. The pane is a viewing surface — the in-process orchestration inside it is still governed by `claude-subagent-protocol`.

Not sure which team to use? Run `/triage <task>` first — the **workflow router** recommends plain in-process agent(s), an `ultracode` dynamic workflow, or a `/goal` loop based on the task's shape (see `.agents/skills/triage/SKILL.md`).

See the full team catalog below.

### Utility Commands

| Command | Purpose |
|---------|---------|
| `/triage` | Workflow router — given a task, recommends an execution approach: plain in-process agent(s), an `ultracode` dynamic workflow, or a `/goal` loop. Optional tmux opt-in visibility for users who want to watch. |
| `/tmux` | Runs the tmux setup installer (`npx @arcwright-ai/tmux-setup`). Installs Catppuccin theme, Actions popup, pane title sync, clipboard integration, and pane-visibility scripts. tmux panes are a *viewing surface* for in-process orchestration, not the spawn mechanism. |
| `/gsudo` | Loads the gsudo skill and runs a command with Windows elevated privileges. Works from WSL2, Git Bash, or native Windows. Takes `$ARGUMENTS` for the command to run. |
| `/arcwright-migrate` | Migrates an existing bmad installation to arcwright naming. Runs a dry-run first, then applies the rename. See [Migrating from bmad](#migrating-from-bmad). |

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

Plus meta-agents for building new agents, workflows, and modules (Arcwright Builder).

---

## Agent Teams Catalog

17 pre-built team compositions. Use `/team <code>` or just `/team` for the picker.

Each team runs **in-process by default** — the orchestrator spawns each role via the `Agent` tool, captures the returned `agentId` into a Session Agent Registry, and re-engages roles across tasks via `SendMessage`. tmux split-pane visibility is opt-in; see the `tmux` skill's "Watching agents in panes" section.

Not sure which team matches your task? Run `/triage <task>` first — the workflow router recommends an approach (plain in-process, ultracode, `/goal`, or one of the 17 teams) based on the task's shape.

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

Claude Code, Kiro (IDE + CLI), Cursor, Windsurf, Cline, GitHub Copilot, Gemini

```bash
# Install for specific IDEs
npx @arcwright-ai/agent-orchestration --tools claude-code,kiro

# Global install (applies to all projects via ~/ config dirs)
npx @arcwright-ai/agent-orchestration --global
```

Cross-platform: Windows (WSL2), Linux, macOS.

WSL2 dual-home aware — terminal tools (Claude Code, Gemini) use the Linux home (`~`); GUI IDEs (Kiro, Cursor, Windsurf, Cline, Copilot) use the Windows home (`/mnt/c/Users/<name>`).

### Install Flags

| Flag | Default | What it does |
|------|---------|--------------|
| `--yes`, `-y` | false | Skip interactive prompts, accept all defaults |
| `--global`, `-g` | false | Install to `~/.arcwright` / `~/.claude/` / `~/.kiro/` |
| `--directory <path>`, `-d` | cwd | Target project root |
| `--tools <ids>` | `claude-code` | Comma-sep: `claude-code,kiro,cursor,windsurf,cline,github-copilot,gemini` |
| `--modules <ids>` | `awm,awb,core,_memory` | Which modules to install |
| `--user-name <name>` | prompted | Your name (written into config.yaml) |
| `--output-folder <path>` | `_arcwright-output` | Where Arcwright writes output artifacts |
| `--no-teams` | teams included | Skip the 17 team-* skills and `/team` command |
| `--docker-check` | not installed | Opt in to `/docker-check` and the `docker-type-check` skill |
| `--gitignore <mode>` | prompted | One of: `full`, `skills`, `output-only`, `none` (see gitignore section below) |
| `--channel <stable\|next>` | `stable` | Release channel to track. Recorded in the manifest; `next` opts into pre-release builds when available. |
| `--hooks <safe\|full\|none>` | prompted (`safe`) | Autonomy posture in `.claude/settings.json` (asked interactively; **`safe` with `--yes`**). `safe` = autonomous: auto-accept edits + destructive-command/secret guards + SessionStart context. `full` adds tsc/pyright typecheck on edits. `none` = conservative (ask-first, no hooks). Idempotent merge; scripts land in `.claude/arcwright-hooks/`. See [`docs/hooks-guide.md`](docs/hooks-guide.md). |

**TOML customization (3-layer overrides):** on install, `_arcwright/custom/` is scaffolded with a commented `example.toml`. Drop `<name>.toml` (team) and `<name>.user.toml` (personal) there to override shipped defaults. Resolution order **base < team < user**: scalars override; arrays with a `<key>__append = true` sibling accumulate; keyed arrays (`id`/`name`) match-and-patch. No files present = unchanged behavior. Gitignore your `*.user.toml`.

The installer also writes `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` into `.claude/settings.json` — this flag is **load-bearing for `SendMessage` reuse** and the in-process kept-alive model described in `claude-subagent-protocol`. Don't remove it.

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
| Claude Code assets | `~/.claude/` | `~/.claude/` (WSL Linux home) |
| Kiro assets | `~/.kiro/` | `/mnt/c/Users/<name>/.kiro/` (Windows home) |
| tmux config | `~/.tmux.conf`, `~/.config/tmux/` | `~/.tmux.conf`, `~/.config/tmux/` |

**Updating a global install:**

```bash
npx @arcwright-ai/agent-orchestration update --global
```

The updater reads the global manifest at `~/.arcwright/_config/manifest.yaml`, applies changes for new versions, removes orphaned files from prior versions, and preserves:
- User-created agent overlays at `~/.arcwright/overlays/customize-agents/`
- Your `config.yaml` (only version metadata is refreshed)
- tmux config files if they already exist (installer prompts before overwriting)

Global installs skip the project-level gitignore prompt. On `update --yes --global`, the installer restores your previous choices for `--tools`, `--teams`, and `--docker-check` from the manifest automatically — no need to re-pass flags.

**Switching between global and project installs:**

These are independent — installing globally does not replace a project-level install. Claude Code and Kiro merge global and project configs at runtime. If both exist, the project-level entries take precedence.

---

## tmux Setup

Standalone tmux configuration. **tmux is a visibility tool, not a spawn mechanism** — the default Arcwright orchestration runs in-process via the `Agent` tool + `SendMessage` reuse (see `claude-subagent-protocol` skill). You only need tmux panes if you want to watch agents run.

```bash
npx @arcwright-ai/tmux-setup
```

Or from inside the main install:

```bash
npx @arcwright-ai/agent-orchestration tmux
```

**What it installs:**

- **Catppuccin Frappe theme** with Powerline status bar
- **Actions popup** (click `⚙ Actions` on the status bar) — a 4-column interactive menu:
  - **Window & Session** — zoom, switch windows, new/kill window, rename/kill session, detach
  - **Pane Controls** — split vertical/horizontal, kill, swap, break to new window, move pane between windows
  - **Tools & Clipboard** — float terminal, scratch terminal (Alt+I), save/restore session, copy mode, paste image, open URL in browser
  - **Launch** — Neovim (E or Alt+E), NvimTree (N), Yazi (Y), Lazygit (G), Lazydocker (D) — each opens in a vertical split using the pane's current directory
- **Pane title sync** — each pane's window name auto-updates from Claude Code's OSC 2 title
- **Clipboard integration** — WSL2 uses Windows clipboard, native Linux uses xclip, macOS uses pbcopy
- **Agent orchestration scripts** — `dispatch.sh`, `float_term.sh`, `paste_image_wrapper.sh`, `watch-sync.sh`
- **Status widgets** — CPU, RAM, Claude usage, session + window IDs, CWD, time
- **Shell aliases** — `tmux-ai` (open tmux at your project) and `tmux-claude` (same, but launch Claude in the first pane)

**Pane-based agent visibility is opt-in.** To watch a running agent in a split pane, see the "Watching agents in panes (opt-in)" section of the `.agents/skills/tmux/SKILL.md` skill. The pane mirrors the in-process session; the in-process flow inside it is still governed by `claude-subagent-protocol`.

**Requires:** tmux 3.4+, a Nerd Font (JetBrainsMono NFM recommended), WSL2 or native Linux/macOS.

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
cd ../tmux-setup && npm publish --access public
```

The build pipeline:

1. **buildGenericPackage** — copies `_arcwright/{awb,awm,core,_memory}/` and `.agents/skills/` → `src/`
2. **buildKiroAssets** — copies skills to `.kiro/skills/`, generates steering docs
3. **bundleSlashCommands** — copies the 11 slash commands → `src/.claude/commands/`
4. **bundleTmuxSetup** — copies tmux scripts from `packages/tmux-setup/src/tmux/` → `src/tmux/` (single source of truth, identical to standalone package)
5. **verifyNoLeaks** — scans for Squidhub content patterns; build fails if any found

Source of truth lives in `_arcwright/` (modules) and `packages/tmux-setup/src/tmux/` (tmux). `packages/agent-orchestration/src/` is wiped and regenerated on every build — never edit it directly.

---

## License

MIT
