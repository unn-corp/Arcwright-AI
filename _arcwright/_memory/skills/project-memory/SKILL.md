---
name: "project-memory"
description: "Use when you need to initialise, read, or update the durable planning layer for a project — STATE, ROADMAP, DECISIONS, LEARNINGS. Provides copy-paste templates and write discipline rules."
allowed-tools: Read, Write, Edit, Bash, Glob
---

# project-memory

Durable artifact layer written under `_arcwright-output/planning/`.
All writes use the `caveman` skill (concise output) — never verbose prose.

---

## 1. When to Run

- **Session start** — after `project-context` scan. If `_arcwright-output/planning/STATE.md` exists, read it and surface current phase + next action.
- **Phase transition** — when a track phase completes, update `STATE.md` and append to `DECISIONS.md` + `LEARNINGS.md`.
- **On request** — user says "update memory", "log decision", "record lesson", or "show state".

---

## 2. Artifact Map

| File | Purpose | Updated |
|------|---------|---------|
| `STATE.md` | Current phase, completed phases, blocked items, machine-resumable next action | Every phase transition |
| `ROADMAP.md` | Ordered milestones with status and target dates | On milestone change |
| `DECISIONS.md` | Decision log D-01… with rationale, date, alternatives considered | When a non-trivial decision is made |
| `LEARNINGS.md` | Post-task lessons: surprises, patterns, what to repeat/avoid | At track close or sprint end |
| `CONSTITUTION.md` | Standing non-negotiables (owned by the `constitution` skill) | See `constitution` skill |

All files live at `_arcwright-output/planning/<file>` unless config overrides `{output_folder}`.

---

## 3. Write Discipline

**All memory writes use `caveman` concise output.** Before writing any file:
1. Load `.agents/skills/caveman/SKILL.md` for current rules.
2. Apply `full` caveman level by default — structured but stripped of filler.
3. Never expand an entry beyond what a human needs to re-orient in 30 seconds.

---

## 4. Initialisation Procedure

Run once per project when `_arcwright-output/planning/` does not yet exist.

```bash
mkdir -p _arcwright-output/planning
```

Copy the four templates below (§6) and fill in project-specific values.
Offer the user the option to auto-populate from any existing PRD or sprint plan found in `_arcwright-output/`.

---

## 5. Session-Start Read

After `project-context` runs, if `_arcwright-output/planning/STATE.md` exists:

1. Read `STATE.md` — extract `current_phase`, `next_action`, `blocked`.
2. Read `CONSTITUTION.md` if present — note version and any non-negotiables.
3. Surface to user in a compact block:

```markdown
## Memory Snapshot — 2026-06-11

**Phase:** [current_phase]
**Next action:** [next_action]
**Blocked:** [blocked items or "none"]
**Constitution:** [version or "not initialised"]
```

Pass this block as additional context in the first agent's `## Inputs`.

---

## 6. Templates

### 6.1 STATE.md

```markdown
# STATE — [Project Name]

updated: 2026-06-11
current_phase: planning
completed_phases:
  - none
next_action: "Run triage on initial brief"
blocked: none

## Phase History

| Phase | Completed | Notes |
|-------|-----------|-------|
```

### 6.2 ROADMAP.md

```markdown
# ROADMAP — [Project Name]

updated: 2026-06-11

| # | Milestone | Status | Target | Notes |
|---|-----------|--------|--------|-------|
| M1 | [name] | pending | 2026-Q3 | |
```

### 6.3 DECISIONS.md

```markdown
# DECISIONS — [Project Name]

Format: D-{N} | {date} | {title}
Rationale: one sentence. Alternatives: bullet list if relevant.

---

## D-01 | 2026-06-11 | [Decision title]

**Decision:** [what was decided]
**Rationale:** [one sentence why]
**Alternatives considered:** none
**Impact:** [files / modules / policies affected]
```

### 6.4 LEARNINGS.md

```markdown
# LEARNINGS — [Project Name]

One entry per track or sprint close. Caveman style.

---

## L-01 | 2026-06-11 | [Track or sprint label]

**Surprises:** [what was unexpected]
**Patterns:** [repeatable pattern found or confirmed]
**Repeat:** [what to do the same next time]
**Avoid:** [what to skip or change next time]
```

---

## 7. Decision-Logging Protocol

When a non-trivial decision is made during any workflow:

1. Read current `DECISIONS.md` — find last D-N index.
2. Append a new entry (D-{N+1}) using Template 6.3 format.
3. **Always use absolute dates (YYYY-MM-DD), never relative ("yesterday", "last sprint").**
4. Cross-reference in `STATE.md` under `## Phase History` notes if decision affects phase direction.

Trivial decisions (naming, formatting, minor config tweaks) do not need a log entry.

---

## 8. Learnings-Capture Protocol

At track close or sprint end:

1. Ask the developer: "Any surprises or patterns worth capturing?"
2. If yes (or if the orchestrator observed notable divergences from the plan), append to `LEARNINGS.md`.
3. Update `STATE.md` — set `current_phase` to next phase, move old phase to `completed_phases`.

---

## 9. Handoffs Convention (slash command `handoffs:` key)

Slash commands MAY declare a `handoffs:` frontmatter key — a short labeled list of
next-step suggestions with pre-filled prompts. This surfaces natural follow-on
actions to the user after a command completes.

**Format (in `.claude/commands/<name>.md` frontmatter):**

```yaml
---
description: "..."
handoffs:
  - label: "Update memory after this run"
    prompt: "/project-memory update state"
  - label: "Log key decisions"
    prompt: "/project-memory log decision [title]"
  - label: "Check constitution compliance"
    prompt: "/constitution validate"
---
```

**Rules:**
- At most 3 handoff suggestions per command.
- Labels are short (≤6 words). Prompts are copy-pasteable exactly as shown.
- Handoffs are suggestions, not auto-triggered steps. The user chooses whether to follow one.
- Orchestrators reading a completed command's frontmatter MAY surface handoffs as
  numbered options in their output block.

---

## 10. Cross-References

- [`project-context`](.agents/skills/project-context/SKILL.md) — always runs before this skill; passes `{output_folder}` and surfaces existing planning artifacts.
- [`constitution`](.agents/skills/constitution/SKILL.md) — owns `CONSTITUTION.md`. `project-memory` reads it; never writes it.
- [`caveman`](.agents/skills/caveman/SKILL.md) — governs all writes to planning files.
- [`claude-subagent-protocol`](.agents/skills/claude-subagent-protocol/SKILL.md) — when subagents run, orchestrator updates `STATE.md` at each phase transition.
