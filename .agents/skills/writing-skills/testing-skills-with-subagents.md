# Testing Skills With Subagents

Load this reference for a complex behavior change or a rule that must hold under
pressure. Small factual, link, or API-reference edits use the focused validation
in [SKILL.md](SKILL.md); they do not require an agent campaign.

## Choose an observable scenario

Use a realistic request and isolated raw artifacts under the active project’s
`_arcwright/_memory/skill-runs/writing-skills-<run-id>/` directory. Keep the
installed skill read-only and pass an absolute run/report path to evaluators.
Use the separate `_arcwright/_memory/skills/<name>/` area for authored drafts. Define the outcome being
checked: source preserved, task recovered without duplicate work, metadata
retained, or a correctly scoped review. Judge decisions and resulting artifacts,
not whether the response repeats the skill's headings.

Run a baseline before changing behavior where feasible. A baseline may expose a
failure, pass, or be inconclusive. Record what actually happened; do not claim a
failure because the old prose lacked an explicit instruction. Compare the
revised skill on the same task and constraints.

## Delegate with host tools

Discover the native delegation, status, and evidence interfaces. Keep returned
task IDs. Supply the request, skill location, raw artifacts, allowed side effects,
and report path without revealing the intended answer. Use fresh context for
independent evaluation. Arcwright Code/T3 starts each review round with a fresh
`delegate_task`, including previous findings and the repaired source identity;
do not continue it with `childThreadId`.

Do not contact external parties, mutate live systems, publish, or install as a
side effect of a test unless that action was authorized. Do not make the test
pretend that an unsafe external operation is real. Synthetic pressure can be
stated explicitly while the agent performs a realistic local task.

## Inspect the result

Record the prompt, source/skill revision, task ID, output, produced artifacts,
and the checks you ran. For a failure, describe the specific decision and its
consequence. Add guidance addressing that mechanism, then repeat the affected
scenario. If the outcome varies, compare several independent samples and a
no-guidance control; manually inspect any automated matches.

Choose the form that fits the failure: a positive output recipe for structure,
a required template field for omissions, an observable conditional for routing,
or a precise rule for a discipline failure. Avoid accumulating generic bans.

A repaired run validates the exercised scenario; it does not prove universal
compliance. Stop when the actual risk is adequately checked rather than chasing
a claim that a skill is impossible to violate. Report unexercised paths honestly.

The [historical worked example](examples/CLAUDE_MD_TESTING.md) illustrates one
pressure-testing campaign. Its test-specific rules are not requirements to
delete existing work or run the same campaign on every edit.
