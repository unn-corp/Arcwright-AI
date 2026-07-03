---
name: triage
description: Workflow router — given a task, recommend an execution approach: plain in-process agent(s), an ultracode dynamic workflow, or a /goal loop. Optional herdr opt-in visibility for users who want to watch.
allowed-tools: Read, Grep, Glob, Bash
---

# triage — Workflow Router

**Status: Entry point for new work.** This skill does not score a task against
Arcwright tracks (that system is gone). It routes a task to the right
**execution runtime** for what the user is asking to do.

> Formerly a track-scorer. The track system (nano / small / compact / medium /
> extended / large / rv) was retired in the native-orchestration migration. The
> `/triage` slash command stays; the skill it invokes is now this router.

Always run [`project-context`](../project-context/SKILL.md) first to surface
existing config, plans, and tech stack. The router recommendation depends on
the project shape, not just the task description.

---

## 1. What this skill is

A router. The output is **a recommended execution approach + the exact command
or trigger to run it + a one-sentence rationale**. This skill does not execute
the work itself — the user runs the recommended command.

The four runtime options, in order of capability:

1. **Plain in-process agent(s)** — direct `Agent` tool spawn (single role) or
   parallel fan-out (a small group of disjoint roles). Best for focused,
   well-shaped work that one or two specialists can finish in one go.
2. **`ultracode` dynamic workflow** — Claude Code's multi-agent workflow
   runtime. A JavaScript script fans work out across many subagents while your
   session stays responsive. Best for comprehensive, multi-stage, or
   unknown-size work (migrations, audits, broad sweeps).
