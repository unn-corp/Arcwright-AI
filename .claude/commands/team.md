---
description: Choose and spawn an agent team — 17 pre-built compositions; runs as tmux split panes when $TMUX is set, or as in-process Agent tool calls when not
---

# /team — Spawn an Agent Team

Arcwright provides 17 pre-built agent teams. Each team is a coordinated group of specialist agents working toward a specific kind of outcome.

Teams run in one of two modes, automatically chosen by context:

| Mode | When | How it works |
|------|------|--------------|
| **Split-pane (tmux)** | `$TMUX` is set — user is inside tmux | Each teammate gets its own tmux pane running `claude --dangerously-skip-permissions`. Agents stay alive across tasks, communicate via `tmux send-keys`, and coordinate through a session file at `.agents/orchestration/session-*.md`. User observes all panes live. |
| **In-process (Agent tool)** | `$TMUX` is not set, or task is fully autonomous | Each teammate runs as an `Agent` tool invocation from the master orchestrator. Agents run sequentially; the master passes completed output as structured handoff context to the next agent. No user observation, no parallelism — best for scripted/batch work. |

Both modes use the **same team composition and protocol** — only the spawning mechanism differs. The team's SKILL.md contains both spawn sequences.

## Instructions

### Step 1: Ask the User to Choose

Present the table below to the user and ask which team they want to spawn. If they describe a goal instead of picking a team, suggest the best-fit team based on the descriptions.

### Step 2: Detect Mode

```bash
[ -n "$TMUX" ] && echo "split-pane" || echo "in-process"
```

If `$TMUX` is set, you'll use split-pane mode. Otherwise, in-process. (The user can override by saying "spawn" or "open agents" — that forces split-pane mode if they want to install/run tmux first.)

### Step 3: Load the Team Skill

Read `.agents/skills/team-{code}/SKILL.md` (or `.kiro/skills/team-{code}/SKILL.md`) for the full spawn protocol, pane layout / agent chain, communication rules, and report-back sequence.

### Step 4: Load tmux-protocol (split-pane mode only)

If running in split-pane mode, also read `.agents/skills/tmux-protocol/SKILL.md` before spawning any pane. This contains the message delivery protocol, pane close sequence, and AGENT_SIGNAL format.

### Step 5: Spawn the Team

- **Split-pane:** follow the tmux spawn sequence in the skill — `tmux split-window -h -c '#{pane_current_path}' "claude --dangerously-skip-permissions '<agent prompt>'"`. Register each pane in the session file Active Agents table. Never route by pane title — use the session file.
- **In-process:** follow the in-process chain in the skill — invoke each teammate via the `Agent` tool with the handoff context from the previous agent. The master orchestrator owns the loop.

---

## Team Catalog

### Development Teams

| Code | Name | Composition | When to use |
|------|------|-------------|-------------|
| **arch-dev** | The Foundry | Architect + Dev | Architect designs approach, Dev implements, Architect spot-checks — for non-trivial features needing upfront design |
| **full-dev** | The Engine Room | Dev + QA + on-call Architect | Main dev loop with QA validation; Architect available for complex decisions |
| **dev-qa** | Dev + QA Loop | Dev + QA | Iterative: Dev implements, QA validates with playwright-cli, failures loop back to Dev |
| **tdd** | The Forge | QA + Dev | TDD: QA writes failing tests first, Dev implements to green, QA verifies |
| **solo-dev** | Ghost | Single quick-flow-solo-dev | Sequential task queue; dev signals completion each time |

### Review & Audit Teams

| Code | Name | Composition | When to use |
|------|------|-------------|-------------|
| **review** | Review + Fix Loop | Architect + UX + Dev | Architect and UX review concurrently, batched findings go to Dev, loop until clean |
| **audit** | The Crucible | Architect + UX + Security | Full audit with three specialists running concurrently; Security has final sign-off |
| **sec-qa** | The Vault | Security + Dev + QA | Security finds vulnerabilities, Dev remediates, QA closes the exploit path, Security signs off |

### Planning & Research Teams

| Code | Name | Composition | When to use |
|------|------|-------------|-------------|
| **blueprint** | War Room | PM + Analyst + Architect | Strategic planning before any build — PRDs, research, architecture |
| **research** | Recon Pod | Analyst + PM + Tech Writer | Analyst researches, PM synthesizes briefs, Tech Writer documents outputs |
| **ux-arch** | The Blueprint Room | UX + Architect | Design artifacts only — no implementation, no iterative loop |

### Specialist Teams

| Code | Name | Composition | When to use |
|------|------|-------------|-------------|
| **sprint** | The Strike Team | SM + Dev + QA | SM manages sprint queue, Dev implements stories in sequence, QA validates each before SM marks done |
| **docs** | The Library | Tech Writer + Architect | Tech Writer drafts, Architect reviews for technical accuracy |
| **ux-qa** | The Atelier | UX Designer + QA | UX Designer implements (writes code), QA validates live UI with playwright-cli, loop until clean |
| **hotfix** | Rapid Response | Dev + Security | Emergency fix — max 4 files, isolated subsystem, Security reviews before merge |

### Solo Teams

| Code | Name | Composition | When to use |
|------|------|-------------|-------------|
| **solo-arch** | The Oracle | Single Architect | Architecture analysis, design proposals, prototyping — with full dev skill access |
| **solo-qa** | The Inquisitor | Single QA | Regression runs, playwright-cli sessions, pass/fail reports |

---

## Usage Example

```
User: /team
You: Which team would you like to spawn? Here are the 17 options... [present table]
User: arch-dev
You: [Reads .agents/skills/team-arch-dev/SKILL.md, loads tmux-protocol, spawns the Architect and Dev panes per the skill's spawn sequence]
```

If the user passes a team code as an argument (e.g. `/team arch-dev`), skip the selection step and go straight to loading that team's skill.

## Arguments

`$ARGUMENTS` — optional team code (e.g. `arch-dev`, `review`, `tdd`). If empty, present the catalog and ask.
