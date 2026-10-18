# agent-builder menu help

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
    <item cmd="CA or fuzzy match on create-agent" exec="{project-root}/_arcwright/awb/workflows/agent/workflow-create-agent.md">[CA] Create a new Arcwright agent with best practices and compliance</item>
    <item cmd="EA or fuzzy match on edit-agent" exec="{project-root}/_arcwright/awb/workflows/agent/workflow-edit-agent.md">[EA] Edit existing Arcwright agents while maintaining compliance</item>
    <item cmd="VA or fuzzy match on validate-agent" exec="{project-root}/_arcwright/awb/workflows/agent/workflow-validate-agent.md">[VA] Validate existing Arcwright agents and offer to improve deficiencies</item>
    <item cmd="PM or fuzzy match on party-mode" exec="{project-root}/_arcwright/core/workflows/party-mode/workflow.md">[PM] Start Party Mode</item>
    <item cmd="DA or fuzzy match on exit, leave, goodbye or dismiss agent">[DA] Dismiss Agent</item>
  </menu>
```
