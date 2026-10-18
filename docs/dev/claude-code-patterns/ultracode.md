# Ultracode — Dynamic Workflows

Ultracode is Claude Code's deterministic multi-agent orchestration mode. Claude writes
a JavaScript **workflow script** that a runtime executes in the background, fanning work
out across many subagents while your session stays responsive. The script's results stay
in script variables — not Claude's context window — so a run can coordinate far more work
than a single conversation could hold.

**Last verified:** June 2026 (Claude Code **v2.1.170**).

> Use this for work that is **comprehensive** (decompose and cover in parallel),
> **confident** (independent perspectives + adversarial checks before committing), or
> **larger than one context** (migrations, audits, broad sweeps).

---

## When it triggers

Ultracode only runs when the user has explicitly opted in. Any of:

- The keyword **`ultracode`** appears in the prompt (was `workflow` before v2.1.160).
- Natural-language ask: "use a workflow", "fan out agents", "orchestrate this with subagents".
- `/effort ultracode` — sets ultracode as the session effort level, so Claude plans a
  workflow for **every** substantive task automatically.
- A skill/slash command instructs it, or the user asks to run a saved/named workflow.

For any other task — even one that would benefit from parallelism — Claude does **not**
launch a workflow on its own. It either scouts inline or asks first.

---

## Invocation & management

```bash
ultracode sweep the codebase for N+1 queries and propose fixes   # keyword in a prompt
/effort ultracode                                                # make it the session default
/deep-research <question>                                        # bundled example workflow
/workflows                                                       # view & manage all runs
```

From the `/workflows` view, press **`s`** to save a run's script as a slash command:
`.claude/workflows/<name>.js` (project-shared) or `~/.claude/workflows/<name>.js` (personal).
Saved workflows appear in `/` autocomplete and accept an `args` parameter (read as the
global `args` in the script).

**Disable:** `"disableWorkflows": true` in `settings.json`, or `CLAUDE_CODE_DISABLE_WORKFLOWS=1`
(org admins can disable fleet-wide). A "Workflow keyword trigger" toggle in `/config`
disables just the `ultracode` keyword if it collides with your own usage.

---

## Limits

| Limit | Value |
|-------|-------|
| Agents per run (lifetime) | 1,000 (runaway backstop) |
| Concurrent agents | `min(16, cpu_cores − 2)` — excess queue and run as slots free |
| Items per `parallel()` / `pipeline()` call | 4,096 max (explicit error if exceeded) |
| Mid-run user input | None — only agent permission prompts can pause a run |
| Direct fs/shell from the script | None — only spawned agents touch the filesystem |
| Subagent permission mode | Always `acceptEdits`; inherits your tool allowlist |

File edits inside a run are auto-approved. Shell commands, web fetches, and MCP tools
**not** in your allowlist can still prompt mid-run.

---

## The scripting API

A workflow is plain JavaScript (not TypeScript — no type annotations, interfaces, or
generics). It runs in an async context, so `await` is used directly. Standard built-ins
are available **except** `Date.now()`, `Math.random()`, and argless `new Date()`, which
throw (they would break resume) — pass timestamps in via `args` and stamp results after
the run.

Every script begins with a pure-literal `meta` block:

```js
export const meta = {
  name: 'find-flaky-tests',
  description: 'Find flaky tests and propose fixes',   // shown in the permission dialog
  phases: [                                            // one entry per phase() call
    { title: 'Scan', detail: 'grep test logs for retries' },
    { title: 'Fix',  detail: 'one agent per flaky test' },
  ],
}
// script body below — uses the hooks documented next
```

`meta` must be a literal: no variables, function calls, spreads, or template strings.
Required: `name`, `description`. Optional: `whenToUse`, `phases`, per-phase `model`.

### Hooks available in the script body

| Hook | Purpose |
|------|---------|
| `agent(prompt, opts?)` | Spawn one subagent. Returns its final text, or a validated object when `opts.schema` is set. Returns `null` if skipped or it dies — filter with `.filter(Boolean)`. |
| `pipeline(items, ...stages)` | Run each item through all stages independently, **no barrier** between stages. Item A can be in stage 3 while item B is still in stage 1. The default for multi-stage work. |
| `parallel(thunks)` | Run tasks concurrently and **await all** (a barrier). A failed thunk resolves to `null`, never rejects. |
| `phase(title)` | Start a new phase; later `agent()` calls group under it in the progress display. |
| `log(message)` | Emit a narrator line above the progress tree. |
| `workflow(nameOrRef, args?)` | Run another workflow inline as a sub-step (one level of nesting only). |

