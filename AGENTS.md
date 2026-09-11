<!-- arcwright-agent-start -->

## Arcwright

Arcwright agents, skills, and workflows are installed in `_arcwright/`.
Key modules: core, awm, awb, _memory

To use an agent, load its `.md` file and follow its activation instructions.
Agent configs are in `_arcwright/{module}/config.yaml`.
Skills are in `.agents/skills/` and `_arcwright/_memory/skills/`.
When this project uses the Unnamed Development MCP, load `.agents/skills/unnamed-dev-mcp/SKILL.md` before MCP work and keep tracker state synchronized.
If Unnamed Development MCP is unavailable, paste the pending tracker payload in chat (project, work, intended status). Do not bury it only in `_arcwright-output/unnamed-pm-pending/`.

## Unnamed Development MCP trigger

The lifecycle hook performs the Unnamed Development MCP preflight once at session start. Do not repeat it on every turn. Refresh manually with the explicit Unnamed Development MCP command for the current harness when the repository, branch, milestone, or tracker state materially changes, or when the user explicitly asks for tracker synchronization. Reuse matching records; never duplicate them. Read CRM/commercial records before persisted mutations.

To update Arcwright: `npx @arcwright-ai/agent-orchestration update`
To toggle agent teams: add `--no-teams` or run update again and choose differently at the prompt.
To enable Docker type-check: add `--docker-check`.
To modify gitignore behavior on next update: add `--gitignore full|skills|output-only|none`.
For global installs: add `--global` to any command. Update a global install with `npx @arcwright-ai/agent-orchestration update --global`.

<!-- arcwright-agent-end -->
