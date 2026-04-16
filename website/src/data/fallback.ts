export const fallbackReadme = `# Arcwright

> AI-native agile workflow orchestration for Claude Code, Kiro, and 5 more IDEs.

Arcwright installs a structured system of specialist AI agents, workflow tracks, and a 53-skill library into any project. Pick a track sized to your task, and the orchestrator routes it through spec, research, UX, implementation, review, and QA — using named agents in coordinated tmux panes or sequential in-process Agent tool calls.

---

## Quick Start

\`\`\`bash
npx @arcwright-ai/agent-orchestration
\`\`\`

Then use a slash command to kick off a workflow:

\`\`\`
/arcwright-track-medium
\`\`\`

---

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| \`@arcwright-ai/agent-orchestration\` | Agents, skills, workflows, IDE configs, slash commands | \`npx @arcwright-ai/agent-orchestration\` |
| \`@arcwright-ai/tmux-setup\` | tmux config + scripts for AI agent workflows | \`npx @arcwright-ai/tmux-setup\` |

---

## Workflow Tracks

| Command | Scope | Pipeline |
|---------|-------|----------|
| \`/arcwright-track-nano\` | 1–2 files, ≤20 lines | Direct to Dev, no spec overhead |
| \`/arcwright-track-small\` | 2–4 files | Spec → Dev → Review → QA |
| \`/arcwright-track-compact\` | 4–8 files | Optional Research → Dev → Review → QA |
| \`/arcwright-track-medium\` | 6–12 files | Spec → Research → UX → Review Gate → Dev → Final Gate → QA |
| \`/arcwright-track-extended\` | 10–16 files | PRD + arch notes, 2 review gates |
| \`/arcwright-track-large\` | 12+ files | Full planning, epic loop, parallel research, final gates |
| \`/arcwright-track-rv\` | Any | Audit → synthesize findings → route to fix path |

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
