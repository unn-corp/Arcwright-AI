# RULES — project-context

**Always run before any Arcwright workflow begins.**

## Trigger

Run this skill when:
- Any track workflow (nano/small/compact/medium/extended/large/rv) is started
- The triage skill is invoked
- The master orchestrator begins executing a workflow item
- The user asks to "check the project" or "what context do we have"

## Core Rules

1. **Scan before spec.** Context scan runs before Quick Spec, not after. Specs written without project context miss constraints and existing work.

2. **Project beats global.** Local `_arcwright/core/config.yaml`, `.agents/skills/`, CLAUDE.md, and `.kiro/steering/` always override their global equivalents.

3. **Always check for existing plans.** Look in `_arcwright-output/` before planning anything. If plans exist, offer resume vs. fresh start — never silently discard prior work.

4. **Pass context forward.** The context block from this scan must be included in the prompt/handoff to the first spec or dev agent. Don't scan and throw it away.

5. **Detect the stack.** Read `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc. to identify the tech stack. Dev agents need this to write idiomatic code.

6. **Flag overrides explicitly.** If project has local skill overrides, note them in the context block so agents know which skill version applies.

7. **Gitignore the output folder.** If `_arcwright-output/` doesn't exist yet, create it and silently add it to `.gitignore` (if .gitignore exists and doesn't already contain it). This is especially important for global installs where the installer didn't set up gitignore.

## Output

A `## Project Context` markdown block covering: config source, IDE docs found, tech stack, existing plans, active sessions, skill overrides, key constraints.
