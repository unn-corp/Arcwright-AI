---
name: "project-context"
description: "Load and persist durable project context. Scans config, the agent-native memory file (CLAUDE.md / AGENTS.md), codebase structure, and prior artifacts before any workflow; and writes the generated project-context layer back into the active coding agent's native memory file. Project beats global. Ongoing project state (roadmap, decisions, tasks) lives in your external PM tool, not in repo files."
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Project Context

This skill owns **durable project context** — the facts an AI coding agent should hold every
session (stack, commands, architecture, conventions, accumulated gotchas). It does two things:

- **LOAD** (scan) — surface existing context **before** any Arcwright workflow so work starts informed.
- **WRITE** (persist) — record the generated project-context layer into the active coding agent's
  **native memory file** (`CLAUDE.md` / `AGENTS.md` / …) so it survives across sessions and agents.

It does **not** maintain a parallel set of planning files. Ongoing project state — roadmap,
milestones, decisions, sprint/task status — lives in the team's **external project-management
tool**, not in `_arcwright-output/`. (The former `project-memory` and `constitution` skills, and
their `STATE.md` / `ROADMAP.md` / `DECISIONS.md` / `LEARNINGS.md` / `CONSTITUTION.md` artifacts,
have been removed.)

---

## When to Run

- **Load:** automatically at the start of any track workflow (Step 0), triage scoring, or master
  activation; manually when the user says "check the project" or "what context do we have".
- **Write:** when durable, project-wide context is established or changes (new stack/commands,
  architecture moves, a recurring gotcha worth recording) — persist it to the native memory file.

---

## Scan Sequence

Execute all checks before producing the output block. Order matters — precedence rules are applied after scanning.

### 1. Project Config

Check for Arcwright config in this order (project takes precedence over global):

1. **Project-level:** `_arcwright/core/config.yaml` (local project install)
2. **Global:** `~/.arcwright/core/config.yaml` (global install)
   - On WSL2 with Windows home: also try `/mnt/c/Users/<name>/.arcwright/core/config.yaml`

Read whichever is found first. Store `{user_name}`, `{communication_language}`, `{output_folder}`.

**Output folder always resolves to the current project.** The config value uses `{project-root}/_arcwright-output` — this means artifacts always land in the project you are working in, never in a home directory, regardless of whether Arcwright was installed globally or locally.

If neither config is found: use defaults — `{user_name}: Developer`, `{output_folder}: _arcwright-output`.

If the output folder does not yet exist in the current project: create it and update `.gitignore`:
```bash
mkdir -p _arcwright-output
```
Then check `.gitignore` — if it exists and does not already contain `_arcwright-output/`, add it:
```bash
# If .gitignore exists and _arcwright-output/ is not in it:
echo '_arcwright-output/' >> .gitignore
```
Do this silently; do not ask the user. The output folder always contains generated artifacts that should not be committed.

### 2. Agent-Native Memory Files

The durable project context lives in the coding agent's **native memory file**. Read whichever are
present (a project may have more than one):

| File | Agent |
|------|-------|
| `AGENTS.md` | Cross-agent standard (Codex, Cursor, Aider, Gemini, …) — the source of truth |
| `CLAUDE.md` / `.claude/CLAUDE.md` | Claude Code (often just `@AGENTS.md` import or a symlink) |
| `.github/copilot-instructions.md` | GitHub Copilot |
| `.kiro/steering/*.md` | Kiro steering docs (read all) |

**The `AGENTS.md` ↔ `CLAUDE.md` relationship** (follow when reading and writing): `AGENTS.md` is the
agent-neutral source of truth. `CLAUDE.md` should either be a symlink to it, or contain
`@AGENTS.md` (an import) plus any Claude-specific notes below it. If both exist independently,
treat `AGENTS.md` as canonical and flag the divergence. Resolve `@path` imports (max 4 hops) when
reading.

**Precedence**: project-level memory files override global `~/.claude/CLAUDE.md` / `~/.kiro/steering/`.
If both exist, project-level wins. Flag conflicts or customizations that differ from the global default.

### 3. Existing Plan Artifacts

Scan for prior work in the output folder (`_arcwright-output/` or `{output_folder}` from config):
```
_arcwright-output/**/*.md
_arcwright-output/**/*.yaml
```
List any found artifacts: PRDs, sprint plans, research reports, rv-findings docs, architecture notes.

Also check for active orchestration sessions:
```
.agents/orchestration/session-*.md
```

If artifacts exist: note them. At Step 0 in a track workflow, offer the user the choice to **resume** (pass artifacts as context to the next step) or **start fresh**.

> **Note:** durable project state (roadmap, decisions, sprint/task status) is **not** scanned from
> repo files — it lives in the team's external PM tool. This scan only loads the agent-native
> memory file (§2) plus any one-off generated artifacts (specs, research, handoffs) under the
> output folder.

### 4. Tech Stack Detection

Check root-level for:

