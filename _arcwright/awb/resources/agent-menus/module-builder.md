# module-builder menu help

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
    <item cmd="PB or fuzzy match on product-brief" exec="{project-root}/_arcwright/awb/workflows/module/workflow-create-module-brief.md">[PB] Create product brief for Arcwright module development</item>
    <item cmd="CM or fuzzy match on create-module" exec="{project-root}/_arcwright/awb/workflows/module/workflow-create-module.md">[CM] Create a complete Arcwright module with agents, workflows, and infrastructure</item>
    <item cmd="EM or fuzzy match on edit-module" exec="{project-root}/_arcwright/awb/workflows/module/workflow-edit-module.md">[EM] Edit existing Arcwright modules while maintaining coherence</item>
    <item cmd="VM or fuzzy match on validate-module" exec="{project-root}/_arcwright/awb/workflows/module/workflow-validate-module.md">[VM] Run compliance check on Arcwright modules against best practices</item>
    <item cmd="PM or fuzzy match on party-mode" exec="{project-root}/_arcwright/core/workflows/party-mode/workflow.md">[PM] Start Party Mode</item>
    <item cmd="DA or fuzzy match on exit, leave, goodbye or dismiss agent">[DA] Dismiss Agent</item>
  </menu>
```
