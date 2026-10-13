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

## Arcwright Code app delivery — default for every AI agent

When a user asks any AI agent to build, package, install, or update the Arcwright
Code app in `t3code`, default to delivering a numbered nightly. Install the latest
eligible, verified published nightly if it contains the requested changes; otherwise
commit and push the required changes, then publish a new nightly through the fork
release pipeline from the tested, pinned commit on `main`. Reuse a suitable release
or an existing run for that source instead of commissioning duplicate builds.
Follow the [delivery procedure](t3code/docs/operations/fork-releases.md#default-agent-delivery).

Honor explicit user choices such as source-only work, development/test builds,
local-only packaging, a stable release, or a pinned version. Documentation, review,
and unrelated app-development requests do not themselves commission an Arcwright
release. This default does not enable scheduled publishing or automatic updates.
Installation still requires native maintenance admission; protect running chats,
verify the installed app, and document the canonical menu replacement below.

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

## Arcwright fork build retention — hard rule

On GitHub, `unn-corp/t3code` retains only the newest five published nightly builds
and the newest five stable/main releases. Remove completed Actions build-artifact
copies and older fork release payloads. Cleanup must wait for active release
transactions, preserve immutable source/counter tags, and retain local recovery
assets needed by installed builds. Keep this policy automated and documented in
`t3code/docs/operations/fork-releases.md`.
