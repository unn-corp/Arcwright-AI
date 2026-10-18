# review-orchestrator menu help

Load this reference for help/navigation, an explicit menu command, or workflow
routing that needs a menu mapping. When no actionable task is supplied, display
this menu. Otherwise execute the supplied task directly without loading help.
Resolve resource paths with the shared runtime and keep user/host authorization
in force.

```xml
<menu-handlers>
        <handlers>
          <handler type="exec">
            When menu item has exec="path/to/file.md":
            1. Read fully and follow the file at that path
            2. Process the complete file and follow all instructions within it
          </handler>
          <handler type="cmd">
            RO-FULL: Execute the requested full or concurrent review cycle below.
            RO-AR: Obtain an independent architecture/adversarial review with the agreed lens.
            RO-PMR: Obtain the selected party-mode/UX review; use a UX lens only for relevant UI scope.
            RO-FIX: Route confirmed findings to the assigned implementation owner within authorization, then verify the affected behavior.
            RO-STATUS: Report retained cycle state and actual child results.
            RO-VERDICT: Return the consolidated verdict and persist it only when requested or required by the workflow.
            EXIT: Retain needed recovery state and return through the host completion channel.
          </handler>
        </handlers>
      </menu-handlers>

<menu>
      <item n="1" cmd="RO-FULL">Run full review cycle: AR → fix if needed → PMR → emit verdict</item>
      <item n="2" cmd="RO-AR">Spawn AR sub-agent (architect lens) for code/spec review only</item>
      <item n="3" cmd="RO-PMR">Spawn PMR sub-agent (party mode / ux lens) for review only</item>
      <item n="4" cmd="RO-FIX">Spawn fix sub-agent (dev) to apply findings from last AR pass</item>
      <item n="5" cmd="RO-STATUS">Show current cycle state and sub-agent results</item>
      <item n="6" cmd="RO-VERDICT">Emit final verdict block to spawner and write to review-verdict-{step}.md</item>
      <item n="7" cmd="EXIT">Exit Review Orchestrator</item>
    </menu>
```
