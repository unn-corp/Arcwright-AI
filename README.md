# devo-custom-bmad

> AI-native agile workflow packages for Claude Code and compatible AI assistants.
> Built from the [BMAD Method](https://github.com/bmad-method/bmad-method) — extended with multi-track orchestration, tmux agent coordination, and project-specific addons.

---

## Packages

### `@devo-bmad-custom/agent-orchestration` — Base Package

BMAD Method — AI-native agile workflow system for Claude Code and compatible AI assistants

Installs the full BMAD agent system into any project: all specialist agents (PM, Architect, UX, Dev, QA, Tech Writer, and more), the `master-orchestrator` workflow conductor, skills library, and IDE integration for 6 platforms.

**Install (npx — no global install needed):**
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
npx @devo-bmad-custom/agent-orchestration tmux       # run interactive tmux setup
```

**What gets installed:**
- `_bmad/` — all agents, workflows, skills, and core config
- `_bmad-output/` — output folder created for build artifacts
- `.claude/commands/bmad-track-*.md` — 7 pre-built workflow track slash commands
- IDE integration files for your chosen platform (Claude Code, Cursor, Windsurf, Cline, GitHub Copilot, Gemini CLI)
- Root `CLAUDE.md` — agent spawning rules appended (Claude Code only)
- `.claude/settings.json` — `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` set (Claude Code only)
- `~/.tmux.conf` and supporting scripts (optional, Claude Code only)

**Supported platforms:** Claude Code · Cursor · Windsurf · Cline · GitHub Copilot · Gemini CLI

---

### `@devo-bmad-custom/squidhub` — Squidhub Addon

BMAD Squidhub Addon — squid-master orchestration agent, review workflows, and Squidhub-specific configurations

Requires the base package. Adds the `squid-master` orchestration agent (full persona, with sidecar memory), review orchestrator, Squidhub module config, and 7 pre-built `/bmad-track-*` slash commands pointed at the Squidhub agent build.

**Install:**
```bash
# Install base first:
npx @devo-bmad-custom/agent-orchestration

# Then install the Squidhub addon:
npx @devo-bmad-custom/squidhub
```

**Commands:**
```bash
npx @devo-bmad-custom/squidhub            # interactive install
npx @devo-bmad-custom/squidhub install    # install with prompts
npx @devo-bmad-custom/squidhub update     # update addon files
npx @devo-bmad-custom/squidhub status     # check addon status
```

**What gets installed:**
- `_bmad/_memory/squid-master-sidecar/` — full sidecar memory (instructions, workflow chains, agent registry)
- `_bmad/bmm/agents/review-agent.md` — review orchestrator agent
- `_bmad/squidhub/` — Squidhub-specific module config
- `.claude/commands/bmad-track-*.md` — 7 track slash commands (squid-master persona)

---

## Workflow Tracks

After installing, use `/bmad-track-*` slash commands in Claude Code to start a pre-routed workflow session. The orchestrator activates, skips complexity triage, and goes straight to task intake for the chosen track:

| Command | Track | Scope | Chain |
|---------|-------|-------|-------|
| `/bmad-track-nano` | **Nano** | ≤20 lines, 1-2 files | Quick Dev → DRY+UV Gate → Approval |
| `/bmad-track-small` | **Small** | 2–4 files, quick fix | Quick Spec → Quick Dev → Review Gate → QA → Approval |
| `/bmad-track-compact` | **Compact** | 4–8 files, light context | Quick Spec → Research? → Quick Dev → Review Gate → QA → Approval |
| `/bmad-track-medium` | **Medium** | multi-file, UX phase | Spec → Research → UX → Review Gate → Dev → Final Gate → QA → Approval |
| `/bmad-track-extended` | **Extended** | PRD + architecture | Spec → Research → PRD → UX+Arch+Sprint → Gate → Dev → Gate → QA → Approval |
| `/bmad-track-large` | **Large** | epic-scale | Brief → Research×3 → PRD → Gates → UX+Arch → Sprint → Epic Loop → Final QA → Retros |
| `/bmad-track-rv` | **Review Track** | code/feature review | Target → Complexity → Research → Multi-Lens Review → Volume Gate → SMALL or LARGE path |

---

## Agent Execution Modes

The orchestrator supports 4 execution modes chosen at session start:

| Mode | Description |
|------|-------------|
| `[1] same-conversation` | All agents run in-process, sharing one context |
| `[2] command blocks` | Outputs copy-paste tmux commands for manual agent spawning |
| `[3] launch scripts` | Generates shell scripts for automated multi-pane launch |
| `[4] agent teams` | Uses `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` for parallel spawning |

When tmux is active (`$TMUX` is set), split-pane agents spawn in new panes automatically. Without tmux, all steps fall back to in-process.

---

## tmux Setup (Claude Code)

The base package includes a full tmux configuration suite. Run the interactive setup:

```bash
npx @devo-bmad-custom/agent-orchestration tmux
```

This installs `~/.tmux.conf`, status bar scripts, clipboard integration, and shell aliases. Requires tmux 3.2+.

---

## Repository Structure

```
devo-custom-bmad/
├── agent-orchestration/    # @devo-bmad-custom/agent-orchestration package
│   ├── bin/bmad.js         # CLI entry point
│   ├── lib/                # installer, CLI, filter logic
│   └── src/                # all _bmad content + skills
│       ├── bmb/            # agent builder agents
│       ├── bmm/            # method agents (PM, Arch, UX, Dev, QA…)
│       ├── core/           # core workflows and master-orchestrator
│       ├── _memory/        # sidecar memory and skills
│       ├── .agents/skills/ # 24 bundled skills
│       └── .claude/commands/ # bmad-track-* slash commands
└── squidhub-addon/         # @devo-bmad-custom/squidhub package
    ├── bin/bmad-squidhub.js
    ├── lib/
    └── src/
        ├── squidhub/       # Squidhub module config
        ├── _memory/squid-master-sidecar/
        ├── bmm/agents/review-agent.md
        └── .claude/commands/ # squid-master track commands
```

---

*Auto-generated by the BMAD packager. Do not edit manually — changes will be overwritten on the next build.*
