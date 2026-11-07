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
            VF: Directly verify stated goals through L1-L4; missing proof is incomplete.
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
      <item cmd="VF">Verify goals directly through existence, substance, wiring and real data flow</item>
      <item n="1" cmd="RO-FULL">Run full review cycle: direct review, required verification and selected lanes</item>
      <item n="2" cmd="RO-AR">Perform assigned architecture/adversarial review; add independent lenses only when authorized</item>
      <item n="3" cmd="RO-PMR">Perform the selected review lens; delegate only when authorized</item>
      <item n="4" cmd="RO-FIX">Route confirmed fixes to the owned backend or UI slice</item>
      <item n="5" cmd="RO-STATUS">Show current cycle state and sub-agent results</item>
      <item n="6" cmd="RO-VERDICT">Emit final verdict block to spawner and write to review-verdict-{step}.md</item>
      <item n="7" cmd="EXIT">Exit Review Orchestrator</item>
    </menu>
```
