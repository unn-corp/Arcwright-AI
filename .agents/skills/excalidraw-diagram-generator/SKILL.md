---
name: excalidraw-diagram-generator
description: Create valid Excalidraw JSON diagrams for flows, architecture, relationships, sequences, mind maps, swimlanes, and data models.
---

# Excalidraw diagrams

Infer the diagram type, entities, relationships, and scope from the request. Ask
only when a missing fact changes the diagram. Use the project's existing diagram
style; consult `excalidraw-dark-standard` when that standard applies.

1. Choose the simplest layout that explains the relationships. Group by responsibility
   or stage, keep a clear reading direction, and use short legible labels.
2. Read the element/schema guide below before constructing JSON. Use unique IDs,
   correct shape/text containers, reciprocal arrow bindings, and required defaults.
   Read only examples needed for the chosen diagram type.
3. Produce a complete `.excalidraw` artifact in the user-selected output location,
   or the project's Arcwright output area. Keep the installed skill read-only.
4. Parse the JSON and check IDs, bindings, labels, and layout constraints. Render
   and visually inspect when a renderer is available; report when only structural
   checks ran. Fix clipping, overlaps, and ambiguous connectors.
5. Return the file path with the verification performed. Do not add AI attribution;
   preserve required third-party source/license credits.

Do not reproduce every sample diagram or force an interview when the request
already supplies enough structure. The guides below preserve the full schema,
layout recipes, and examples; load the relevant part only.

## Conditional detail

Load only the guide for the current decision, then any specific reference it names.
Do not preload all guides or repeat their examples in the output.

| Topic | Guide |
| --- | --- |
| Excalidraw Diagram Generator | [guide-00-excalidraw-diagram-generator.md](guide-00-excalidraw-diagram-generator.md) |
| When to Use This Skill | [guide-01-when-to-use-this-skill.md](guide-01-when-to-use-this-skill.md) |
| Prerequisites | [guide-02-prerequisites.md](guide-02-prerequisites.md) |
| Step-by-Step Workflow | [guide-03-step-by-step-workflow.md](guide-03-step-by-step-workflow.md) |
| Best Practices | [guide-04-best-practices.md](guide-04-best-practices.md) |
| Example Prompts and Responses | [guide-05-example-prompts-and-responses.md](guide-05-example-prompts-and-responses.md) |
| Troubleshooting | [guide-06-troubleshooting.md](guide-06-troubleshooting.md) |
| Advanced Techniques | [guide-07-advanced-techniques.md](guide-07-advanced-techniques.md) |
| Output Format | [guide-08-output-format.md](guide-08-output-format.md) |
| Validation Checklist | [guide-09-validation-checklist.md](guide-09-validation-checklist.md) |
| Icon Libraries (Optional Enhancement) | [guide-10-icon-libraries-optional-enhancement.md](guide-10-icon-libraries-optional-enhancement.md) |
| References | [guide-11-references.md](guide-11-references.md) |
| Limitations | [guide-12-limitations.md](guide-12-limitations.md) |
| Future Enhancements | [guide-13-future-enhancements.md](guide-13-future-enhancements.md) |
