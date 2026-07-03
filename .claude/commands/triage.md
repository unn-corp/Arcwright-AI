---
description: Recommend an execution approach for the user's task — plain in-process agent(s), an ultracode dynamic workflow, a /goal loop, or a herdr opt-in visible run.
handoffs:
  - label: "Refresh project context (CLAUDE.md / AGENTS.md)"
    prompt: "/claude-md capture"
---

# /triage — Workflow Router

Use the `triage` skill (workflow-router) to recommend an execution approach
for the user's task: plain in-process agent(s), an `ultracode` dynamic
workflow, a `/goal` loop, or (opt-in) a herdr-visible run. Output a
recommendation + the exact trigger + a one-sentence rationale. The router
does not start the work — you do.

## Steps

1. Load `.agents/skills/triage/SKILL.md` (full heuristic and output format).
2. Run `project-context` first; the recommendation depends on the project.
3. Parse `$ARGUMENTS` as the task. If empty, ask the user for one.
4. Apply the decision tree; if ambiguous, ask **one** clarifying question.
5. Output the structured recommendation (Runtime / Trigger / Rationale /
   Model / Next step). Do **not** start the workflow — the user runs the
   trigger. Default `sonnet`; never silently recommend `opus`.
