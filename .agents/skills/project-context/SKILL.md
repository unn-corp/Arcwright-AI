---
name: "project-context"
description: "Load missing task-relevant project context or persist verified durable facts. Reuse supplied instructions and resolve project skills before global fallbacks."
allowed-tools: Read, Glob, Grep, Bash, Write, Edit
---

# Project Context

Load the missing facts needed for the active task; reuse instructions and context
already supplied by the host or earlier in this session. This skill does not
require a full repository scan or a new report before every workflow.

## Load only what is missing

1. Resolve the active project. Read its `_arcwright/core/config.yaml` if needed;
   use the global Arcwright config only as fallback. Resolve `{project-root}` and
   output paths against the active project, never the installed skill directory.
2. Apply the host's instruction hierarchy. Reuse already loaded `AGENTS.md` and
   host-specific instructions; read additional applicable files only for the
   affected paths. Follow explicit imports with a four-hop limit and cycle check.
   Do not read unrelated personal instructions or credentials to build context.
3. Inspect the nearest relevant package/build metadata for the stack, commands,
   and required checks. Prefer focused file lists and searches over full files or
   recursive source dumps. Refresh only when the workspace or relevant files change.
4. Resolve each skill name to the active project's copy when present, otherwise
   its installed global copy. Load one effective entrypoint. Use the `arcwright`
   router for aliases and commands; do not load competing skill collections.
5. Read the current task's existing spec, handoff, or ledger if one is known. If
   resuming, preserve the recorded scope, decisions, and unresolved work. Inspect
   artifact names before reading their contents. Ask about resume versus fresh
   work only when the request leaves a consequential choice unresolved.

A context scan is read-only. Do not create output folders, modify `.gitignore`,
rewrite memory, or contact an external tracker merely to discover context. Use
Unnamed Development MCP only when explicitly requested and load its skill then.
Existing task data may live locally or in a chosen tracker; do not relocate it.

## Reuse and handoff

Pass the task, relevant constraints, source paths, verified commands, and remaining
unknowns. Reference larger artifacts instead of copying them into every agent
prompt. Include actual evidence when a recipient cannot access the referenced
file. Retain provenance and distinguish observed facts from assumptions.

An already clear request needs no menu or question. Missing optional artifacts
are not blockers; gather factual answers directly and ask only for a material
user decision. Delegate substantial independent research only when authorized.

## Persist durable facts when needed

When the task calls for lasting project context, follow the project's memory
convention and [persistence guidance](references/persistence.md). Update only the
owned generated sections, preserve user instructions and required notices, and
remove stale facts rather than append a duplicate. Keep runtime status and
speculative findings out of always-loaded memory.

Temporary evidence belongs in the host's evidence directory, otherwise the
active project's `_arcwright/_memory/skill-runs/project-context-<run-id>/`.
Installed bundles remain read-only during execution.
