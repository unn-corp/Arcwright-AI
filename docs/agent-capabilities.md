# Agent capability discovery

Shared project instructions are authored in `AGENTS.md`; required host files
import them. Agent activation does not introduce another instruction convention.

## One delegation protocol

| Surface | Responsibility |
| --- | --- |
| `subagent-protocol` | Canonical lifecycle: tool/model discovery, handoffs, IDs, concurrency, custody, result verification |
| `claude-subagent-protocol` | Compatibility alias forwarding to the canonical skill |
| Team presets, `review-loop`, `subagent-driven-development` | Task stages, role topology, review loops, and completion gates built on that lifecycle |
| `strands-multi-agent-patterns` | Design guidance for applications built with that SDK, rather than Arcwright's own dispatch lifecycle |

Do not copy delegation mechanics into a preset or profile. Link the shared
protocol and add only the workflow's distinct requirements.

Every Arcwright profile uses the shared agent runtime. A delegated task carries a
small capability brief alongside its scope, acceptance criteria, file ownership,
budget, relevant evidence, and tool limitations. Suggestions help the specialist
start; they do not restrict which installed skills it can use or grant additional
authorization.

## Produce a brief

From the active project, run the helper in the effective installed `arcwright`
skill. The same interface works in the workshop and in global-only installations:

```bash
node ".agents/skills/arcwright/scripts/agent-capabilities.cjs" --role arcwright-qa --task "Verify the browser regression"
```

Use the actual installed helper path for a global install. `--role` accepts a
profile filename slug or its `arcwright-` prefixed route name. `--task` is optional
text used only for relevance matching. Pass dynamic values as argument data
through the host process tool; never interpolate task text into executable shell
commands. Unknown roles and flags produce a nonzero exit status.

The JSON brief contains:

| Field | Meaning |
|---|---|
| `role` | Canonical profile slug |
| `profilePath` | Actual local or global profile path; `null` when unavailable |
| `suggestions` | At most four relevant installed skills with descriptions and actual `SKILL.md` paths |
| `conditional` | Relevant suggestions that are missing or locally restricted, including their optional module when known |
| `discovery` | Finder, catalog, registry, and effective skill-scope paths |
| `nonexclusive` | Always `true`; another relevant installed skill may be discovered and used |

For the QA/browser example, the suggestions are `test-quality` and
`playwright-cli`. Rust, Swift, Electron, Tauri, and Vitest guidance appears only
when the supplied task makes it relevant. Missing optional suggestions do not
block an otherwise achievable task and are never installed automatically.

The helper only discovers files. The caller separately reports actual host tools,
provider/model selection, unavailable capabilities, and permissions. A present
browser skill does not establish that browser automation is available.

## Conditional menu help

Profiles keep role instructions and task activation inline. Their `<menu src="..."/>`
points to a per-role help file under the module's `resources/agent-menus/`, resolved
relative to the actual profile. Read it for navigation, an explicit menu command,
needed workflow routing, or help when there is no actionable task. Supplied tasks
execute directly without preloading menus or handlers.

All existing command IDs and workflow/resource mappings remain available. The dev
menu's `RL` explicitly invokes `review-loop`, including its initial model choice;
story and code-review workflows retain their own review stages.

## Invoke the selected skill

Use a native matching skill when available. Otherwise read the returned
`resolvedPath` and follow that `SKILL.md` directly; no native `Skill` API or slash
command is required. Read only the references needed for the current decision.

Handoff packets can retain the brief as JSON or its compact equivalent: role,
selected skill names and paths, finder location, relevant missing capabilities,
and current constraints. Do not inject the entire skill catalog or load every
suggestion before deciding whether it is needed. Reuse an existing brief until
the task, project, or installed capabilities change.

For additional discovery, pass a short task to `find-entrypoint.cjs`. Explicit
command routing retains command precedence; capability hints deliberately resolve
skill entrypoints directly rather than executing a same-named command wrapper.
The finder can search catalog metadata without loading all skill procedures.

## Role suggestions

The maintained registry is
[agent-capabilities.json](../.agents/skills/arcwright/agent-capabilities.json).
It covers all 16 core profile slugs and selects additional hints by task.
An optional private organization pack adds its own capability entries during install:

| Role | Starting guidance or relevant conditional hints |
|---|---|
| `arcwright-master` | Triage, context, dependencies, handoff |
| `analyst` | Context, requirements, skill research |
| `pm` | Requirements, task planning, consequential scope changes |
| `sm` | Dependencies, stories, handoff, replanning |
| `architect` | Context, architecture, security, measured Rust performance |
| `dev` | Relevant context, regression tests, debugging, CI, installed platform testing |
| `quick-flow-solo-dev` | Scope discipline, focused tests, debugging |
| `qa` | Useful tests, relevant runner, failure diagnosis |
| `verifier` | Acceptance evidence, tests, browser or security checks |
| `review-orchestrator` | Relevant acceptance, testing, security, architecture, UX, or Rust lens |
| `ux-designer` | UI design, frontend taste, visual verification, usability |
| `tech-writer` | Relevant context, agent documentation, design documentation, handoff |
| `agent-builder` | Agent constraints, skill authoring, evaluation, adversarial assessment |
| `workflow-builder` | Procedure constraints, authoring, evaluation, dependencies |
| `module-builder` | Skill authoring, agent/workflow constraints, evaluation |
| `aws-infra` | Installed AWS/CDK guidance and relevant service/security checks |

Selecting a role or hint preserves existing authorization. In particular,
optional organization packs do not authorize ordinary coding to access a tracker.
Security team presets use `review-orchestrator` with the security
lens in the task, rather than an invented security profile.

## Resolution and local customizations

The active project's matching host skill directory and `.agents/skills` take
precedence over the router's installed sibling skills. Global-only skills remain
at their installed paths. Profile lookup likewise prefers the active project and
falls back to the global Arcwright module tree. Optional module gates and missing
files are checked before suggesting a catalog entry.

Descriptions are read from the effective skill, including a project override.
Reviewed pure aliases can resolve to their canonical skill; customized aliases
retain their authored steps. A locally restricted skill is reported as
unavailable instead of bypassing its policy through a global copy. The helper
writes no cache, catalog, or runtime artifact into an installed bundle.

## Maintenance checks

`node build/invocation.js --audit` and
`node build/skill-efficiency.js --check` include capability wiring checks. They
flag profile/registry drift, invalid or missing source hints, restrictive role
registries, lost shared discovery wiring, fixed provider defaults in operative
agent/team instructions, and compulsory repeated full-suite passes.

The capability fixtures exercise global fallback, project overrides, direct
invocation without a native Skill tool, missing optional skills, local invocation
policy, argument safety, and drift detection. These tests verify discovery and
instruction wiring; they do not establish that every delegated model will always
select the right skill. Host catalog behavior, runtime tools, and actual task
results still require observation when those surfaces change.
