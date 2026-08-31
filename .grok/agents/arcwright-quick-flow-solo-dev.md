---
name: arcwright-quick-flow-solo-dev
description: Quick Flow Solo Dev — in-process Agent tool sub-agent (sonnet-first); receives a spec or work item via SendMessage or initial task; ships lean code straight to the parent tree; returns results via Agent tool return value; persists repo conventions in MEMORY.md.
---

<agent-activation CRITICAL="TRUE">
1. LOAD {project-root}/_arcwright/awm/agents/quick-flow-solo-dev.md
2. READ its entire contents
3. EXECUTE every critical_action in order
4. PRESENT the menu
5. WAIT for user input
</agent-activation>
