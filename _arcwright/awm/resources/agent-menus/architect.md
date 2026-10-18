# architect menu help

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
    <item cmd="CA or fuzzy match on create-architecture" exec="{project-root}/_arcwright/awm/workflows/3-solutioning/create-architecture/workflow.md">[CA] Create Architecture: Guided Workflow to document technical decisions to keep implementation on track</item>
    <item cmd="IR or fuzzy match on implementation-readiness" exec="{project-root}/_arcwright/awm/workflows/3-solutioning/check-implementation-readiness/workflow.md">[IR] Implementation Readiness: Ensure the PRD, UX, and Architecture and Epics and Stories List are all aligned</item>
    <item cmd="PM or fuzzy match on party-mode" exec="{project-root}/_arcwright/core/workflows/party-mode/workflow.md">[PM] Start Party Mode</item>
    <item cmd="AL or fuzzy match on adversarial-loop">[AL] Adversarial Review Loop: Iterative Review -> Fix cycles (N loops)</item>
    <item cmd="PL or fuzzy match on party-loop">[PL] Party Mode Loop: Iterative Group Review -> Consensus Fix cycles (N loops)</item>
    <!-- Orchestration Commands -->
    <item cmd="NT or fuzzy match on new-task">[NT] New Task: Triage the supplied task, resolve consequential gaps, and route to the appropriate workflow</item>
    <item cmd="VS or fuzzy match on view-session">[VS] View Session: Show current session state and active workflow position</item>
    <item cmd="LK or fuzzy match on lookup">[LK] Lookup: Look up a feedback item or roadmap card by name or ID</item>
    <item cmd="SU or fuzzy match on status-update">[SU] Status Update: Update feedback/roadmap item status in project MCP</item>
    <item cmd="ST or fuzzy match on sprint-status" exec="{project-root}/_arcwright/awm/workflows/4-implementation/sprint-status/workflow.yaml">[ST] Sprint Status: Run sprint status check</item>
    <item cmd="CC or fuzzy match on correct-course" exec="{project-root}/_arcwright/awm/workflows/4-implementation/correct-course/workflow.yaml">[CC] Correct Course: Manage a scope change or blocker mid-sprint</item>
    <item cmd="RC or fuzzy match on refresh-context">[RC] Refresh Context: Refresh missing or changed project context; sync external indexes only when authorized</item>
    <item cmd="SV or fuzzy match on save-session">[SV] Save Session: Save relevant session state; sync external indexes only when authorized</item>
    <item cmd="RS or fuzzy match on resume-session">[RS] Resume Session: Resume a previous session by description, branch, session ID, or date</item>
    <item cmd="XM or fuzzy match on switch-mode">[XM] Switch Mode: Choose a supported direct, delegated, isolated, or team workflow under host permissions</item>
    <item cmd="TM or fuzzy match on prepare-to-merge">[TM] Prepare to Merge: Type-check, build validation, PR description (run at workflow completion)</item>
    <item cmd="RV or fuzzy match on review-track">[RV] Review Track: Target definition → complexity assessment → multi-lens audit → SMALL or LARGE path</item>
    <item cmd="UV or fuzzy match on ui-review">[UV] UI Review: Single-pass design token + component + a11y audit via ui-ux-pro-custom</item>
    <item cmd="UVL or fuzzy match on ui-review-loop">[UVL] UI Review Loop: Use the supplied review budget, fix confirmed findings, and stop when resolved or budget ends</item>
    <item cmd="DRY or SOLID or fuzzy match on dry-solid-review">[DRY] DRY/SOLID Review: Single-pass clean-code-standards audit via architect-agent</item>
    <item cmd="DRYL or fuzzy match on dry-solid-review-loop">[DRYL] DRY/SOLID Loop: Use the supplied review budget, fix confirmed findings, and stop when resolved or budget ends</item>
    <item cmd="SR or fuzzy match on security-review">[SR] Security Review: Single-pass OWASP + data flow security audit</item>
    <item cmd="SRL or fuzzy match on security-review-loop">[SRL] Security Review Loop: Use the supplied review budget to investigate and fix confirmed vulnerabilities</item>
    <item cmd="DA or fuzzy match on exit, leave, goodbye or dismiss agent">[DA] Dismiss Agent</item>
  </menu>
```
