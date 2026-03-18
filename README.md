# devo-custom-bmad

> Multi-agent AI workflow orchestration for Claude Code — built on the BMAD Method.

A system of npm packages that installs a complete multi-agent development workflow into any project. A **master orchestrator** agent routes work to specialist agents (PM, Architect, UX, Dev, QA, Tech Writer) running in parallel tmux panes, coordinated through a shared task list.

---

## How Multi-Agent Orchestration Works

The system uses a **coordinator + agent team** model where teammates share a task list, claim work, communicate directly with each other, and report back to the orchestrator — rather than the orchestrator managing every step in a single conversation.

```
                    Master Orchestrator
                   (routes & assigns tasks)
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
         Shared Task List (session file)
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
 Analyst    Dev Agent   QA Agent
(tmux pane)(tmux pane) (tmux pane)
    │         │         │
    └────communicate────┘
         report back
```

**Subagents** (Claude's built-in) only report results back to the main agent — they never talk to each other. This system goes further: agents running in **separate tmux panes** share a file-based session log, claim tasks independently, communicate directly via `tmux send-keys`, and can run truly in parallel. The orchestrator assigns work and unblocks — it doesn't bottleneck every step.

**Four execution modes** — chosen at session start:

| Mode | How agents run |
|------|---------------|
| `[1] same-conversation` | All steps in one Claude context — simplest, no tmux needed |
| `[2] command blocks` | Outputs tmux commands to paste for manual pane spawning |
| `[3] launch scripts` | Generates shell scripts for automated multi-pane setup |
| `[4] agent teams` | Claude Code experimental teams — parallel spawning via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |

When tmux is active (`$TMUX` set), agents in modes 2–4 spawn in new split panes automatically. Without tmux, everything runs in-process.

---

## Workflow Tracks

Use `/bmad-track-*` slash commands to start a pre-routed session. The orchestrator skips triage and goes straight to task intake for the chosen scale:

| Track | Scope | Agent Chain |
|-------|-------|-------------|
| `/bmad-track-nano` | ≤20 lines, 1–2 files | Quick Dev → DRY+UV Gate → Approval |
| `/bmad-track-small` | 2–4 files, quick fix | Quick Spec → Quick Dev → Review Gate → QA → Approval |
| `/bmad-track-compact` | 4–8 files, light context | Quick Spec → Research? → Dev → Review Gate → QA → Approval |
| `/bmad-track-medium` | Multi-file, UX phase | Spec → Research → UX → Review Gate → Dev → Final Gate → QA → Approval |
| `/bmad-track-extended` | PRD + architecture | Spec → Research → PRD → UX+Arch+Sprint → Gate → Dev → Gate → QA → Approval |
| `/bmad-track-large` | Epic-scale | Brief → Research×3 → PRD → Gates → UX+Arch → Sprint → Epic Loop → Final QA → Retros |
| `/bmad-track-rv` | Code/feature review | Target → Complexity → Research → Multi-Lens Review → Volume Gate → SMALL or LARGE |

Tracks are installed as Claude Code slash commands at `.claude/commands/bmad-track-*.md`. Each command activates the orchestrator with the track pre-selected.

---

## Packages

### `@devo-bmad-custom/agent-orchestration` v1.0.2 — Base Package

BMAD Method — AI-native agile workflow system for Claude Code and compatible AI assistants

Installs the full agent system into your project. Includes all specialist agents, the `master-orchestrator` conductor, 24-skill library, 7 workflow track slash commands, and IDE integration for 6 platforms.

```bash
npx @devo-bmad-custom/agent-orchestration
```

**Commands:**
```bash
npx @devo-bmad-custom/agent-orchestration            # interactive install
npx @devo-bmad-custom/agent-orchestration install    # install with prompts
npx @devo-bmad-custom/agent-orchestration update     # update installed files
npx @devo-bmad-custom/agent-orchestration status     # check what's installed
npx @devo-bmad-custom/agent-orchestration platforms  # list supported IDEs
npx @devo-bmad-custom/agent-orchestration tmux       # interactive tmux setup
```

During install you select which AI tools to configure:

- **Claude Code** — agents, CLAUDE.md rules, `.claude/settings.json`, tmux integration
- **Cursor** — `.cursor/rules/bmad.mdc`
- **Windsurf** — `.windsurfrules`
- **Cline** — `.clinerules`
- **GitHub Copilot** — `.github/copilot-instructions.md`
- **Gemini CLI** — `GEMINI.md`

**What gets installed to your project:**
```
{project-root}/
├── _devo-bmad-custom/          # All agents, workflows, skills, config
│   ├── core/                   # master-orchestrator agent + workflows
│   ├── bmm/                    # PM, Architect, UX, Dev, QA, Tech Writer, SM agents
│   ├── bmb/                    # Agent builder agents
│   ├── _memory/                # Sidecar instructions + 24 skills
│   └── .agents/skills/         # Reusable skill library
├── .claude/commands/           # bmad-track-*.md slash commands
├── CLAUDE.md                   # Agent spawning rules appended
└── .claude/settings.json       # CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

---

### `@devo-bmad-custom/squidhub` v1.0.2 — Squidhub Addon

BMAD Squidhub Addon — squid-master orchestration agent, review workflows, and Squidhub-specific configurations

Requires the base package. Adds the `squid-master` orchestration persona with full sidecar memory, review orchestrator, Squidhub module config, and track commands pre-pointed at the Squidhub agent build.

```bash
# Install base first, then:
npx @devo-bmad-custom/squidhub
```

**What gets added:**
```
{project-root}/
├── _devo-bmad-custom/
│   ├── squidhub/               # Squidhub module config
│   ├── _memory/squid-master-sidecar/  # Full sidecar (instructions, workflow chains, registry)
│   └── bmm/agents/review-agent.md    # Review orchestrator
└── .claude/commands/           # bmad-track-*.md (squid-master persona)
```

---

### `@devo-bmad-custom/tmux` v1.0.3 — tmux Setup

Standalone tmux configuration for AI agent workflows. No BMAD install required.

```bash
npx @devo-bmad-custom/tmux
```

**What gets installed:**
```
~/.tmux.conf                    # Catppuccin Mocha, Powerline status bar, mouse support
~/.config/tmux/
├── colors.conf                 # Color palette
└── bin/
    ├── status_*.sh             # Status bar segments (CPU, RAM, Claude usage, time)
    ├── pane_title_sync.sh      # Syncs Claude Code pane title → tmux border (OSC 2)
    ├── paste_image_wrapper.sh  # Clipboard image paste (WSL2 + Wayland fallback)
    ├── float_terminal.sh       # Floating terminal popup
    └── actions.sh              # fzf actions menu
~/.local/bin/xclip              # WSL2 clipboard bridge
```

**Setup steps (interactive):**
1. Prerequisites — WSL install and `sudo apt-get` steps listed for manual completion; NVM, TPM, fzf, Nerd Fonts can be handled by AI with relaxed permissions
2. Shell aliases — `tmux-ai` (open tmux session) · `tmux-claude` (open tmux + launch Claude)
3. TPM plugin check
4. Config file writing — tmux.conf, status scripts, clipboard bridge

**Requirements:** tmux 3.4+ · WSL2 (Ubuntu) · `wl-clipboard` · `wslu` · Node 20+ · JetBrainsMono Nerd Font (for Powerline separators)

---

## Quick Start

```bash
# 1. Install the base agent system into your project
cd your-project
npx @devo-bmad-custom/agent-orchestration

# 2. (Optional) Install tmux config for multi-pane agent coordination
npx @devo-bmad-custom/tmux

# 3. Open Claude Code and run a track slash command
# /bmad-track-small    — for quick fixes
# /bmad-track-medium   — for feature work with UX
# /bmad-track-large    — for epic-scale work
```

The orchestrator will greet you, confirm the track, choose an execution mode, then begin coordinating agents through the workflow chain.

---

## Session Coordination

When running in tmux with split panes, agents use a **file-based session log** to coordinate:

```
_bmad-output/parallel/{session_id}/agent-sessions.md

# Agent Session: 2026-03-17-feature-name-a3f2
## Active Agents
| Pane ID | Role        | Status | Claude Session ID |
|---------|-------------|--------|-------------------|
| %27     | orchestrator| idle   | ses_abc123...     |
| %31     | dev         | busy   | —                 |
| %33     | qa          | idle   | —                 |

## Tasks
### TASK-001 · in-progress · dev · claimed:%31
- Implement the user profile API endpoint
```

Agents register on startup, claim pending tasks, and send completion messages via `tmux send-keys`. Session files are permanent artifacts — closed agent sessions can be resumed with `claude --resume <session_id>`.

---

## Installed Output Preview

The `output/` directory in this repo shows exactly what each package writes after installation:

```
output/
├── agent-orchestration/    # → {project-root}/_devo-bmad-custom/
├── squidhub-addon/         # → merged into {project-root}/_devo-bmad-custom/
└── tmux-config/            # → ~/.config/tmux/bin/ and ~/.tmux.conf
```

---

## Repository Structure

```
devo-custom-bmad/
├── devo-bmad-custom-agent-orchestration/   # npm package source
├── devo-bmad-custom-squidhub/              # npm package source
├── devo-bmad-custom-tmux/                  # npm package source
├── output/                                 # Installed file preview (see above)
└── README.md                               # This file
```

---

*Auto-generated by the BMAD packager. Do not edit manually — changes will be overwritten on the next build.*
