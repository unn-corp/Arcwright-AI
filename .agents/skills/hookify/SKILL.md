---
name: hookify
description: "Create or revise development hooks that enforce a concrete repository rule or prevent a recurring mistake."
allowed-tools: Read, Edit, Write, Bash
---

# Development hook authoring

Translate a recurring repository rule into the active host's supported automation.
First identify the host, version, available events, configuration scope, input
format, exit/decision semantics, and the project's existing checks. Event names
and tool APIs are adapters, not a universal hook protocol.

1. Reuse the requested scope and known decisions. Define the concrete trigger,
   observable check, and intended effect: advisory feedback or a blocking gate.
   Use existing scripts where suitable. Do not run a full suite after every edit.
2. Inspect the actual host's hook/plugin/task interface and current configuration.
   Read only its official documentation or installed implementation needed now.
   For Claude Code, use the conditional [adapter](references/claude-code.md).
   For other hosts, discover their own schema; do not copy Claude event names,
   environment variables, settings paths, or exit codes into another runtime.
3. Put reusable project check scripts in the project's Arcwright directory, such
   as `_arcwright/core/hooks/`. Keep workflow logs in an owned Arcwright run or
   host evidence storage. Installed skill bundles stay read-only. Host registration
   files remain in their documented locations, and global edits require global
   scope authorization.
4. Merge only the owned event entries, preserving existing hooks, unrelated settings,
   user scripts, permissions, and secrets. Use structured arguments; parse event
   payloads as data without shell evaluation. Do not log full tool inputs, source
   contents, credentials, or sensitive responses.
5. Verify the exact configuration against the host schema and run a small relevant
   event fixture plus a failure case. Confirm a claimed blocking gate actually
   blocks before the action; a post-action warning cannot prevent that action.
   Keep hooks bounded and guard against recursive stop events or duplicate runs.
6. Apply already-authorized work without another routine confirmation. Report the
   script/config paths, trigger, observed pass/fail behavior, and untested host limits.

If the host has no suitable automation API, use an existing Git hook, package task,
or CI gate when authorized and appropriate, or provide the portable check with
its integration limit. Do not fabricate a hook registration or silently install a
plugin/service. CI or the relevant server boundary remains the authoritative gate
when local hooks are bypassable. Preserve user/host authority; omit AI attribution.
