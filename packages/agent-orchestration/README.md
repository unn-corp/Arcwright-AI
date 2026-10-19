# Arcwright installer

Installer and CLI sources for the Arcwright release runtime. Standalone GitHub
Releases are the distribution channel; npm publication is retired. See the
[workshop README](../../README.md) for installation and supported integrations.

## Shared instructions, personal skills and account environments

Use `arcwright accounts configure --global` to choose all, some, or none across
Claude Code, Codex and Grok accounts. OpenCode supports shared instructions and
skills without account isolation. The walkthrough reviews each personal item,
previews all changes, and offers separate sign-in after setup.

```sh
arcwright accounts status --global --json
arcwright update --global --sharing all --dry-run
arcwright update --global --sharing custom --sharing-config '{"providers":{"codex":{"instructions":true,"skills":true}}}' --yes
arcwright update --global --sharing none
```

Instructions live in `~/.arcwright/AGENTS.md`; adopted personal bundles live in
`~/.arcwright/skills/`. Credentials, settings, history, sessions and daemon state
remain private. Arcwright Code retains ownership of shadow links. Existing
installations stay unenrolled until selected, and omitted flags preserve saved
choices. Opt-out restores matching installer preimages while preserving later edits,
canonical content and backups.

See [global sharing and accounts](docs/global-sharing.md) for the selection schema,
backups, unsupported providers, Code dependencies and health policy flags.
