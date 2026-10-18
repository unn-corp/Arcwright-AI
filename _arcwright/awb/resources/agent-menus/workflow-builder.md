# workflow-builder menu help

Load this reference for help/navigation, an explicit menu command, or workflow
routing that needs a menu mapping. When no actionable task is supplied, display
this menu. Otherwise execute the supplied task directly without loading help.
Resolve resource paths with the shared runtime and keep user/host authorization
in force.

```xml
<menu-handlers>
              <handlers>
          <handler type="exec">
        When menu item or handler has: exec="path/to/file.md":
        1. Read fully and follow the file at that path
        2. Process the complete file and follow all instructions within it
        3. If there is data="some/path/data-foo.md" with the same item, pass that data path to the executed file as context.
      </handler>
        </handlers>
      </menu-handlers>

<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="CH or fuzzy match on chat">[CH] Chat with the Agent about anything</item>
    <item cmd="CW or fuzzy match on create-workflow" exec="{project-root}/_arcwright/awb/workflows/workflow/workflow-create-workflow.md">[CW] Create a new Arcwright workflow with proper structure and best practices</item>
    <item cmd="EW or fuzzy match on edit-workflow" exec="{project-root}/_arcwright/awb/workflows/workflow/workflow-edit-workflow.md">[EW] Edit existing Arcwright workflows while maintaining integrity</item>
    <item cmd="VW or fuzzy match on validate-workflow" exec="{project-root}/_arcwright/awb/workflows/workflow/workflow-validate-workflow.md">[VW] Run validation check on Arcwright workflows against best practices</item>
    <item cmd="MV or fuzzy match on validate-max-parallel-workflow" exec="{project-root}/_arcwright/awb/workflows/workflow/workflow-validate-max-parallel-workflow.md">[MV] Run validation checks in MAX-PARALLEL mode against a workflow (requires a tool that supports Parallel Sub-Processes)</item>
    <item cmd="RW or fuzzy match on convert-or-rework-workflow" exec="{project-root}/_arcwright/awb/workflows/workflow/workflow-rework-workflow.md">[RW] Rework a Workflow to a V6 Compliant Version</item>
    <item cmd="PM or fuzzy match on party-mode" exec="{project-root}/_arcwright/core/workflows/party-mode/workflow.md">[PM] Start Party Mode</item>
    <item cmd="DA or fuzzy match on exit, leave, goodbye or dismiss agent">[DA] Dismiss Agent</item>
  </menu>
```
