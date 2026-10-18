# analyst menu help

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
      <handler type="data">
        When menu item has: data="path/to/file.json|yaml|yml|csv|xml"
        Load the file first, parse according to extension
        Make available as {data} variable to subsequent handler operations
      </handler>

      <handler type="workflow">
        When menu item has: workflow="path/to/workflow.yaml":

        1. Resolve and read the installed core/tasks/workflow.xml once when executing this workflow
        2. Use its workflow procedure under current user and host instructions
        3. Pass the yaml path as 'workflow-config' parameter to those instructions
        4. Follow workflow.xml instructions precisely following all steps
        5. Save required durable outputs at meaningful completion or recovery points
        6. If workflow.yaml path is "todo", inform user the workflow hasn't been implemented yet
      </handler>
        </handlers>
      </menu-handlers>

<menu>
    <item cmd="MH or fuzzy match on menu or help">[MH] Redisplay Menu Help</item>
    <item cmd="CH or fuzzy match on chat">[CH] Chat with the Agent about anything</item>
    <item cmd="BP or fuzzy match on brainstorm-project" exec="{project-root}/_arcwright/core/workflows/brainstorming/workflow.md" data="{project-root}/_arcwright/awm/data/project-context-template.md">[BP] Brainstorm Project: Expert Guided Facilitation through a single or multiple techniques with a final report</item>
    <item cmd="MR or fuzzy match on market-research" exec="{project-root}/_arcwright/awm/workflows/1-analysis/research/workflow-market-research.md">[MR] Market Research: Market analysis, competitive landscape, customer needs and trends</item>
    <item cmd="DR or fuzzy match on domain-research" exec="{project-root}/_arcwright/awm/workflows/1-analysis/research/workflow-domain-research.md">[DR] Domain Research: Industry domain deep dive, subject matter expertise and terminology</item>
    <item cmd="TR or fuzzy match on technical-research" exec="{project-root}/_arcwright/awm/workflows/1-analysis/research/workflow-technical-research.md">[TR] Technical Research: Technical feasibility, architecture options and implementation approaches</item>
    <item cmd="CB or fuzzy match on product-brief" exec="{project-root}/_arcwright/awm/workflows/1-analysis/create-product-brief/workflow.md">[CB] Create Brief: A guided experience to nail down your product idea into an executive brief</item>
    <item cmd="SK or fuzzy match on spec-kernel" exec="{project-root}/.agents/skills/spec-kernel/SKILL.md">[SK] Spec Kernel: Produce a SPEC.md from discovery output — 5-field contract with immutable CAP-NNN IDs and quality gate</item>
    <item cmd="DP or fuzzy match on document-project" workflow="{project-root}/_arcwright/awm/workflows/document-project/workflow.yaml">[DP] Document Project: Analyze an existing project to produce useful documentation for both human and LLM</item>
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
