# Kiro integration rules

Read for changes to Kiro agent generation, native tool mappings, or installation.
Shared instructions live in [AGENTS.md](../../AGENTS.md); the installed
`subagent-protocol` owns delegation lifecycle rules. Discover actual tool schemas
and preserve the user's model and permission choices.

## Native format and tools

Kiro agents are JSON under `.kiro/agents/`, with fields such as `name`,
`description`, `prompt`, `tools`, `allowedTools`, `toolsSettings`, `resources`,
`hooks`, and `mcpServers`. A prompt may be inline or a `file://` reference.
Filenames without `.json` are role names for `/agent` and the native `subagent`
tool. Agents needing skills include `skill://.kiro/skills/**/SKILL.md` in resources.

| Capability | Kiro tool |
| --- | --- |
| Read / write files | `fs_read` / `fs_write` |
| Shell | `execute_bash` |
| Search / glob | `grep` / `glob` |
| Code intelligence | `code` |
| Web search / fetch | `web_search` / `web_fetch` |
| Delegation | `subagent` |
| Knowledge / AWS | `knowledge` / `use_aws` |
| All built-ins | `@builtin` |

For native orchestration, inspect the installed agent config and current
`subagent` schema. Existing stages have `name`, `role`, `prompt_template`, and
optional `depends_on`/`model`. Roles must resolve to real configs. Stages without
dependencies may run in parallel; dependent stages wait. The orchestrator's
`toolsSettings.crew.availableAgents` declares native roles. Do not invent a model
or permissions mode from an old example.

## Build and registration

`bundleKiroAgents()` in `build/build.js` generates native JSON from command
sources and `_arcwright/awm/agents/` profiles. Adapters map paths, arguments,
tools, and supported native entrypoints. Check current implementations before
adding a special case; source examples are not authority to bypass host policy.

When adding a command:

1. Add the native wrapper under `.claude/commands/` and/or its neutral skill route.
2. Register command selection in `SHIPPED_COMMANDS` and the applicable
   `KIRO_TOOLS_BY_PATTERN` mapping in `bundleKiroAgents()`.
3. Build and inspect the resulting `.kiro/agents/<name>.json`, including native
   delegation tools and MCP access where the command needs them.

When adding a specialist, create its source profile, register its native name in
`SPECIALIST_AGENTS`, and update the neutral capability registry and website roster
as needed. Generated profile names stay `arcwright-<slug>`.

`.agents/skills/` remains canonical. Use relative links between sibling skills;
the installer adapts content for Kiro rather than maintaining a second source
library. Preserve frontmatter and actual reference targets.

Adapt the portable router's CommonJS helpers along with Markdown and JSON.
After adaptation, refresh alias guards from the selected package bytes only when
the original guard matches the original source. Installed customizations must
still select their authored procedure; never hash local edits into a new guard.

## Installation and visibility

`writeKiroConfig()` installs native agents, adapted skills, and steering, honoring
saved module/team choices. Global Kiro assets use the Windows home on WSL for the
GUI integration. Native lifecycle hooks belong in supported agent configuration.

Herdr visibility is opt-in when the user asks to watch panes and the environment
supports it. Use the runtime documentation for current pane mechanics; keep delegation custody in
the supported task service. Do not automatically enable trust-all flags or revive
retired signal/polling protocols. Team workflows choose stages, while the shared
delegation protocol chooses supported dispatch and reconciliation mechanics.
