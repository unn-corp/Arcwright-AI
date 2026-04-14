# Arcwright

> AI-native agile workflow orchestration for Claude Code, Kiro, and 5 more IDEs.

Arcwright installs a structured system of specialist AI agents, workflow tracks, and a 53-skill library into any project. Pick a track sized to your task, and the orchestrator routes it through spec, research, UX, implementation, review, and QA — using named agents in coordinated tmux panes.

## Quick Start

```bash
npx @arcwright-ai/agent-orchestration
```

Then use a slash command to kick off a workflow:

```
/arcwright-track-medium
```

## Workflow Tracks

| Track | Scope | Pipeline |
|-------|-------|----------|
| `/arcwright-track-nano` | 1–2 files, ≤20 lines | Direct to Dev |
| `/arcwright-track-small` | 2–4 files | Spec → Dev → Review → QA |
| `/arcwright-track-compact` | 4–8 files | Optional Research → Dev → Review → QA |
| `/arcwright-track-medium` | 6–12 files | Spec → Research → UX → Review Gate → Dev → Final Gate → QA |
| `/arcwright-track-extended` | 10–16 files | PRD + arch notes, 2 review gates |
| `/arcwright-track-large` | 12+ files | Full planning, epic loop, parallel research, final gates |
| `/arcwright-track-rv` | Any | Audit → synthesize findings → route to fix path |

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

## Agent Teams

17 pre-built multi-pane team compositions for tmux, including:

- **The Foundry** — Architect + Dev
- **The Forge** — TDD (QA writes failing tests, Dev implements)
- **Rapid Response** — Emergency hotfix (max 4 files)
- **The Strike Team** — Sprint management with SM + Dev + QA
- **The Blueprint Room** — UX + Architect for design artifacts

## Supported IDEs

Claude Code, Kiro (IDE + CLI), Cursor, Windsurf, Cline, GitHub Copilot, Gemini

```bash
# Install for specific IDEs
npx @arcwright-ai/agent-orchestration --tools claude-code,kiro

# Global install
npx @arcwright-ai/agent-orchestration --global
```

Cross-platform: Windows (WSL2), Linux, macOS.

## tmux Setup

Standalone tmux configuration optimized for AI agent workflows:

```bash
npx @arcwright-ai/tmux-setup
```

Installs Catppuccin theme, pane title sync, clipboard integration, agent orchestration scripts, and status bar widgets (CPU, RAM, Claude usage). Requires tmux 3.4+.

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| `@arcwright-ai/agent-orchestration` | Agents, skills, workflows, IDE configs | `npx @arcwright-ai/agent-orchestration` |
| `@arcwright-ai/tmux-setup` | tmux config + scripts for agent workflows | `npx @arcwright-ai/tmux-setup` |

## Building from Source

```bash
node build/build.js
cd packages/agent-orchestration && npm publish --access public
```

## License

MIT
