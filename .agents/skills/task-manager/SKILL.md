---
name: "task-manager"
description: "Use when decomposing an epic or SPEC.md into discrete task files, planning conflict-free parallel waves, tracking execution status, or syncing tasks to GitHub Issues. Complements (never replaces) tracks and team compositions — task-manager is the durable registry that feeds wave execution via claude-subagent-protocol fan-out."
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# task-manager

CCPM-inspired parallel task and epic manager, native to Arcwright's in-process orchestration model. Handles decomposition, wave planning, execution dispatch, and optional GitHub Issues sync.

**Position in the Arcwright stack:**
```
SPEC.md / PRD
    ↓ /tasks decompose
task-manager (durable registry)
    ↓ /tasks run
claude-subagent-protocol fan-out (wave execution)
    ↓ feeds
17 team compositions + tracks (unchanged)
```

---

## 1. When to Load

- User runs `/tasks decompose`, `/tasks status`, `/tasks run`, or `/tasks sync`
- A SPEC.md or PRD exists and the next step is breaking it into executable work items
- Orchestrator needs to plan parallel execution before invoking claude-subagent-protocol §5.2 fan-out

**Pre-output discipline:** Before writing any task file, INDEX.md, or wave plan — invoke `caveman` (`.agents/skills/caveman/SKILL.md`) at `full` level.

---

## 2. Task File Schema

Each task lives at: `_arcwright-output/planning/tasks/T-{NNN}.md`

IDs are permanent and zero-padded (T-001, T-002 …). Never reuse a deleted ID.

```markdown
# T-{NNN} — {short title}

id: T-{NNN}
status: pending | in-progress | done | blocked | skipped
epic: {epic slug or SPEC.md path}
goal: >
  One sentence. What this task achieves, not how.
acceptance_criteria:
  - AC-1: {observable, testable condition}
  - AC-2: …
reads:
  - {path relative to project root}
writes:
  - {path relative to project root}
depends_on:
  - T-{NNN}   # must be `done` before this task starts
conflicts_with:
  - T-{NNN}   # shares a write path — cannot run in same wave
agent: arcwright-{role}   # suggested executor
model: sonnet             # default; propose opus only with user permission
notes: >
  {optional free text — constraints, risks, open questions}
```

**Rules:**
- `writes` is the conflict-detection signal. Two tasks that share any `writes` path MUST appear in separate waves.
- `reads` drives dependency inference: if task B reads a path that task A writes, B depends on A even if `depends_on` is empty — flag this and add the dependency.
- `status` transitions: `pending → in-progress → done`. Side exits: `blocked`, `skipped`.
- Keep `goal` to one sentence. ACs are the verification contract; three or fewer is ideal.

---

## 3. INDEX.md Schema

Registry at: `_arcwright-output/planning/tasks/INDEX.md`

```markdown
# Task Index — {epic slug}

epic: {slug}
spec: {path to SPEC.md or PRD, or "none"}
updated: {YYYY-MM-DD}
total: {N}
done: {N}
in-progress: {N}
pending: {N}
blocked: {N}

## Tasks

| ID | Title | Status | Depends on | Wave | Agent | GH Issue |
|----|-------|--------|------------|------|-------|----------|
| T-001 | {title} | pending | — | W1 | arcwright-dev | #42 |
| T-002 | {title} | pending | T-001 | W2 | arcwright-qa | — |

## Wave Plan

| Wave | Tasks (parallel) | Sequential after |
|------|-----------------|-----------------|
| W1 | T-001, T-003 | — |
| W2 | T-002 | W1 complete |
| W3 | T-004 | W2 complete |

## Dependency Graph

T-001 → T-002 → T-004
T-003 ─────────↗
```

Update INDEX.md atomically whenever any task file's `status` changes.

---

## 4. Command Surface

### 4.1 `/tasks decompose`

**Input:** path to SPEC.md / PRD / epic description (or `$ARGUMENTS`)

**Procedure:**

