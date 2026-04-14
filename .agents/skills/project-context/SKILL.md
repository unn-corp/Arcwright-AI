---
name: "project-context"
description: "Scan the project for existing config, plans, steering docs, and codebase structure before starting any workflow. Project-level config takes precedence over global installation."
allowed-tools: Read, Glob, Grep, Bash
---

# Project Context Scan

Run this skill **before** starting any Arcwright workflow (triage, any track, or team). It surfaces existing context so that planning and development work starts informed — not blind.

---

## When to Run

- Automatically: at the start of any track workflow (Step 0), triage scoring, or master activation
- Manually: any time the user says "check the project" or "what context do we have"

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

### 2. IDE Context Files

Read whichever are present (in priority order):

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Project root CLAUDE.md |
| `.claude/CLAUDE.md` | Claude Code project instructions |
| `.kiro/steering/*.md` | Kiro steering docs (read all) |

**Precedence**: project-level IDE context overrides global `~/.claude/CLAUDE.md` or `~/.kiro/steering/`. If both exist, project-level wins. Flag any conflicts or customizations that differ from the global default.

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

**IDE context:**
- CLAUDE.md: [found at {path} | not found]
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

## Precedence Rules

Apply these when there are conflicts between project-level and global installation:

1. **Config**: project `_arcwright/core/config.yaml` beats global `~/.arcwright/core/config.yaml`
2. **Skills**: local `.agents/skills/<name>/SKILL.md` beats global `~/.arcwright/.agents/skills/<name>/SKILL.md`
3. **IDE instructions**: project CLAUDE.md / `.kiro/steering/` beats global `~/.claude/CLAUDE.md` / `~/.kiro/steering/`
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
