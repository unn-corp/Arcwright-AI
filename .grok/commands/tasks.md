---
description: "Plan or maintain the active task list, dependencies, and progress using the project's chosen tracking convention."
handoffs:
  - label: "Check wave progress"
    prompt: "/tasks status"
  - label: "Run next wave"
    prompt: "/tasks run"
  - label: "Sync to GitHub Issues"
    prompt: "/tasks sync"
---

Load and follow the installed `task-manager` skill (`.agents/skills/task-manager/SKILL.md`)
for $ARGUMENTS, using the active project's copy before a global fallback. Read
only relevant references and execute the supplied task within existing authority.
Preserve the host's provider/model choice and actual tools. Discovery or planning
alone does not authorize installation, external synchronization, publishing, or
new delegated work. Ask only for consequential missing information.
