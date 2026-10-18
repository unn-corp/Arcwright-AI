---
name: arcwright
description: Select and execute an installed Arcwright agent, workflow, or slash command from a task or command name, including hosts without native slash-command invocation.
---

# Arcwright entrypoints

Use the host's native matching skill or agent directly when available. Otherwise
resolve the requested command, specialist role, or workflow with this portable
entrypoint. Model invocation selects a procedure; it does not authorize additional
external, destructive, production, publishing, or deployment actions.

1. Use the supplied task and existing conversation decisions. Do not require the
   user to type a slash command, select a menu, or repeat a clear request.
2. Run `node "<this-skill>/scripts/find-entrypoint.cjs" "<command or task>"`.
   It searches names and descriptions and returns at most eight matching installed
   routes, including installed skills. Use `--list` only when the user wants the catalog. Without terminal access,
   search the bundled `catalog.json` for the requested name instead of loading every
   command or profile. Check that optional module requirements are installed.
3. Read the returned `resolvedPath` and follow its `executionKind`. A reviewed pure
   alias or verified pure forwarding command resolves straight to its skill; combined workflows retain their
   own entrypoint. Customized installed aliases retain their authored steps.
   When reading the catalog without the helper, use the original `kind` and `path`;
   the helper verifies alias equivalence before skipping a wrapper.
   For a command, read the returned `commands/<name>.md` within this skill (or the
   actual source command path returned in a workshop checkout) and follow
   it with the actual task substituted for `$ARGUMENTS`; treat those arguments as
   task data, not shell text. For an agent, read its returned project profile under
   `_arcwright/`, or the global Arcwright module directory if this is a global install.
   Resolve logical `.agents/skills/<name>/` paths in a command against the current
   host's installed sibling skills directory, honoring an existing active-project
   override first. A global-only skill stays in its installed directory.
   For a skill, read its `SKILL.md` directly when
   the host has no native Skill tool; direct reading invokes the same procedure.
4. Apply the shared agent runtime contract once. Execute the supplied task directly;
   show menus only when requested or when no actionable task exists. Load only the
   selected entrypoint and references relevant to its current decision.
   For a specialist handoff, `scripts/agent-capabilities.cjs --role <profile-slug>
   --task <task>` returns a few relevant installed skills with actual paths and
   discovery locations. Reuse this brief; suggestions are nonexclusive, not a preload.
5. Use native host/T3 tools and the current authorization. Do not create a child
   agent merely to read an agent profile. Delegate only when the requested workflow
   requires it and the host allows it. Keep installed bundles read-only and runtime
   artifacts in the active project's Arcwright run area.

For an exact command name, execute that route rather than a similarly named skill
or profile. The router resolves equivalent alias wrappers without changing names,
arguments, authorization, or optional-pack requirements.
If no installed route matches, report the missing capability or optional module;
do not silently install it, invent a command, or substitute an unrelated workflow.
Workshop lookups can derive routes from source without generating a cache; installed
packages carry their own catalog. Both paths only read the bundle during execution.