1. Read the spec. Apply `caveman full` discipline before writing.
2. Extract capabilities (CAP-NNN from spec-kernel) or user stories — each becomes one or more tasks.
3. For each task: create `T-{NNN}.md` with the full schema. Assign `reads` and `writes` from file ownership analysis.
4. Infer `depends_on` from `writes`/`reads` cross-references. Flag inferred dependencies.
5. Flag `conflicts_with` for all tasks sharing any `writes` path.
6. Assign wave numbers (see §5 Wave Planning).
7. Write INDEX.md with complete wave plan and dependency graph.
8. Report summary: N tasks, W waves, max parallelism, any conflicts or ambiguities.

**Do NOT spawn any agents during decompose.** Decompose is a planning step only.

### 4.2 `/tasks status`

**Input:** optional `--epic {slug}` or task ID filter

**Procedure:**

1. Read `INDEX.md`. Read each `T-{NNN}.md` for current status.
2. Diff INDEX.md summary counts against actual task file statuses.
3. If divergence found, update INDEX.md to match task files (task files are authoritative).
4. Output compact status table:

```
Epic: {slug}
Progress: {done}/{total} done | {in-progress} in-progress | {blocked} blocked

Wave W1: T-001 [done], T-003 [done]
Wave W2: T-002 [in-progress] ← current
Wave W3: T-004 [pending]

Blocked: none
Next: complete W2 → run /tasks run to dispatch W3
```

5. If `--epic` not specified and multiple epics exist, list all and prompt.

### 4.3 `/tasks run`

**Input:** optional `--wave {WN}` | `--task {T-NNN}` | `--worktree` (opt-in isolation)

**Procedure:**

1. Read INDEX.md. Identify the next executable wave: the lowest-numbered wave where all tasks are `pending` AND all `depends_on` tasks are `done`.
2. If `--task {T-NNN}` specified, validate that all its `depends_on` are `done`.
3. Read each task file in the wave. Extract: `agent`, `model`, `goal`, `acceptance_criteria`, `reads`, `writes`.
4. Apply claude-subagent-protocol §5.2 (Parallel Fan-Out): emit one Agent tool call per task in a single assistant message.
5. Compose each agent's prompt using the handoff contract (§7 of claude-subagent-protocol):

```
## Task {T-NNN}: {title}

Goal: {goal}

Acceptance criteria:
{acceptance_criteria list}

## Inputs
{reads paths}

## Output
Write to: {writes paths}
Append status update to: _arcwright-output/planning/tasks/T-{NNN}.md (set status: done)
```

6. After all agents return: verify writes paths exist (trust-but-verify per claude-subagent-protocol §9). Update each T-{NNN}.md status and INDEX.md.
7. Report wave results. Prompt: run next wave, pause, or abort.

**Worktree isolation (opt-in):** If `--worktree` flag passed, add `"isolation": "worktree", "baseRef": "head"` to each Agent call. Default is no worktree isolation.

**Model note:** All spawns default to `sonnet`. If any task's `model:` field is `opus`, apply the permission-before-opus gate (claude-subagent-protocol §6.3) before spawning.

**Wave planning integrity check:** Before dispatching, verify no two tasks in the wave share a `writes` path. Abort with a clear error if conflict detected — fix INDEX.md first.

### 4.4 `/tasks sync` (OPTIONAL — GitHub Issues)

**Availability check (graceful degradation):**
```bash
gh --version >/dev/null 2>&1 || { echo "gh CLI not found — sync skipped"; exit 0; }
git remote -v >/dev/null 2>&1 || { echo "no git remote — sync skipped"; exit 0; }
```

If `gh` absent or no remote: print a single line "GitHub sync skipped (gh CLI not available or no remote)" and return. Do not error.

**Procedure:**

1. Read INDEX.md. For each task:
   - If `GH Issue` column is empty → create a GitHub issue.
   - If `GH Issue` has a number → sync status: update issue label and comment.
