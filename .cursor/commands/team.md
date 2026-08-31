# /team — Spawn an Agent Team

Arcwright provides 17 pre-built agent teams. Each team is a coordinated group of specialist agents working toward a specific kind of outcome.

**Default mode is in-process:** every team runs via the `Agent` tool with `SendMessage` reuse (governed by a Session Agent Registry, as defined in the [`claude-subagent-protocol`](../.agents/skills/claude-subagent-protocol/SKILL.md) skill).

**When running inside Herdr (`$HERDR_ENV` is set), offer the user a visible-pane option** (see Step 1b): spawn each team agent in its own Herdr pane in the current session, so the user can watch them work. The pane is a viewing surface; the in-process orchestration inside it is still governed by the protocol skill.

The old `tmux-protocol` skill (AGENT_SIGNAL/PEER_SIGNAL/STATUS_CHECK polling) is retired. Do not reintroduce those signals.

## Instructions

### Step 1: Ask the User to Choose a Team

Present the table below to the user and ask which team they want to spawn. If they describe a goal instead of picking a team, suggest the best-fit team based on the descriptions.

### Step 1b: Offer the execution mode (only when `$HERDR_ENV` is set)

Check whether Herdr is active: `[ "${HERDR_ENV:-}" = "1" ]` (you are running inside a Herdr pane). Then:

- **If Herdr is active,** after the user picks a team, ask one short question offering how to run it:
  > "Run this team in-process (default), or spawn each agent in its own Herdr pane in this session so you can watch them work?"
  Accept: in-process (default) / herdr panes. If they want panes, ask whether to place them in the **current tab** (split panes beside this one) or a **new tab** in the session (default: current tab, split right).
- **If Herdr is not active** (`$HERDR_ENV` unset), do not ask; run in-process. Only fall back to a visible-pane path if the user explicitly requests it by other means.

### Step 2: Load the Team Skill

Read `.agents/skills/team-{code}/SKILL.md` for the full spawn protocol, agent chain, registry path, model/policy, and wind-down rules.

### Step 3: Load Herdr pane mechanics (only if the user chose panes)

If the user chose the Herdr-pane mode in Step 1b, also read `.agents/skills/herdr/SKILL.md` (the "Watching agents in panes (opt-in)" section) for `herdr agent start` / `herdr wait agent-status` mechanics. The in-process flow inside each pane is still governed by the team skill + `claude-subagent-protocol`.

### Step 4: Spawn the Team

- **In-process (default):** follow the in-process chain in the skill. For each role in the team:
  - If the role is not yet in the Session Agent Registry → invoke the `Agent` tool, capture the returned `agentId`, write a row to `_arcwright-output/sessions/<session-id>/agent-registry.md`.
  - If the role is already in the registry and the task is on the same scope → `SendMessage(to: <agentId>, ...)` to reuse the existing agent.
  - Pass handoff context from prior step outputs into the next prompt's `## Inputs` section.
  - The master orchestrator owns the loop. Sequential handoff is blocking — wait for each Agent call to return before proceeding.
- **Herdr panes (if chosen in Step 1b):** spawn each team role into its own pane in the current Herdr session so the user can watch:
  - Per role: `herdr agent start <role> --split right -- claude --dangerously-skip-permissions '<role prompt with handoff context>'` (use `--new-tab` instead of `--split right` if the user chose a new tab). Rename the pane to the role for clarity: `herdr pane rename <pane-id> <role>`.
  - Wait on a role that needs input with `herdr wait agent-status <role> --status blocked --timeout 600000`; read its output with `herdr pane read <role>`; send follow-ups with `herdr pane run <role> '<message>'` (which presses Enter, unlike `herdr agent send`).
  - Register each spawned pane (role, pane-id) in the session file alongside the registry. Close a pane when its role is done with `herdr pane close <role>`.
  - The pane is a viewing surface only. Each spawned agent still uses the Agent tool + SendMessage per `claude-subagent-protocol` internally, defaults to `sonnet`, and asks before any `opus` escalation.

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
You: [Reads .agents/skills/team-arch-dev/SKILL.md, follows the in-process chain: spawn Architect, spawn Dev, pass handoff via ## Inputs, update the Session Agent Registry after each spawn]
```

If the user passes a team code as an argument (e.g. `/team arch-dev`), skip the selection step and go straight to loading that team's skill.

## Arguments

`the user's command input` — optional team code (e.g. `arch-dev`, `review`, `tdd`). If empty, present the catalog and ask.
