# tmux Setup (removed)

Arcwright's tmux support has been removed in favor of [Herdr](https://herdr.dev), a
terminal workspace manager built for AI coding agents. The `@arcwright-ai/tmux-setup`
package, the `/tmux` command, and this runbook's Catppuccin/status-bar/Actions-menu
config are no longer shipped or maintained.

For pane-based agent visibility (opt-in, not the default orchestration mechanism), use:

- `.agents/skills/herdr/SKILL.md` — the Herdr command reference (sessions, workspaces,
  tabs, panes, agent spawning, wait-on-status, the plugin catalog, and a tmux → Herdr
  mapping table for anyone migrating a setup like the one this file used to document)
- `/herdr` — loads that reference as a slash command
- [`docs/herdr-collie-tailscale-pwa.md`](../../herdr-collie-tailscale-pwa.md) — the
  `collie` plugin, which puts a phone PWA in front of your agent herd over Tailscale

Arcwright uses the host-neutral `subagent-protocol` for authorized delegation.
Herdr panes, like tmux panes before them, are optional viewing surfaces; the host's
native or Arcwright Code task tools retain lifecycle ownership.