2. Issue creation:
```bash
gh issue create \
  --title "T-{NNN}: {title}" \
  --body "{goal}\n\n**Acceptance Criteria**\n{ACs}\n\n**Reads:** {reads}\n**Writes:** {writes}\n**Depends on:** {depends_on}" \
  --label "arcwright-task,wave-{WN},{status}"
```
3. Issue labels: `arcwright-task` (always), `wave-W{N}`, `pending|in-progress|done|blocked`.
4. Status update (existing issues):
```bash
gh issue edit {number} --remove-label "pending,in-progress,done,blocked" --add-label "{new_status}"
gh issue comment {number} --body "Status → {new_status} | {YYYY-MM-DD}"
```
5. Write issue number back to `GH Issue` column in INDEX.md.
6. Report: N created, N updated, N skipped.

**Sync is always opt-in.** It never blocks decompose or run. Task files and INDEX.md are the primary source of truth; GitHub is a mirror.

---

## 5. Wave Planning (conflict-free parallel grouping)

Implements claude-subagent-protocol §8 (Wave Planning) applied to task files.

**Algorithm:**

1. Build write-path ownership map: `{path → [task IDs]}`.
2. Build read-after-write edges: if task B reads path P and task A writes P → add `B depends_on A`.
3. Build conflict edges: tasks sharing any write path → `conflicts_with` each other.
4. Topological sort on `depends_on` edges → yields ordered layers.
5. Within each layer, split conflicting tasks into separate sub-waves.
6. Assign wave labels (W1, W2, W3…) in order. Same wave = can run in parallel.

**Max parallelism cap: 5 tasks per wave** (claude-subagent-protocol §8 concurrency rule).

If a layer has more than 5 non-conflicting tasks, split into sub-waves of ≤5.

**Document the wave plan in INDEX.md before dispatching any agent.**

---

## 6. Integration with Existing Arcwright Workflows

task-manager is additive. It does not replace or modify:

- **Team compositions (17 teams)** — teams are ad-hoc multi-role setups; task-manager is the persistent registry feeding them.
- **Tracks (nano/small/compact)** — tracks are single-epic workflows; task-manager sits above them, breaking epics into track-sized chunks.
- **SM agent sprint planning** — SM owns sprint ceremonies; task-manager owns the task file format and wave dispatch. The SM agent MAY call `/tasks decompose` as part of sprint setup.
- **project-memory** — STATE.md / ROADMAP.md continue to track high-level phase state. INDEX.md tracks task-level granularity. Both coexist.

**Recommended flow:**
```
1. /spec-kernel → SPEC.md
2. /tasks decompose SPEC.md → T-001…T-NNN + INDEX.md
3. /tasks status → review wave plan
4. /tasks run → execute W1 (fan-out via claude-subagent-protocol)
5. /tasks status → check W1 complete
6. /tasks run → execute W2
7. repeat until all done
8. /tasks sync → optional GitHub mirror
```

---

## 7. Artifact Paths

| Artifact | Path |
|----------|------|
| Task files | `_arcwright-output/planning/tasks/T-{NNN}.md` |
| Index | `_arcwright-output/planning/tasks/INDEX.md` |
| Agent registry (wave run) | `_arcwright-output/sessions/{session-id}/agent-registry.md` |
| Wave execution notes | `_arcwright-output/planning/tasks/waves/{wave-id}.md` (optional) |

All paths are project-relative. Never write to `src/`, `packages/*/src/`, or `.kiro/`.

---

## 8. Cross-References

- **[`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md)** — §5.2 (parallel fan-out), §6.3 (permission-before-opus), §8 (wave planning + concurrency cap), §9 (trust-but-verify). Load before `/tasks run`.
- **[`spec-kernel`](.agents/skills/spec-kernel/SKILL.md)** — CAP-NNN IDs map 1:1 to tasks during decompose.
- **[`project-memory`](.agents/skills/project-memory/SKILL.md)** — update STATE.md when wave completes; INDEX.md is the task-level complement.
- **[`caveman`](.agents/skills/caveman/SKILL.md)** — `full` level required before all task file writes.