3. **`/goal` loop** — autonomous "keep working until this condition is true"
   loop. Best when the completion condition is a verification check, not a
   single deliverable ("all tests pass", "no type errors", "every PR has a
   changelog entry").
4. **herdr opt-in visibility** — *additive* layer on top of (1)–(3). Only when
   the user has explicitly asked to watch the agents and `$HERDR_ENV` is set. The
   pane is a viewing surface, never the spawn mechanism.

> **Default is in-process. herdr is opt-in visibility only.** Per the
> `claude-subagent-protocol` skill, in-process `Agent` tool calls + `SendMessage`
> reuse is the canonical orchestration substrate regardless of which runtime
> the router recommends. See §6 for the cross-link.

---

## 2. The four runtimes

### 2.1 Plain in-process agent(s)

The default. A single `Agent` tool spawn (one role) or a small parallel
fan-out of 2–3 disjoint agents in one assistant message.

**Mechanics.** See `.agents/skills/claude-subagent-protocol/SKILL.md` for the
full protocol (canonical spawn pattern, Session Agent Registry, sonnet-first
default, permission-before-opus). The router's job is to *recommend* this
runtime, not to teach it — the chosen workflow loads the protocol on its own.

**Trigger form (for the user's response):**
> "Spawn `arcwright-dev` to implement the change, then spawn `arcwright-qa` to
> verify. Both `sonnet` by default."

### 2.2 `ultracode` dynamic workflow

A Claude Code primitive that runs a JavaScript orchestration script in the
background, fanning work out across many subagents. The script's results stay
in script variables — not in your context — so a run can coordinate far more
work than a single conversation could hold.

**When to reach for it (versus plain in-process):**

- The work has clear **stages** that can be expressed as a pipeline.
- The work is **comprehensive** and benefits from N independent perspectives
  with adversarial cross-check before committing.
- The work is **larger than one context window** (migrations touching
  hundreds of files, codebase-wide audits).
- The completion condition is **"exhausted"**, not "delivered" (e.g. "find
  every deprecated API call").

**Mechanics.** Trigger with the keyword `ultracode` in the prompt (or set
`/effort ultracode` as the session default). Claude writes the script; the
runtime executes it. From `/workflows` press `s` to save a run as a slash
command (`.claude/workflows/<name>.js`). See
`docs/dev/claude-code-patterns/ultracode.md` for the full API and patterns.

**Trigger form (for the user's response):**
> "Use an ultracode workflow — pipeline through `discover → migrate → verify`
> with an adversarial cross-check between stages."

### 2.3 `/goal` loop

A Claude Code primitive that sets a **completion condition**. Claude works
across turns (with a fast evaluator model checking after each turn) until the
condition is met. One goal per session.

**When to reach for it (versus plain in-process or ultracode):**

- The completion condition is a **verification check** that an evaluator can
  confirm from the conversation ("all 42 unit tests pass", "no ESLint errors",
  "file X contains Y").
- The work is **iterative / open-ended** in duration: you don't know how many
  turns it'll take, but you know when it's done.
- The user can describe the *end state* precisely but not the *path*.

**Important constraint:** the goal condition must be **demonstrable from
Claude's own output** — the evaluator does not run commands. "The CI pipeline
is green" is a bad condition; "all files in `src/auth/` are free of
`@deprecated` JSDoc tags" is a good one.

**Mechanics.** `/goal <condition>` starts the loop. `/goal` alone shows
status. `/goal clear` (or `stop` / `off` / `reset` / `none` / `cancel`) stops
it. See `docs/dev/claude-code-patterns/orchestration.md` for limits, good
condition-writing patterns, and persistence semantics.

**Trigger form (for the user's response):**
> "Run `/goal all files in `packages/api/src/` have no `any` types and pass
> `tsc --noEmit`."

### 2.4 herdr opt-in visibility (additive)

**Do not include this by default.** herdr is *visibility*, not a runtime. The
orchestration still happens in-process inside the session; herdr is just a
viewing surface for it.

**Include it only when ALL of these are true:**

- The user has explicitly asked to "watch" / "see the agents" / "show me in
  panes" (or any equivalent phrasing that opts into visibility).
- `$HERDR_ENV` is set in the current shell (a herdr session is running).
- The recommended runtime (1, 2, or 3) would benefit from pane-by-pane view
  (typical for `ultracode` and `/goal` over a long duration; rare for plain
  in-process over a short one).

**Mechanics.** Load the `herdr` skill, "Watching agents in panes (opt-in)"
section. The pane mirrors the in-process session; the in-process flow inside
the pane is still governed by `claude-subagent-protocol`.

**Trigger form (for the user's response):**
> "Run the ultracode workflow above, with herdr pane visibility enabled so you
> can watch the parallel lanes."

---

## 3. The decision tree

Map the task to a runtime by its shape. This is the canonical heuristic.

| Task shape | Recommended runtime |
|-----------|---------------------|
| 1–3 files, single role, clear deliverable | **Plain in-process agent** (single spawn) |
| 4–10 files, multiple roles, known shape | **Plain in-process agents** (parallel fan-out, 2–3 disjoint roles) |
| 12+ files, multi-stage, dependencies between stages | **`ultracode` dynamic workflow** (pipeline by default) |
| Unknown-size discovery (audits, sweeps, "find every X") | **`ultracode` dynamic workflow** with loop-until-dry or budget-bound loop |
| Completion is a verification check ("tests pass", "no type errors", "lint clean") | **`/goal` loop** |
| User wants to observe agents as they work AND `$HERDR_ENV` is set AND work spans multiple turns | **Add herdr opt-in visibility** to whichever runtime above was chosen |
| Genuinely ambiguous — could be a single change or a sweep; user intent unclear | **Ask one clarifying question** before routing |

### 3.1 Examples (worked)

| User says | Runtime | Why |
|-----------|---------|-----|
| "Add a dark mode toggle to the settings page" | Plain in-process (single `arcwright-dev`) | 1–3 files, single role, clear deliverable |
| "Add SSO via OIDC — backend endpoints, login UI, token refresh, tests" | Plain in-process (parallel fan-out: `arcwright-architect` + `arcwright-dev` for design, then `arcwright-qa` sequentially) | Multiple roles, but the shape is known and the work fits in one session |
| "Migrate all 500+ React class components to hooks" | `ultracode` workflow | 500+ files, multi-stage, larger than one context |
| "Find every place we use the deprecated `foo()` and propose a fix" | `ultracode` workflow with loop-until-dry | Unknown-size discovery — the work is "exhausted", not "delivered" |
| "Get this codebase to pass `tsc --noEmit` cleanly" | `/goal` loop | Completion is a verification check |
| "Make every merged PR this week have a CHANGELOG entry" | `/goal` loop | Open-ended duration, clear end state |
| "Run the migration and let me watch the agents in panes" | `ultracode` workflow + herdr opt-in visibility | User explicitly asked to watch; `$HERDR_ENV` is set |
| "I have a bug in the login flow" | **Out of scope for the router** — load `systematic-debugging` first | The router doesn't triage bugs; debugging is a separate skill |

### 3.2 What if two runtimes both fit?

When the task legitimately fits more than one runtime:

- **Prefer the smaller one.** Plain in-process beats ultracode beats
  long-running `/goal`. The smaller runtime is faster to start, easier to
  inspect, and cheaper to abort.
- **If the user has said "do this thoroughly" / "comprehensively" / "audit
  everything"** — that's a signal to scale up to ultracode even if plain
  in-process would technically work.
- **If the user has said "just make it work" / "fix it" / "ship it"** — that's
  a signal to stay with the smaller runtime even if ultracode would be more
  thorough.

### 3.3 Permission-before-escalation (always)

The router never silently recommends a model upgrade. Default for every
spawned role is `sonnet` (per `claude-subagent-protocol` §6.1). If a
runtime's first spawn might benefit from `opus` (architect sign-off, large
context, security review), the recommendation must say so explicitly, and
the workflow that picks it up must ask the user before spawning opus.

The router's output phrasing: "Default `sonnet`; this task may benefit from
`opus` for the architect step — the workflow will ask before escalating."

---

## 4. Output format

The router returns a short, structured response. The user runs the
recommended command; this skill does not execute the work.

```
Workflow router recommendation:

Runtime:    <plain-agent | ultracode | /goal | [plain-agent + herdr-visibility] etc.>
Trigger:    <the exact command / phrase / spawn description>
Rationale:  <one sentence — why this runtime fits this task shape>
Model:      sonnet (default); opus may help at <step> — workflow will ask.
Next step:  <user runs the trigger above; router does not start it>
```

**Examples (the actual router output, not narrative):**

```
Workflow router recommendation:

Runtime:    plain-agent (single)
Trigger:    Spawn `arcwright-dev` to implement the toggle, then `arcwright-qa` to verify.
Rationale:  1–3 files, single role, clear deliverable.
Model:      sonnet.
Next step:  You: confirm and I'll dispatch the spawn.

```

```
Workflow router recommendation:

Runtime:    ultracode
Trigger:    "ultracode migrate all 500+ class components to hooks; pipeline: discover → migrate → adversarial-verify → report"
Rationale:  500+ files, multi-stage, exceeds one context window.
Model:      sonnet for all stages; opus only if architectural decisions surface.
Next step:  You: send the trigger phrase (or run /goal if you'd rather Claude pick a path).

```

```
Workflow router recommendation:

Runtime:    /goal
Trigger:    `/goal all files in src/auth/ are free of @deprecated JSDoc tags and tsc --noEmit passes`
Rationale:  Completion is a verification check, not a single deliverable.
Model:      sonnet.
Next step:  You: send `/goal` to start the loop.

```

```
Workflow router recommendation:

Runtime:    plain-agent (parallel fan-out) + herdr opt-in visibility
Trigger:    Spawn `arcwright-architect` + `arcwright-ux-designer` in parallel; mirror in herdr panes.
Rationale:  Two disjoint design perspectives; you asked to watch.
Model:      sonnet.
Next step:  Confirm — I'll set up the herdr panes first, then dispatch the fan-out.

```

---

## 5. What this is NOT

Explicit non-goals. If the user is asking for any of these, point them
elsewhere.

| User wants | Where to go |
|------------|-------------|
| Score a task against Arcwright tracks (old system) | Tracks are retired. The router replaces this. |
| A multi-step plan with phases, research, review, QA | `/team` (a pre-built team composition) or the `arcwright-master` orchestrator |
| A specific role to do focused work | Spawn the role directly (e.g. `Agent` with `subagent_type: arcwright-architect`) — the router isn't needed |
| A bug investigation | `systematic-debugging` skill — must run before any fix |
| A codebase audit (security, UX, code quality) | `security-review`, `ux-audit`, or `clean-code-standards` — load the relevant review skill |
| A test run | `arcwright-qa` directly, or `team-dev-qa` if iterative dev+QA is wanted |
| To explore / document an unknown UI, or scaffold a first test from a goal | `browser-use` skill (agentic discovery) — then encode confirmed steps as `playwright-cli` / `.spec.ts`. A natural *discovery stage* inside an ultracode workflow or `/goal` loop. |
| A long-lived process (cron, scheduled task) | `/loop` (intervals within a session) or `/schedule` (Anthropic cloud routines) — both are Claude Code primitives, not Arcwright runtimes |
| A herdr pane / tab / workspace cheat-sheet | `/herdr` — the consolidated herdr skill |
| An explanation of what Arcwright is | `project-context` first, then point at `README.md` |

If the router's recommendation is "spawn role X directly" and the user
agrees, the router's job is done — do not then route them to a team or
ultracode.

---

## 6. Cross-references

- **[`claude-subagent-protocol`](../claude-subagent-protocol/SKILL.md)** — the
  in-process orchestration protocol every runtime (1, 2, 3) uses underneath.
  Load this when actually executing the recommended runtime, not for
  *choosing* it. Defines Session Agent Registry, canonical spawn pattern,
  sonnet-first, permission-before-opus.

- **[`project-context`](../project-context/SKILL.md)** — always run before
  any Arcwright workflow. Surfaces existing config, plans, tech stack. The
  context block it produces influences the router's decision (e.g. "this
  codebase has no tests" pushes "make tests pass" out of `/goal`'s reach).

- **[`herdr`](../herdr/SKILL.md)** — only when the router adds herdr
  opt-in visibility (§2.4). The "Watching agents in panes" section is the
  only relevant part; the rest is general herdr mechanics.

- **[`docs/dev/claude-code-patterns/ultracode.md`](../../../docs/dev/claude-code-patterns/ultracode.md)** —
  full ultracode API: script syntax, hooks (`agent` / `pipeline` / `parallel`
  / `phase` / `log` / `workflow`), limits, resume, patterns (loop-until-dry,
  adversarial verify, judge panel).

- **[`docs/dev/claude-code-patterns/orchestration.md`](../../../docs/dev/claude-code-patterns/orchestration.md)** —
  full `/goal` and `/loop` reference, plus session observability
  (`claude agents`, `claude agents --json`).

- **[`browser-use`](../browser-use/SKILL.md)** — agentic browser exploration.
  When a runtime (ultracode / `/goal` / plain agent) needs a *discovery stage*
  against a live UI — explore an unknown flow, document it, or scaffold a first
  Playwright test from a natural-language goal — that stage uses this skill, then
  hands the confirmed steps to `playwright-cli` for the durable, deterministic run.

- **`/team`** — pre-built team compositions for the common multi-role
  patterns (architect + dev, dev + QA, full-team, etc.). The router may
  point at `/team` when a pre-built team matches the task shape exactly and
  none of (1)/(2)/(3) fit better.

---

## 7. Status and trigger

**Load this skill when:**

- The user invokes `/triage` with a task description.
- A workflow (team, master orchestrator) needs to decide which execution
  approach to dispatch to.
- The user asks "how should I approach this?" / "what's the best way to do
  X?" / "should I use a workflow?".

**Do NOT load this skill when:**

- The user has named a runtime explicitly ("run an ultracode for this",
  "set up a /goal loop for X") — just run that runtime.
- The user has named a role explicitly ("ask the architect") — just spawn
  the role.
- The user is asking for a bug fix — `systematic-debugging` is the entry
  point, not the router.
- The user is asking for a review — the relevant review skill is the entry
  point.

**Two-line mental model:**

- Plain in-process for "I know what to do, just do it."
- `ultracode` for "I know the shape, it's just big."
- `/goal` for "I know the end state, find the path."
- herdr opt-in when "I want to watch."
