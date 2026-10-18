# verifier menu help

Load this reference for help/navigation, an explicit menu command, or workflow
routing that needs a menu mapping. When no actionable task is supplied, display
this menu. Otherwise execute the supplied task directly without loading help.
Resolve resource paths with the shared runtime and keep user/host authorization
in force.

```xml
<menu-handlers>
              <handlers>
          <handler type="exec">
        When menu item has: exec="path/to/file":
        1. Read the complete file at the given path
        2. Follow its instructions precisely as a procedure
      </handler>
        </handlers>
      </menu-handlers>

<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="CH or fuzzy match on chat">[CH] Chat with the Agent about anything</item>
    <item cmd="VF or fuzzy match on verify">[VF] Verify: Run goal-backward-verify (L1→L4) against the target implementation and return a VERIFICATION verdict</item>
    <item cmd="GG or fuzzy match on gather-goals">[GG] Gather Goals: Extract the stated goals/capabilities from the spec or task brief before verifying</item>
    <item cmd="RP or fuzzy match on report">[RP] Report: Persist the concise VERIFICATION report in the assigned Arcwright run or host evidence storage</item>
    <item cmd="CC or fuzzy match on correct-course">[CC] Correct Course: Route a goal-level FAIL to /correct-course when the goal itself shifted</item>
    <item cmd="DA or fuzzy match on exit, leave, goodbye or dismiss agent">[DA] Dismiss Agent</item>
  </menu>
```
