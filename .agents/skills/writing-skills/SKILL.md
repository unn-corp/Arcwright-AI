---
name: writing-skills
description: Use when creating or updating an agent skill, or checking that its instructions and bundled tools work for the intended task.
---

# Writing Skills

## Arcwright output location

Treat this installed skill bundle as read-only during execution. Resolve the active project and put all workflow notes, reports, logs, snapshots, fixtures, and other generated artifacts in a unique `<project-root>/_arcwright/_memory/skill-runs/writing-skills-<run-id>/` directory. Never use the directory containing this skill as a working/output directory. Keep authorized application source edits in their requested paths. Follow the shared [runtime storage contract](../SOURCES-SUPERPOWERS.md), including host-managed evidence references.


Write reusable guidance that changes an agent's decisions in the intended task.
Keep Arcwright conventions and the user's chosen workflow. Match validation to
what changed: a corrected reference and a new orchestration procedure need
different evidence.

## Start from the task

Author new skill drafts under `<project-root>/_arcwright/_memory/skills/<name>/`.
Use the separate Arcwright run directory for evaluations and generated resources.
An explicit request to maintain a particular skill permits its source edit;
ordinary execution never edits its own installed bundle.

Read the existing skill, its callers, and relevant references. Preserve useful
customizations and supported metadata. Identify the observed failure or concrete
capability the edit should address; do not add rules for hypothetical problems.
For behavior changes, capture the current outcome before editing when feasible.
A passing baseline is useful evidence too; do not invent a failure.

Keep existing authorization in force. Writing a skill does not authorize a push,
publication, installation, external message, or production operation. Complete
already-authorized edits without requesting the same permission again.

## Structure and discovery

A skill requires `SKILL.md`, with YAML frontmatter followed by Markdown:

```text
skill-name/
  SKILL.md             Required entrypoint
  RULES.md             Arcwright compact sidecar when useful for proactive loading
  references/          Conditional detail, if needed
  scripts/             Reusable helpers, if needed
  assets/              Output resources, if needed
```

Preserve the Arcwright `RULES.md` convention for skills likely to load
proactively: distilled rules and triggers, no long examples, normally under
400 tokens. Do not add a redundant sidecar when the whole skill is already small.
Update an existing sidecar when a changed rule would otherwise contradict it.

