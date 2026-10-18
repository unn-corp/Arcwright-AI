# Native host adapters

Use the shared [delegation protocol](../../subagent-protocol/SKILL.md). These
workflow adapters do not imply a tool, role, provider, or model is installed.

## Arcwright Code / T3

- Use native delegation/status tools. Keep skill-owned ledgers, reports, and
  snapshots under the active project’s `_arcwright/_memory/skill-runs/` run.
  Record paths/IDs for captures/results stored by the host in its mandatory
  conversation evidence directory; those host-managed files do not relocate
  the workflow’s own output area.
- Record each returned task ID beside its plan task, role,
  round, source identity, and report path.
- Apply the shared protocol's fresh-task review rule to spec, quality, final,
  and scoped re-review gates. Pass this workflow's source package and ledger.

## Kiro CLI

When the native `subagent` tool is available, inspect its current schema and the
installed `.kiro/agents/` configurations. Preserve the existing implementer →
spec review → quality review sequence. Role names below are examples that must
resolve to real local configurations.

```json
{
  "task": "Implement Task N",
  "stages": [{
    "name": "implement",
    "role": "arcwright-dev",
    "prompt_template": "Read [task brief]; work only in [scope]; baseline [identity]; write report to [absolute Arcwright run path]."
  }]
}
```

Read the implementer report and capture its exact source before dispatching
review. A review dispatch can use the installed `arcwright-qa` role for spec
compliance, followed by `arcwright-architect` for quality after spec passes.
Where the tool supports dependency stages, use `depends_on` to enforce order;
never pre-approve quality on an unknown future source. Capture stage/task IDs
and reports using the host's status/summary interface.

If a review finds issues, start a fix dispatch and then a new scoped review
round. Do not assume a DAG automatically loops, shares context, or validates the
repaired source. Stages without dependencies can run concurrently, so avoid
multiple writers to the same files.

## Other hosts or inline work

Map the same task ownership, evidence, and two review gates to tools actually
available. Use ordinary file reports when a task service is absent. When an
independent delegate cannot be run, state that limitation and perform the useful
local checks; do not fabricate independent review approval or claim all gates
passed. Honor a user-selected inline workflow instead of forcing delegation.
