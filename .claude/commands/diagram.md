---
description: Generate an Excalidraw diagram from a natural-language description.
---

# /diagram — Generate Excalidraw Diagram

Generate a valid `.excalidraw` JSON diagram from a natural-language description of what to diagram.

## Instructions

1. Load `.agents/skills/excalidraw-diagram-generator/SKILL.md` for the full element schema and generation protocol.
2. Parse `$ARGUMENTS` as a description of the diagram to produce. Examples:
   - "data flow from frontend to API to database"
   - "class hierarchy for the auth module"
   - "user journey: sign up → onboarding → dashboard"
   - "swimlane: PM, Dev, QA — sprint flow"
3. If `$ARGUMENTS` is empty, ask the user: "What would you like to diagram? Describe the structure, flow, or relationships."
4. Follow the skill to construct valid Excalidraw JSON:
   - Choose appropriate diagram type (flowchart, mind map, swimlane, class diagram, DFD, etc.)
   - Build element array with correct IDs, bindings, and groupings
   - Output the complete `.excalidraw` file content
5. Save the file as `diagram-<slug>.excalidraw` in the current directory (or `_arcwright-output/` if it exists), and report the file path.

## Arguments

`$ARGUMENTS` — natural-language description of the diagram to generate. If empty, prompts for input.
