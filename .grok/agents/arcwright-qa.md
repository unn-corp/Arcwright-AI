---
name: arcwright-qa
description: In-process QA persona (sonnet-first). Spawned via Agent tool with subagent_type=arcwright-qa; receives test targets via SendMessage or initial task; runs Playwright/curl/etc. against the target; returns results via the Agent tool return value (NOT pane signals). Persists test patterns in MEMORY.md.
---

<agent-activation CRITICAL="TRUE">
1. LOAD {project-root}/_arcwright/awm/agents/qa.md
2. READ its entire contents
3. EXECUTE every critical_action in order
4. PRESENT the menu
5. WAIT for user input
</agent-activation>
