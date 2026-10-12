<!-- arcwright-agent-start -->

## Arcwright

Arcwright agents, skills, and workflows are installed in `_arcwright/`.
Key modules: core, awm, awb, _memory

To use an agent, load its `.md` file and follow its activation instructions.
Agent configs are in `_arcwright/{module}/config.yaml`.
Skills are in `.agents/skills/` and `_arcwright/_memory/skills/`.

## Unnamed Development MCP

Use the Unnamed Development MCP only when the user explicitly requests it. Do not run automatic preflight, tracker synchronization, or pending tracker reporting during ordinary coding work. Load the `unnamed-dev-mcp` skill before explicitly requested MCP work.

To update Arcwright: `npx @arcwright-ai/agent-orchestration update`
To toggle agent teams: add `--no-teams` or run update again and choose differently at the prompt.
To enable Docker type-check: add `--docker-check`.
To modify gitignore behavior on next update: add `--gitignore full|skills|output-only|none`.
For global installs: add `--global` to any command. Update a global install with `npx @arcwright-ai/agent-orchestration update --global`.

<!-- arcwright-agent-end -->

## Arcwright Code nightly naming — hard rule

For the `t3code` application, every new nightly installed on this PC must use the
release pipeline's allocated `<version>-nightly.<YYYYMMDD>.<N>` identity and the
display name **Arcwright Code — Nightly N**. This applies to locally built copies
as well as downloaded releases. Do not install a `preview` build or invent a
separate **Local Nightly** name/counter. Never rename an existing preview binary
to impersonate a published nightly, reuse an allocated counter, or rewrite its
digest/source identity. Use the verified published nightly when it already exists.

After every installation, replace obsolete Start Menu entries with one canonical
entry bearing the actual nightly name and record the version, counter, source,
artifact digest, launcher path, retired entries, and verification. Document the
replacement each time. Keep running chats and the current build intact until the
maintenance coordinator admits an authorized replacement.
