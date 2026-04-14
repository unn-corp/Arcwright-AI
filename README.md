# Arcwright

> AI-native agile workflow orchestration for Claude Code, Kiro, and 5 more IDEs.

Arcwright installs a structured system of specialist AI agents, workflow tracks, and a 53-skill library into any project. Pick a track sized to your task, and the orchestrator routes it through spec, research, UX, implementation, review, and QA — using named agents in coordinated tmux panes or sequential in-process Agent tool calls.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Packages](#packages)
- [Slash Commands](#slash-commands)
  - [Workflow Tracks](#workflow-tracks)
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
/arcwright-track-medium
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

Arcwright ships 11 slash commands for Claude Code (and the equivalents for Kiro / Cursor / etc. where supported). All commands live in `.claude/commands/` after install.

### Workflow Tracks

Each track is a pre-sized pipeline for a category of task. Pick the one that matches your task's scope — the orchestrator handles the rest.

| Command | Scope | Pipeline |
|---------|-------|----------|
| `/arcwright-track-nano` | 1–2 files, ≤20 lines | Direct to Dev, no spec overhead |
| `/arcwright-track-small` | 2–4 files | Spec → Dev → Review → QA |
| `/arcwright-track-compact` | 4–8 files | Optional Research → Dev → Review → QA |
| `/arcwright-track-medium` | 6–12 files | Spec → Research → UX → Review Gate → Dev → Final Gate → QA |
| `/arcwright-track-extended` | 10–16 files | PRD + arch notes, 2 review gates |
| `/arcwright-track-large` | 12+ files | Full planning, epic loop, parallel research, final gates |
| `/arcwright-track-rv` | Any | Audit → synthesize findings → route to fix path |

### Agent Teams (`/team`)

The `/team` command is an interactive team selector. It presents all 17 teams organized by category and asks you to pick one (or pass a code directly: `/team arch-dev`).

**Teams run in one of two modes, automatically chosen by context:**

| Mode | When | How It Works |
|------|------|--------------|
| **Split-pane (tmux)** | `$TMUX` is set — you're inside tmux | Each teammate gets its own tmux pane running `claude --dangerously-skip-permissions`. Agents stay alive across tasks, communicate via `tmux send-keys`, and coordinate through a session file at `.agents/orchestration/session-*.md`. You observe all panes live and can interject. |
| **In-process (Agent tool)** | `$TMUX` is not set, or task is fully autonomous | Each teammate runs as an `Agent` tool invocation from the master orchestrator. Agents run sequentially; the master passes completed output as structured handoff context to the next agent. No user observation, no parallelism — best for scripted or batch work. |

**Both modes use the same team composition and protocol** — only the spawning mechanism differs. Each team's SKILL.md contains both spawn sequences.

See the full team catalog below.

### Utility Commands

| Command | Purpose |
|---------|---------|
| `/tmux` | Runs the tmux setup installer (`npx @arcwright-ai/tmux-setup`). Installs Catppuccin theme, Actions popup, pane title sync, clipboard integration, and agent orchestration scripts. |
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

---

## tmux Setup

Standalone tmux configuration optimized for AI agent workflows:

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
| `bmad-track-*.md` | `arcwright-track-*.md` |
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
