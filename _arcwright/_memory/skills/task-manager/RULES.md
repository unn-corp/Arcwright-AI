# task-manager — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules

- task-manager is the **durable epic/task registry** — it feeds wave execution; it does NOT replace teams or tracks
- Every task file MUST declare `id`, `goal`, `acceptance_criteria`, `reads`, `writes`, `depends_on`, `conflicts_with`, `status`
- `writes` paths are the sole conflict-detection signal — two tasks sharing any write path go in separate waves
- INDEX.md is the single source of truth for task status; update it atomically with each task file change
- Wave planning: group tasks into conflict-free sets before spawning any Agent; follow claude-subagent-protocol §8 (Wave Planning)
- Default isolation is `none` — omit `isolation` from Agent calls unless the user explicitly opts into worktree mode
- All artifacts written under `_arcwright-output/planning/tasks/` — never `src/`, never `packages/*/src/`
- GitHub sync (`/tasks sync`) is opt-in; degrade silently if `gh` is absent or no git remote
- Use `caveman full` level before writing any task file, INDEX.md update, or wave plan

## Trigger — load this skill when:
- User says "decompose", "break down epic", "task list", "/tasks"
- A SPEC.md or PRD exists and implementation planning is the next step
- User wants parallel execution of work items
- User asks about task status, wave progress, or dependency graph

## Do NOT:
- Replace existing sprint planning (SM agent) or track orchestration
- Auto-spawn agents during `/tasks decompose` — decompose first, execute only on `/tasks run`
- Create tasks with overlapping `writes` in the same wave
- Write to `packages/*/src/` or `.kiro/` — these are build outputs only
