# Global sharing and accounts

On Linux and WSL Linux homes, Arcwright can share global instructions and explicitly
adopted personal skills across Claude Code, Codex, Grok and OpenCode. Existing
installations retain their behavior until you enroll. An interactive global install
or update offers enrollment once; declining saves `none`. Unattended updates never
enroll new homes or move personal content.

```sh
arcwright accounts configure --global
arcwright accounts status --global --json
arcwright update --global --sharing all --dry-run
arcwright update --global --sharing none
```

The walkthrough shows account paths and their owner, asks for the total account
count and short names such as `personal` or `work`, and offers all, some, or none.
For some, select each provider and each account, then instructions and skills.
Personal instruction sections are reviewed by heading and line count. Personal
skills are reviewed as whole bundles, including references and assets. Each item
requires an explicit yes; same-name conflicts and plugin-owned bundles stay local.
No personal content is moved under `--yes`.

Review the complete sharing plan before confirming. Cancellation and `--dry-run`
create no homes, backups, records or preferences. Safe independent operations may
complete while conflicts remain pending. Unattended conflicts return exit code 2.

## Shared paths and private state

`~/.arcwright/AGENTS.md` is the authored instructions file. Claude keeps a native
import in `~/.claude/CLAUDE.md`; Codex, Grok and OpenCode use a file symlink when the
existing host file is absent or contains only installer blocks. Personal host rules
stay in place unless reviewed. If only some sections are approved, their copies
are staged in canonical instructions and the original host stays intact until all
sections are approved; instructions enrollment remains pending. Codex `AGENTS.override.md` still takes precedence;
status and preview report it. The `arcwright-claude-imports: retired` marker is
respected.

Personal bundles live in `~/.arcwright/skills/<name>/`. Claude receives individual
bundle links in `~/.claude/skills/`; Codex, Grok and OpenCode use one neutral
`~/.agents/skills/` exposure. Skill roots remain real directories. Installer-managed
skills continue through the existing provider writers and ownership manifest.
Sharing a skill also shares its executable scripts and subsequent edits.

Standalone account homes link only instructions and skills to the provider's main
home. Enrolling an account item requires enrolling that item in its main home.
Credentials, settings, permissions, history, sessions, Codex daemon/control state
and model caches stay private. New homes have mode `0700`. New account launchers
in `~/.local/bin`, such as `codex-work`, set only `CODEX_HOME`, `CLAUDE_CONFIG_DIR`,
or `GROK_HOME`; arguments, cwd, HOME and exit status are preserved. Existing foreign
launchers are never replaced. Add `~/.local/bin` to PATH yourself if necessary.

The walkthrough offers a separate provider sign-in for every enrolled account after
setup. It shows the exact home and command and offers now or later. Headless Codex
and Grok use device authentication. Sign-in never runs under `--yes`, never copies
credentials, and never runs logout or a live model verification call. Before a Codex
sign-in, an existing `auth.json` is set aside, because starting `codex login` would
otherwise revoke a session that copies in other homes or on other devices share. It
is deleted after a successful sign-in and restored if the sign-in fails.

## Unattended selection

New flags have no defaults that replace omitted choices. `--sharing all` explicitly
enrolls currently detected supported homes. Later omitted flags preserve that saved
set, including exclusions; discovering another home does not enroll it.
`--sharing custom` requires inline JSON with `--yes`:

```sh
arcwright update --global --yes --sharing custom --sharing-config \
  '{"providers":{"claude":{"instructions":true,"skills":true},"codex":{"instructions":true,"skills":true,"accounts":{"/home/alex/.codex-work":{"instructions":true,"skills":false}}}},"codexSelfHeal":true,"credentialCopyCheck":"local"}'
```

Provider keys are `claude`, `codex`, `grok`, and `opencode`. Accounts are keyed by
absolute home paths; omitted accounts stay excluded. To create a new account through
JSON, add `"create":true,"name":"work"` to its selection. The path must be exactly
`<home>/.<provider>-work` and must not collide with an existing unowned home. OpenCode
supports instructions and skills only, without multi-account setup.

Preferences are stored as `sharing` with `schemaVersion: 1` in the existing
`~/.arcwright/_config/manifest.yaml`. `adoptedPersonalItems` records reviewed item
identities; it does not authorize unattended adoption. `--codex-self-heal on|off` and
`--credential-copy-check local|off` preserve saved values when omitted. Local copied
login checks are off by default; enable them explicitly during enrollment. Self-heal,
once enabled, runs on every global install/update even when Codex is not selected.
Health backups use `~/.arcwright/backups/codex-home-health/`.

## Restore and Arcwright Code coexistence

Every replacement has a preimage backup and JSON receipt under
`~/.arcwright/backups/sharing/<runId>/`, with private directory permissions. Typed
ownership records live in `~/.arcwright/_config/sharing-state.json`. Unchanged reruns
of the sharing plan create no extra backup or receipt. Concurrent sharing applies
are refused using an exclusive lock. An interrupted receipt is reported for manual
recovery; automatic journal resume is outside this version.

`--sharing none` restores only operations whose current objects still match the
installer's recorded result. Later user edits and retargeted links remain intact
and pending. Partial selection changes detach excluded owned operations by the same
rules. Canonical user content, backups and records survive opt-out and uninstall.
An account directory that acquired private state is retained. Inspect an abandoned
`sharing.lock` before removing it and retrying.

Arcwright Code owns its shadow homes and their content links. The installer writes
only the selected shared home, shows shadow dependencies, and requires matching
shadow/shared-home choices. It never changes Code settings or materializes links in
a shadow. Unreadable ownership settings block sharing writes. Separate Code
instances pointing at the same shared home cannot independently opt out of content
that Code links from that home.

Codex, Grok and OpenCode also discover the same neutral skills root. Excluding an
account stops installer sharing operations there; it cannot hide skills loaded
through another shared root. Strong account isolation is not promised.

Hermes, Cursor and native Windows sharing are reported as not yet supported. This
version does not add instruction projections, Windows link fallbacks, provider
loader probes, live account verification or OpenCode auth/data isolation. Existing
Hermes/Cursor installer adapters remain separate from sharing. The health and Code
settings reader placeholders must be replaced by their companion implementation
before certifying health repair or settings-based ownership discovery.
