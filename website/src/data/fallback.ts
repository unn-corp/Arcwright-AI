export const fallbackReadme = `# Arcwright

> AI-native agile workflow orchestration for Claude Code, Kiro, and 5 more IDEs.

Arcwright installs a structured system of specialist AI agents, in-process subagent orchestration, and a 47-skill library into any project. The orchestrator routes your task through plain in-process Agent tool calls (with SendMessage reuse across a Session Agent Registry) by default — with tmux panes available as an opt-in viewing surface when you want to watch.

---

## Quick Start

\`\`\`bash
npx @arcwright-ai/agent-orchestration
\`\`\`

Then point the workflow router at your task and run the recommended approach:

\`\`\`
/triage "your task description"
\`\`\`

The router does not execute the work — it returns a recommended runtime (plain in-process agent(s), an ultracode dynamic workflow, a /goal loop, or a pre-built team via /team) and the trigger to run it.

---

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| \`@arcwright-ai/agent-orchestration\` | Agents, skills, workflows, IDE configs, slash commands | \`npx @arcwright-ai/agent-orchestration\` |
| \`@arcwright-ai/tmux-setup\` | tmux config + scripts (Catppuccin, pane title sync, clipboard) — used as an opt-in visibility surface for in-process agents | \`npx @arcwright-ai/tmux-setup\` |

---

## Slash Commands

| Command | Purpose |
|---------|---------|
| \`/triage <task>\` | Workflow router — given a task, recommends an execution approach: plain in-process agent(s), an \`ultracode\` dynamic workflow, or a \`/goal\` loop. Optional tmux opt-in visibility for users who want to watch. |
| \`/team <code>\` | Spawns one of 17 pre-built agent team compositions. Agents run in-process and can be reused across follow-up work via SendMessage. tmux split-pane visibility is opt-in. |
| \`/tmux\` | Runs the tmux setup installer (\`npx @arcwright-ai/tmux-setup\`). Installs Catppuccin theme, Actions popup, pane title sync, clipboard integration, and pane-visibility scripts. tmux panes are a *viewing surface* for in-process orchestration, not the spawn mechanism. |
| \`/goal <condition>\` | Keeps working until a verification condition is true. Use when the completion condition is a check (tests pass, no type errors, lint clean), not a single deliverable. |
| \`/gsudo\` | Loads the gsudo skill and runs a command with Windows elevated privileges. Works from WSL2, Git Bash, or native Windows. |
| \`/arcwright-migrate\` | Migrates an existing bmad installation to arcwright naming. Runs a dry-run first, then applies the rename. |

The track system (nano / small / compact / medium / extended / large / rv) has been retired; \`/triage\` now routes tasks to one of the runtimes above or a team from \`/team\`.

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

---

## Supported IDEs

Claude Code, Kiro (IDE + CLI), Cursor, Windsurf, Cline, GitHub Copilot, Gemini

\`\`\`bash
npx @arcwright-ai/agent-orchestration --tools claude-code,kiro
\`\`\`

---

## License

MIT
`;
