---
name: renderdoc-gpu-debug
description: "Capture and inspect native GPU frames with RenderDoc for Vulkan, Direct3D, or OpenGL debugging, pipeline state, pixel history, and render-target export. Not for browser/CSS rendering or web performance."
---

# RenderDoc GPU debugging

Capture and inspect native Vulkan, Direct3D, or OpenGL frames with the installed rdc CLI. Preserve the requested application and use the tool's actual supported commands.

## Essential constraints

- Use this for native GPU captures; inspect rdc doctor and the target graphics API before capture.
- Resolve application assets with the correct working directory and keep captures/exports in project or host evidence storage.
- Open, inspect, and close only owned capture sessions. Limit JSON output and inspect render targets before drawing conclusions.

## Load only the needed topic

Read the relevant recipe below, plus its linked detail when needed. The original
examples and checks remain available without loading every API into the task.

| Topic | Reference |
| --- | --- |
| Overview | [recipe-01-overview.md](references/recipe-01-overview.md) |
| 1. Session Lifecycle | [recipe-02-1-session-lifecycle.md](references/recipe-02-1-session-lifecycle.md) |
| 2. Capture Workflow | [recipe-03-2-capture-workflow.md](references/recipe-03-2-capture-workflow.md) |
| 3. Frame Exploration | [recipe-04-3-frame-exploration.md](references/recipe-04-3-frame-exploration.md) |
| 4. Pipeline State Inspection | [recipe-05-4-pipeline-state-inspection.md](references/recipe-05-4-pipeline-state-inspection.md) |
| 5. Shader Inspection | [recipe-06-5-shader-inspection.md](references/recipe-06-5-shader-inspection.md) |
| 6. Visual Inspection: Export-View-Analyze | [recipe-07-6-visual-inspection-export-view-analyze.md](references/recipe-07-6-visual-inspection-export-view-analyze.md) |
| 7. Pixel Debugging | [recipe-08-7-pixel-debugging.md](references/recipe-08-7-pixel-debugging.md) |
| 8. Shader Edit-Replay | [recipe-09-8-shader-edit-replay.md](references/recipe-09-8-shader-edit-replay.md) |
| 9. Frame Comparison | [recipe-10-9-frame-comparison.md](references/recipe-10-9-frame-comparison.md) |
| 10. Debugging Recipes | [recipe-11-10-debugging-recipes.md](references/recipe-11-10-debugging-recipes.md) |
| 11. Output Size Management | [recipe-12-11-output-size-management.md](references/recipe-12-11-output-size-management.md) |
| 12. Error Handling | [recipe-13-12-error-handling.md](references/recipe-13-12-error-handling.md) |
| Command Reference | [recipe-14-command-reference.md](references/recipe-14-command-reference.md) |
