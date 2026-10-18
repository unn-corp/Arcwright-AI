# arcwright-master menu help

Load this reference for help/navigation, an explicit menu command, or workflow
routing that needs a menu mapping. When no actionable task is supplied, display
this menu. Otherwise execute the supplied task directly without loading help.
Resolve resource paths with the shared runtime and keep user/host authorization
in force.

```xml
<menu-handlers>
              <handlers>
        <handler type="action">
      When menu item has: action="#id" → Find prompt with id="id" in current agent XML, follow its content
      When menu item has: action="text" → Follow the text directly as an inline instruction
    </handler>
        </handlers>
      </menu-handlers>

<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="CH or fuzzy match on chat">[CH] Chat with the Agent about anything</item>
    <item cmd="LT or fuzzy match on list-tasks" action="list all tasks from {project-root}/_arcwright/_config/task-manifest.csv">[LT] List Available Tasks</item>
    <item cmd="LW or fuzzy match on list-workflows" action="list all workflows from {project-root}/_arcwright/_config/workflow-manifest.csv">[LW] List Workflows</item>
    <item cmd="PM or fuzzy match on party-mode" exec="{project-root}/_arcwright/core/workflows/party-mode/workflow.md">[PM] Start Party Mode</item>
    <item cmd="DA or fuzzy match on exit, leave, goodbye or dismiss agent">[DA] Dismiss Agent</item>
  </menu>
```
