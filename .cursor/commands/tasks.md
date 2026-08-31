# /tasks — Parallel Task Manager

Decompose, plan, execute, and track discrete work items with CCPM-inspired parallel wave execution. Feeds the Arcwright in-process Agent fan-out model. Complements teams and tracks — it is the durable registry above them.

## Instructions

1. Load `.agents/skills/task-manager/SKILL.md` for the complete procedure.
2. Load `.agents/skills/caveman/SKILL.md` (`full` level) before writing any task file or INDEX.md.
3. Determine subcommand from `the user's command input`:

| Subcommand | What it does |
|------------|-------------|
| `decompose [spec-path]` | Break a SPEC.md/PRD/epic into task files + INDEX.md with wave plan |
| `status [--epic slug]` | Show current task/wave progress |
| `run [--wave WN] [--task T-NNN] [--worktree]` | Execute next (or named) wave via Agent fan-out |
| `sync` | Mirror tasks to GitHub Issues (opt-in, degrades if gh absent) |

4. If `the user's command input` is empty, show the subcommand table above and ask which to run.

## Subcommand Details

### decompose

- Input: path to SPEC.md, PRD.md, or plain description (inline or file path).
- Output: `_arcwright-output/planning/tasks/T-{NNN}.md` per task + `INDEX.md`.
- Wave plan embedded in INDEX.md before any agents are spawned.
- Do NOT dispatch any agents. Planning only.

### status

- Reads INDEX.md + each T-{NNN}.md. Diffs counts. Prints compact wave table.
- Flags blocked tasks and missing dependencies.

### run

- Loads claude-subagent-protocol skill before spawning.
- Identifies next executable wave (all `depends_on` done, tasks still `pending`).
- Emits one Agent call per task in the wave (single assistant message = parallel).
- Verifies `writes` paths after agents return (trust-but-verify).
- Updates task statuses and INDEX.md after wave completes.
- Default: `sonnet`. Ask before escalating any task's model to opus.
- Worktree isolation: only if `--worktree` flag passed explicitly.

### sync

- Graceful degradation: silently skips if `gh` CLI absent or no git remote.
- Creates one GitHub issue per unmapped task; updates labels/comments for existing.
- Writes issue numbers back to INDEX.md `GH Issue` column.

## Arguments

`the user's command input` — subcommand + optional flags. Examples:
- `decompose _arcwright-output/planning/SPEC.md`
- `status --epic auth`
- `run --wave W2`
- `run --task T-005 --worktree`
- `sync`