Use the [Agent Skills specification](https://agentskills.io/specification) for
frontmatter:

| Field | Requirement |
|---|---|
| `name` | Required; 1–64 lowercase letters, digits, and hyphens; match the directory; no leading, trailing, or consecutive hyphens |
| `description` | Required; 1–1024 characters describing the capability and triggering context |
| `license` | Optional license identifier or reference to bundled terms |
| `compatibility` | Optional environment requirements, up to 500 characters |
| `metadata` | Optional map of string keys to string values |
| `allowed-tools` | Optional experimental tool permissions; support varies by host |

The limits apply to individual fields, not the combined frontmatter. Preserve
valid optional fields, including existing metadata and host-specific invocation
policy; do not strip them to fit a two-field template. A tool allowlist does not
grant authority beyond the current task and host policy.

A description should make selection easy: name the real capability, relevant
symptoms, and any boundary that prevents likely misrouting. Keep procedural
steps in the body so a description does not substitute for reading the skill.
Do not attract unrelated tasks by listing every adjacent capability.

Put essential constraints and routing in `SKILL.md`. Keep details in discoverable
references with relative Markdown links. Reference another installed skill only
when it is useful and available; otherwise state the needed procedure locally.
Avoid force-loading references or inventing unavailable skill namespaces.

Keep the initial load focused on decisions, constraints, and verification. Move
schemas, long examples, stack-specific recipes, and historical explanations into
conditional topic guides. Select from catalog metadata; do not preload every
matching library or repeat a full catalog in always-loaded agent instructions.

Arcwright's current policy enables model invocation for shipped skills and command
routes. Do not introduce `disable-model-invocation: true` or
`policy.allow_implicit_invocation: false` without a new user requirement to restrict
invocation. `user-invocable: false` controls menu visibility and can coexist with
model invocation. Preserve authorization requirements inside the procedure:
automatic selection does not authorize merging, publishing, or other external work.

## Choose the guidance form

| Observed problem | Useful form |
|---|---|
| Agent skips a necessary rule under pressure | Specific requirement, rationale, and a realistic counterexample |
| Output has the wrong structure | Positive recipe or output contract with the needed parts in order |
| A required element is omitted | An explicit field or slot in the template being filled |
| Behavior depends on a condition | A conditional tied to an observable fact |
| A factual/API reference is wrong | Corrected reference and a focused retrieval or usage check |

Prefer one concrete example to repeated prohibitions. Record exact requirements
without turning a past example or optional preference into a universal rule.
For important exceptions, state the observable condition and what to do then.

## Tools and runtime adaptation

Use the host's available file, task, delegation, browser, and evidence tools.
Discover callable names and capabilities; do not assume a Claude-only todo or
subagent API. Arcwright Code/T3 review rounds use a fresh `delegate_task` with the
prior findings and current evidence, without `childThreadId` continuation. Keep
returned task IDs so resumed work can reconcile existing tasks before starting
new ones. Follow the host's orchestration and model-selection policy.

Invoke bundled scripts by interpreter (use `bash` for shell scripts or
`node render-graphs.js` for the renderer), since packaging can strip executable bits. Run changed
helpers in an isolated fixture under the Arcwright run, including a meaningful failure path. Prefer
argument-based process invocation over shell command construction.

Use diagrams for decisions and loops that are clearer visually. Prefer tables
for mappings and prose or lists for linear instructions. For Graphviz conventions,
see [graphviz-conventions.dot](graphviz-conventions.dot). Read the skill source
in place and render it into the active project's Arcwright run area:

```bash
node "/installed/writing-skills/render-graphs.js" "/installed/target-skill" --project-root "/path/to/project"
node "/installed/writing-skills/render-graphs.js" "/installed/target-skill" --project-root "/path/to/project" --combine
```

The renderer requires Graphviz `dot` on PATH. It creates a unique
`_arcwright/_memory/skill-runs/writing-skills-<id>/diagrams/` directory inside the
selected project, leaving the input skill untouched. An optional `--output-dir`
may choose a path under that same run area (relative paths resolve from the
project root). It rejects paths outside that area, symlink redirects, and
existing artifact files. Run from the project or pass `--project-root`; never
change into the installed skill to run it. Omitting the project flag is supported
only from a current directory with an existing Arcwright/Git marker; the helper
does not infer a project from parent folders.

## Validate proportionally

| Change | Appropriate evidence |
|---|---|
| Typo, link, API detail, or small reference correction | Verify the primary source, frontmatter/links, and a focused usage example where needed |
| Bundled script | Reproduce the defect before the fix, then check affected behavior and a relevant failure case |
| New routing, permissions, delegation, or recovery rules | A realistic independent scenario in an isolated fixture, when delegation is available and authorized |
| Rule meant to resist pressure | Baseline and revised scenarios with the same pressures; inspect actual decisions and artifacts |

Ordinary reference edits do not require a subagent or an artificial pressure
campaign. Do not delete useful work merely because no failing agent run exists.
For a complex behavior change, an independent run adds confidence; a text review
alone is not evidence that the agent followed the procedure. Where execution is
unavailable, report the limitation and the checks actually performed.

For pressure-testing details, load
[testing-skills-with-subagents.md](testing-skills-with-subagents.md) only when
that kind of behavioral check is warranted. Controlled wording comparisons can
help with a recurring behavior problem; compare against a no-guidance control
and inspect outputs manually. Repeated samples are useful when results vary,
not a requirement for every skill edit.

For additional authoring examples, consult
[anthropic-best-practices.md](anthropic-best-practices.md) as reference. Its
platform-specific examples do not override the current host or task.
[persuasion-principles.md](persuasion-principles.md) provides background for
discipline rules, not a reason to add ceremony to reference work.

## Completion check

- Confirm the skill still addresses the user's intended task and preserves valid metadata.
- Check relative links, frontmatter, and consistency with any `RULES.md` sidecar.
- Run changed helpers and the behavioral checks justified by the change.
- Record what changed, evidence, remaining limits, source/license, and local adaptations.
- Commit, push, publish, or install only when authorized for the current task;
  skill editing by itself does not commission those actions.
