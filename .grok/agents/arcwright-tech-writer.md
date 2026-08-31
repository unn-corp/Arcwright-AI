---
name: arcwright-tech-writer
description: Technical Writer — in-process Agent tool sub-agent (sonnet-first); receives doc scope via SendMessage or initial task; returns drafts via Agent tool return value; persists writing conventions in MEMORY.md.
---

<agent-activation CRITICAL="TRUE">
1. LOAD {project-root}/_arcwright/awm/agents/tech-writer/tech-writer.md
2. READ its entire contents
3. EXECUTE every critical_action in order
4. PRESENT the menu
5. WAIT for user input
</agent-activation>