**`agent()` options:** `label`, `phase`, `schema` (JSON Schema → forces structured output,
validated with retries), `model`, `effort`, `isolation: 'worktree'` (own git worktree —
use only when agents mutate files in parallel), `agentType` (a custom subagent type).

**Globals:** `args` (the value passed to the workflow, verbatim) and `budget`
(`budget.total`, `budget.spent()`, `budget.remaining()` — the turn's token target; a hard
ceiling once reached).

---

## Patterns

**Pipeline by default** — each stage starts per-item as soon as the prior one finishes:

```js
const DIMENSIONS = [{key: 'bugs', prompt: '...'}, {key: 'perf', prompt: '...'}]
const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, {label: `review:${d.key}`, phase: 'Review', schema: FINDINGS}),
  review => parallel(review.findings.map(f => () =>
    agent(`Adversarially verify: ${f.title}`, {phase: 'Verify', schema: VERDICT})
      .then(v => ({...f, verdict: v}))
  ))
)
const confirmed = results.flat().filter(Boolean).filter(f => f.verdict?.isReal)
```

**Barrier only when stage N needs all of stage N-1** — e.g. dedup before expensive verify:

```js
const all = await parallel(DIMENSIONS.map(d => () => agent(d.prompt, {schema: FINDINGS})))
const deduped = dedupeByFileAndLine(all.filter(Boolean).flatMap(r => r.findings))
const verified = await parallel(deduped.map(f => () => agent(verifyPrompt(f), {schema: VERDICT})))
```

**Loop-until-budget** — scale depth to a `+Nk` token directive (guard on `budget.total`):

```js
const bugs = []
while (budget.total && budget.remaining() > 50_000) {
  const r = await agent('Find bugs in this codebase.', {schema: BUGS})
  bugs.push(...r.bugs)
  log(`${bugs.length} found, ${Math.round(budget.remaining()/1000)}k remaining`)
}
```

Other reusable shapes: **adversarial verify** (N skeptics per finding, kill on majority
refute), **judge panel** (N independent attempts scored and synthesized), **loop-until-dry**
(spawn finders until K rounds return nothing new), **multi-modal sweep** (agents each
searching a different way), **completeness critic** (a final "what's missing?" pass).

---

## Resume

Each invocation persists its script under the session directory and returns a `runId` and
`scriptPath`. To resume after a pause, kill, or edit, relaunch with
`{scriptPath, resumeFromRunId}` — the longest unchanged prefix of `agent()` calls returns
cached results instantly; the first edited/new call and everything after it runs live.
Same script + same args → 100% cache hit. (This is why `Date.now()`/`Math.random()` are
banned — they would break the cache.)

---

## Relevance to Arcwright

On a host that provides Ultracode, it can express a selected multi-stage workflow.
The shapes below are conditional examples; Arcwright's shared protocol and user
authorization still govern delegation. Herdr viewing is optional:

| Arcwright pattern | Ultracode shape |
|-------------------|-----------------|
| Track pipeline (spec → dev → review → QA) | `pipeline(items, ...stages)` |
| Team fan-out (parallel specialists) | `parallel(thunks)` |
| Review-gate loop (`arcwright-review-orchestrator`) | adversarial-verify + loop-until-dry |
| RV / audit track | multi-modal sweep + completeness critic |
| User-selected role models | Use supported per-stage model options only when the task authorizes them |

A workflow run is a single well-scoped fan-out per turn — for multi-phase work, run
several in sequence and read each result before deciding the next phase.

## Related in Arcwright

[Triage](../../../.agents/skills/triage/SKILL.md) can recommend this runtime
only on a host that actually provides it. Follow the shared
[subagent protocol](../../../.agents/skills/subagent-protocol/SKILL.md) for
provider/model inheritance, permissions, and task lifecycle. Arcwright Code
review rounds use fresh app-owned delegated tasks; this Claude-specific API does
not override that rule. Goal workflows are conditional on the installed host.

---

## Sources

- [Orchestrate subagents at scale with dynamic workflows](https://code.claude.com/docs/en/workflows)
- [Introducing dynamic workflows in Claude Code](https://claude.com/blog/introducing-dynamic-workflows-in-claude-code)
- [Claude Code Changelog](https://code.claude.com/docs/en/changelog)
- Workflow tool API surface (authoritative, from the live tool definition)