| File | Stack |
|------|-------|
| `package.json` | Node.js — read for name, main frameworks (React, Next.js, Express, etc.) |
| `tsconfig.json` | TypeScript project |
| `pyproject.toml` / `setup.py` | Python — read for deps |
| `Cargo.toml` | Rust |
| `go.mod` | Go |
| `pom.xml` / `build.gradle` | Java/JVM |
| `docker-compose.yml` / `Dockerfile` | Containerized |

Read only the dependency/metadata sections of any found files (not full content).

### 5. Project-Level Skill Overrides

Check if the project has a local `.agents/skills/` directory (installed locally, not globally):
```bash
ls .agents/skills/ 2>/dev/null
```
If local skills exist: they **override** the equivalent global `~/.arcwright/.agents/skills/` skill. Note which skills are overridden and whether any differ from the global version. Always use the local version for this project.

### 6. Workflow Customizations

Check for project-specific workflow overrides:
```
.claude/commands/arcwright-*.md
.kiro/agents/arcwright-*.json
```
If project-level commands or agents exist: they override global equivalents. Note any customized tracks or commands.

---

## Output Format

After scanning, produce a context block. This block is passed to every subsequent workflow step.

```markdown
## Project Context

**Config:** [project config found at `_arcwright/core/config.yaml` | global install only]
**User:** [{user_name} | unknown — no config found]
**Output folder:** [`_arcwright-output/` | {custom path from config}]

**Agent memory:**
- Native memory file: [AGENTS.md | CLAUDE.md @ {path} | .github/copilot-instructions.md | none]
- Kiro steering: [{N} docs found: {filenames} | not found]
- Workflow customizations: [{list} | none]

**Tech stack:** [{detected: e.g., Node.js / TypeScript / Next.js 14} | not detected]

**Existing plan artifacts:**
- {filename}: {brief description} — created {date from filename if available}
- (none)

**Active sessions:** [{session filename} | none]

**Skill overrides:** [Project has local `.agents/skills/` with {N} skills overriding global | global skills only]

**Key project constraints / customizations:**
> {excerpt relevant custom instructions from CLAUDE.md or steering docs, if any}
> (none — using global defaults)
```

---

## Writing Project Context

When durable project context is established or changes, persist it into the active agent's native
memory file. **Pick the target** in this order:

1. If `AGENTS.md` exists → write there (it's the cross-agent source of truth).
2. Else if `CLAUDE.md` / `.claude/CLAUDE.md` exists → write there.
3. Else if `.github/copilot-instructions.md` or `.kiro/steering/` is the project's convention → write there.
4. Else → create `AGENTS.md` at the project root, and add a `CLAUDE.md` containing `@AGENTS.md` so
   Claude Code picks it up too. (On Windows, prefer the `@AGENTS.md` import over a symlink.)

**Apply this unified section structure** to every memory file you write or touch — keep the whole
file **under ~200 lines** (memory files load in full every session):

```markdown
# <Project Name>

## Project overview            <!-- hand-authored: what/why, stack, runtime versions -->
## Setup & commands            <!-- GENERATED: install / dev / build / test commands -->
## Architecture                <!-- GENERATED, hand-trimmed: where things live, module map -->
## Conventions                 <!-- hand-authored: style, naming, always/never rules -->
## Testing                     <!-- mixed: commands generated, discipline hand-authored -->
## Commit & PR rules           <!-- hand-authored -->
## Security                    <!-- hand-authored -->
## Gotchas / project context   <!-- GENERATED: accumulated non-obvious traps & learnings -->
```

**Write only the GENERATED layer** — `Setup & commands`, `Architecture`, and
`Gotchas / project context`. Update those sections in place and **never overwrite hand-authored
sections** (`Project overview`, `Conventions`, `Commit & PR rules`, `Security`). If a target
section is missing, insert it in the order above; if the file is empty/new, scaffold the full
template. Keep entries terse (use the `caveman` discipline). Claude-specific overrides go in
`CLAUDE.md` *below* the `@AGENTS.md` import, never in `AGENTS.md`.

---

## Precedence Rules

Apply these when there are conflicts between project-level and global installation:

1. **Config**: project `_arcwright/core/config.yaml` beats global `~/.arcwright/core/config.yaml`
2. **Skills**: local `.agents/skills/<name>/SKILL.md` beats global `~/.arcwright/.agents/skills/<name>/SKILL.md`
3. **Agent memory**: project `AGENTS.md` / `CLAUDE.md` / `.kiro/steering/` beats global `~/.claude/CLAUDE.md` / `~/.kiro/steering/`
4. **Commands**: project `.claude/commands/arcwright-*.md` beats global equivalents
5. **Plans**: existing `_arcwright-output/` artifacts are resumable — always offer resume vs. fresh start when found

---

## Handoff

Pass the full context block as the first section of context to:
- Quick Spec agent (so it understands the tech stack and project constraints)
- Research agents (so they know where to look and what exists)
- Dev agents (so they respect project conventions from CLAUDE.md / steering)
- Review agents (so they know project-specific standards)

If the workflow skips Quick Spec (e.g., Nano track), pass context directly to the Quick Dev agent.
