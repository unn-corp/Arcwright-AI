# Agent Session: {{session_id}}
<!-- Fill all {{placeholders}} on creation. Do not leave unfilled placeholders in an active session. -->

## Context
| Field | Value |
|-------|-------|
| **Session ID** | `{{session_id}}` |
| **Created** | {{iso_timestamp}} |
| **Creator** | {{creator_role}} (pane `{{creator_pane_id}}`) |
| **Project Root** | `{{project_root}}` |
| **Branch** | `{{git_branch}}` |
| **Base Branch** | `{{base_branch}}` |
| **Track** | {{track}} <!-- Nano / Small / Compact / Medium / Extended / Large / Review / General --> |
| **Execution Mode** | {{execution_mode}} <!-- inline / command-blocks / scripts / agent-teams --> |
| **Session File** | `{{session_file_path}}` |

## Git Snapshot
<!-- Captured at session start. Refresh with `git status` if session runs long. -->

**Uncommitted files:**
```
{{git_status_output}}
```

**Recent commits (last 5):**
```
{{git_log_output}}
```

**Diff summary (base..HEAD):**
```
{{git_diff_stat}}
```

---

## Track Progress
<!-- Master agent updates this at the START of each step and marks done when complete. -->
<!-- Step status: ⬜ pending · 🔄 in-progress · ✅ done · ⛔ blocked · ⏭ skipped -->

**Current Step:** {{current_step_name}} ({{current_step_number, or 1 if General track}} / {{total_steps, or ? if General track}})

| # | Step | Status | Started | Notes |
|---|------|--------|---------|-------|
<!-- Master fills this table as the track runs. One row per step. -->
<!-- Example: | 1 | Target Definition | ✅ done | 14:02 | Targeted depth, branch feature/x | -->

---

## Active Agents
<!-- Register on startup. Update Status as work progresses. -->

| Pane ID | Role | Status | CWD | Claude Session ID |
|---------|------|--------|-----|-------------------|
| {{creator_pane_id}} | {{creator_role}} | active | `{{project_root}}` | — |

**Status values:** `active` · `busy` · `idle` · `ready-to-close` · `closed`

---

## Pane Lifecycle
<!-- Coordinator checks after every task. Close any pane showing `ready-to-close`. -->

| Pane ID | Role | Task | Status | Agent ✓ | Coord ✓ |
|---------|------|------|--------|---------|---------|
<!-- Agent ✓ columns: rb=report-back · sid=session-id · done=task-done -->
<!-- Coord ✓ columns: exit=/exit sent · kill=kill-pane · closed=status updated · rebal=layout rebalanced -->

---

## Tasks
<!-- Format: ### TASK-NNN · {status} · {assigned_role} -->
<!-- Status values: pending · in-progress · blocked · done -->

<!-- Add tasks below. Example:
### TASK-001 · pending · dev
- **Description:** Fix the user profile API endpoint
- **Status:** pending
- **Acceptance:** API returns 200 with correct user data
-->

---

## Decisions & Notes
<!-- Running log of decisions made during this session. Append, never overwrite. -->

- `{{iso_timestamp}}` — Session created. Branch: `{{git_branch}}`.

---

## Blockers
<!-- Items requiring user input before work can continue. -->

<!-- | ID | Description | Needs | Since | -->
