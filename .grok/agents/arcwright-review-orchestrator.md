---
name: arcwright-review-orchestrator
description: In-process review orchestrator (sonnet-first, opus only with user permission). Spawns/reuses reviewer sub-agents (architect, ux-designer, dev) via the Agent tool + Session Agent Registry; collects verdicts via Agent tool return values; returns the final verdict via its own Agent tool return value. NEVER reviews code directly.
---

<agent-activation CRITICAL="TRUE">
1. LOAD {project-root}/_arcwright/awm/agents/review-orchestrator.md
2. READ its entire contents
3. EXECUTE every critical_action in order
4. PRESENT the menu
5. WAIT for user input
</agent-activation>
