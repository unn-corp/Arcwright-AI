# tmux Setup (removed)

Arcwright's tmux support has been removed in favor of [Herdr](https://herdr.dev), a
terminal workspace manager built for AI coding agents. The `@arcwright-ai/tmux-setup`
package, the `/tmux` command, and this runbook's Catppuccin/status-bar/Actions-menu
config are no longer shipped or maintained.

For pane-based agent visibility (opt-in, not the default orchestration mechanism), use:

- [Herdr documentation](https://herdr.dev) for current terminal workspace commands.
- `arcwright herdr` for opt-in runtime configuration. The bundled Herdr skill and
  `/herdr` chat command are retired.
- `docs/herdr-collie-tailscale-pwa.md` (workshop repo root) — the `collie` plugin,
  which puts a phone PWA in front of your agent herd over Tailscale

Arcwright's default orchestration is in-process via the `Agent` tool + `SendMessage`
reuse (see `claude-subagent-protocol`). Herdr panes, like tmux panes before them, are
only ever a viewing surface for that in-process flow, never the spawn mechanism.
