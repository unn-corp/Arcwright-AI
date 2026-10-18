# Execution shapes

| Shape | Use when | Coordinator responsibility |
| --- | --- | --- |
| Sequential | A task needs another task's output or writes overlap | Verify the prerequisite and pass its current artifact/source identity |
| Parallel wave | Tasks are independent and ownership is disjoint | Count active tasks against the real host limit and collect every result |
| Read-only panel | Independent lenses inspect one stable change | Pin the source and reconcile duplicate findings before edits |
| Isolated checkout | Independent changes need separate workspaces | Use supported worktree delegation and plan integration explicitly |

Do not dispatch more tasks than the host can run. Queue later waves; splitting a
task does not remove dependencies. Shared checkout writers own disjoint paths and
avoid shared build/install/lockfile operations. Parallel readers need a stable
source snapshot or must report source movement.

Arcwright Code worktrees start from the parent local commit. Either establish an
authorized stable commit, provide accessible patch evidence for read-only review,
or use bounded shared-checkout work. Never claim uncommitted files were copied.

Background delegation is useful when the host exposes status or completion events.
Record IDs and stay responsible for required gates. Use host wait/event tools and
bounded status checks; do not replace missing lifecycle support with top-level
threads, persistent timers, or ad hoc heartbeat files.
