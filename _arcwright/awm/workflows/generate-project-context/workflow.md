---
name: generate-project-context
description: 'Generate the project-context layer (Setup & commands / Architecture / Gotchas) into the coding agent''s native memory file (AGENTS.md / CLAUDE.md). Use when the user says "generate project context" or "create project context"'
---

# Generate Project Context Workflow

**Goal:** Generate the GENERATED layer of the coding agent's **native memory file** (`AGENTS.md` / `CLAUDE.md` / `.github/copilot-instructions.md` / `.kiro/steering/`) — the `## Setup & commands`, `## Architecture`, and `## Gotchas / project context` sections — containing critical rules, patterns, and guidelines that AI agents must follow when implementing code. These sections focus on unobvious details that LLMs need to be reminded of, and are merged in place without disturbing hand-authored sections.

**Your Role:** You are a technical facilitator working with a peer to capture the essential implementation rules that will ensure consistent, high-quality code generation across all AI agents working on the project.

> **Model:** This workflow reads and writes the agent-native memory file, not a standalone doc. The slim `project-context` skill (`.agents/skills/project-context/SKILL.md`) is the source of truth for the target-selection logic and the unified section template — follow it.

---

## WORKFLOW ARCHITECTURE

This uses **micro-file architecture** for disciplined execution:

- Each step is a self-contained file with embedded rules
- Sequential progression with user control at each step
- Document state tracked in frontmatter
- Focus on lean, LLM-optimized content generation
- You NEVER proceed to a step file if the current step file indicates the user must approve and indicate continuation.

---

## INITIALIZATION

### Configuration Loading

Load config from `{project-root}/_arcwright/awm/config.yaml` and resolve:

- `project_name`, `output_folder`, `user_name`
- `communication_language`, `document_output_language`, `user_skill_level`
- `date` as system-generated current datetime
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Paths

- `installed_path` = `{project-root}/_arcwright/awm/workflows/generate-project-context`
- `template_path` = `{installed_path}/project-context-template.md`

### Target memory file resolution (`{memory_file}`)

This workflow writes into the active coding agent's **native memory file**, not a standalone
`project-context.md`. Resolve `{memory_file}` once, in this priority order:

1. **`AGENTS.md`** at the project root, if present — the cross-agent source of truth. Prefer this.
2. Else **`CLAUDE.md`** or **`.claude/CLAUDE.md`**, if present. (If `CLAUDE.md` only contains an
   `@AGENTS.md` import or is a symlink to `AGENTS.md`, follow it and treat `AGENTS.md` as the target.)
3. Else the project's existing convention: **`.github/copilot-instructions.md`** or a file under
   **`.kiro/steering/`** (e.g. `.kiro/steering/project-context.md`), if that's what the repo uses.
4. Else **create `AGENTS.md`** at the project root, and add a sibling **`CLAUDE.md` that contains
   `@AGENTS.md`** (an import) so Claude Code picks it up too. On Windows prefer the `@AGENTS.md`
   import over a symlink.

`{memory_file}` is the resolved path. The workflow merges ONLY the GENERATED sections
(`## Setup & commands`, `## Architecture`, `## Gotchas / project context`) into it and never
overwrites hand-authored sections. If `{memory_file}` is new/empty, scaffold the full unified
template (see the `project-context` skill). Keep the file under ~200 lines.

---

## EXECUTION

Load and execute `{project-root}/_arcwright/awm/workflows/generate-project-context/steps/step-01-discover.md` to begin the workflow.

**Note:** Input document discovery and initialization protocols are handled in step-01-discover.md.
