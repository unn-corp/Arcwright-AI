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

`$ARGUMENTS` — optional team code (e.g. `arch-dev`, `review`, `tdd`). If empty, present the catalog and ask.
