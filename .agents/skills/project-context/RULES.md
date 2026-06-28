# RULES — project-context

**Always run (load) before any Arcwright workflow begins. Write durable context to the agent-native memory file.**

## Trigger

Run this skill when:
- The triage skill is invoked
- The master orchestrator begins executing a workflow item
- The user asks to "check the project" or "what context do we have"
- Durable, project-wide context is established or changes (then WRITE it)

## Core Rules

1. **Scan before spec.** Context scan runs before Quick Spec, not after. Specs written without project context miss constraints and existing work.

2. **Project beats global.** Local `_arcwright/core/config.yaml`, `.agents/skills/`, `AGENTS.md` / `CLAUDE.md`, and `.kiro/steering/` always override their global equivalents.

3. **Durable context lives in the agent-native memory file.** `AGENTS.md` is the cross-agent source of truth; `CLAUDE.md` imports it (`@AGENTS.md`) or symlinks to it. Read whichever exist; write the generated layer back. Ongoing project state (roadmap, decisions, sprint/task status) lives in the **external PM tool**, NOT in repo files.

4. **Write only the generated layer.** Update `Setup & commands`, `Architecture`, and `Gotchas / project context` in place. Never overwrite hand-authored sections (`Project overview`, `Conventions`, `Commit & PR rules`, `Security`). Keep the whole file under ~200 lines; use the unified section template.

5. **Pass context forward.** The context block from this scan must be included in the prompt/handoff to the first spec or dev agent. Don't scan and throw it away.

6. **Detect the stack.** Read `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc. to identify the tech stack. Dev agents need this to write idiomatic code.

7. **Flag overrides explicitly.** If the project has local skill overrides, note them in the context block so agents know which skill version applies.

8. **Gitignore the output folder.** If `_arcwright-output/` doesn't exist yet, create it and silently add it to `.gitignore` (if .gitignore exists and doesn't already contain it). This matters most for global installs where the installer didn't set up gitignore. Note: the agent-native memory file (`AGENTS.md` / `CLAUDE.md`) is committed, NOT gitignored.

## Output

A `## Project Context` markdown block covering: config source, agent memory file(s) found, tech stack, existing artifacts, active sessions, skill overrides, key constraints.
