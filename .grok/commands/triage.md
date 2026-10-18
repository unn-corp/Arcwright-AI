---
description: "Workflow router — given a task, recommend an execution approach: plain in-process agent(s), an ultracode dynamic workflow, or a /goal loop. Optional herdr opt-in visibility for users who want to watch."
handoffs:
  - label: "Refresh project context (CLAUDE.md / AGENTS.md)"
    prompt: "/agent-instructions capture"
---

Load and follow the installed `triage` skill (`.agents/skills/triage/SKILL.md`)
for $ARGUMENTS, using the active project's copy before a global fallback. Read
only relevant references and execute the supplied task within existing authority.
Preserve the host's provider/model choice and actual tools. Discovery or planning
alone does not authorize installation, external synchronization, publishing, or
new delegated work. Ask only for consequential missing information.
