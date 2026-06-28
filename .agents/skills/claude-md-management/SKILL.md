---
name: claude-md-management
description: >
  Use when auditing CLAUDE.md quality, capturing session learnings into CLAUDE.md,
  or pruning stale/contradictory entries. Triggers on "/claude-md", "update CLAUDE.md",
  "what should go in CLAUDE.md", or at session end when new patterns were established.
allowed-tools: Read, Edit, Write, Bash, Glob
---

# CLAUDE.md Management — Audit + Session Learning Capture

Keep CLAUDE.md accurate, concise, and load-bearing.
Complements `project-context` (which writes durable project context into CLAUDE.md / AGENTS.md).

**Scope:** CLAUDE.md files only — project (`.claude/CLAUDE.md` or `CLAUDE.md`) and global (`~/.claude/CLAUDE.md`).

**Pre-output discipline:** invoke `caveman` skill before writing any proposed additions.

---

## What Belongs in CLAUDE.md

| Belongs | Does NOT belong |
|---------|-----------------|
| Persistent house conventions Claude should follow | One-off instructions for a single task |
| Proactive skill invocation triggers | Project roadmap / sprint items |
| Repo structure notes that are non-obvious | Information already in README or code comments |
| Tool permission patterns (allowedTools) | Decisions with rationale (→ external PM tool) |
| Agent spawning rules specific to this project | Planning / sprint state (→ external PM tool) |
| Format/style rules not in lint config | Roadmap / project status (→ external PM tool) |

**Load-bearing test:** If a line disappeared, would Claude behave differently in this project? If no — cut it.

---

## Procedure

### Mode A: Audit (no arguments or `audit`)

1. Read all CLAUDE.md files in scope (project + `.claude/CLAUDE.md` if separate + `~/.claude/CLAUDE.md` if `--global` flag).
2. Scan each line against the load-bearing test.
3. Check for:
   - **Stale entries** — rules that reference files/tools/patterns that no longer exist
   - **Contradictions** — two lines that instruct opposite behaviors
   - **Duplicates** — same rule stated in two places
   - **Wrong scope** — project-level rule that belongs in global or vice versa
   - **Dead weight** — sentences that would not change Claude's behavior if removed
4. Output a diff proposal: lines to **KEEP**, **PRUNE**, **MOVE**, and **REWRITE**.
5. Ask for confirmation before applying any change.

### Mode B: Capture (argument: `capture` or auto-triggered after session)

1. Reflect on what was learned or established this session:
   - New conventions adopted (naming, structure, workflow)
   - Tool or skill patterns that proved effective
   - Rules the user corrected Claude on
   - Proactive skill invocations that should be automatic going forward
2. Diff against current CLAUDE.md — identify what is new vs already documented.
3. Draft additions using caveman discipline (terse, load-bearing only).
4. Show proposed additions for confirmation before writing.
5. Apply to the correct CLAUDE.md scope (project vs global).

### Mode C: Prune (argument: `prune`)

Run Mode A, then immediately apply all PRUNE and REWRITE proposals (still show a preview first).

---

## Output Format

```
CLAUDE.MD AUDIT — {path}

KEEP (N lines — no change):
(not listed individually unless requested)

PRUNE (remove — fails load-bearing test):
  Line NN: "<text>" — reason

REWRITE (stale/contradictory):
  Line NN: "<old>" → "<new>" — reason

MOVE (wrong scope):
  Line NN: "<text>" → move to {target file}

PROPOSED ADDITIONS (from session):
  + <new line> — why it belongs
```

Confirm before applying. After applying:
```
APPLIED: {N} changes to {path}
```

---

## Constraints

- Never edit `CLAUDE.md` without showing the diff and getting confirmation.
- Global CLAUDE.md changes affect all projects — warn before writing to `~/.claude/CLAUDE.md`.
- Do not add task-specific notes (sprint items, one-off reminders) — those go in `_arcwright-output/`.
- Additions must be shorter than what they replace or explain — never add verbose prose.
