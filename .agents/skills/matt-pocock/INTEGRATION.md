# Arcwright integration

These are Arcwright-maintained local skills. Edit the canonical `.agents/skills/matt-pocock*` source when skill maintenance is requested; no upstream checkout or regeneration is required. The names remain stable for existing invocations.

During ordinary execution, treat installed skill directories as read-only. Put generated notes, drafts, reports, and workflow artifacts under the active project's `_arcwright/_memory/skill-runs/matt-pocock-<run-id>/`, unless the user selected a deliverable path. Use host-managed storage for temporary evidence when available. Never resolve output paths relative to this installed bundle.

Model invocation is enabled for this installed pack. Select skills from the current task, preserving user authorization; automatic selection does not authorize setup, tracker writes, publication, or external actions.

Use the installed matt-pocock-* skill names. If a Skill tool is unavailable, read the named sibling skill's SKILL.md and follow it. Never resolve an upstream name to an unrelated Arcwright skill.

Use `AGENTS.md` for shared project instructions; required host entrypoints import it. Preserve applicable host precedence and user-owned content.

Use available Arcwright Code / T3 Code MCP or native tools for questions, browser work, evidence, and PR watching. For delegation, follow [subagent-protocol](../subagent-protocol/SKILL.md), including fresh review tasks, model discovery, task IDs, and the user's workspace assignment. Load it only when delegating.

Existing user authorization and project instructions govern all actions. Installing this pack does not authorize publishing, merging, deploying, provisioning, or contacting others. Use the Unnamed Development MCP only when explicitly requested. Use the host's private secret-input tool for credentials. Save temporary evidence in the conversation evidence directory when available.

Do not add AI/model attribution, generated-by notices, or coauthor trailers to commits, PRs, comments, or generated artifacts. Preserve third-party copyright, license, and source credits.
