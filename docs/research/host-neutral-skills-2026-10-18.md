# Host-neutral skills, 2026-10-18

Updated 64 existing skill entrypoints and added two neutral canonical skills.
Shared guidance now follows the active host, selected model, actual tools, and
project instruction convention. Real provider APIs, optional host adapters, and
required source/license notices remain intact. No AI attribution was added.

## Canonical names and compatibility

| Current skill | Compatible old call |
| --- | --- |
| [subagent-protocol](../../.agents/skills/subagent-protocol/SKILL.md) | `claude-subagent-protocol` |
| [agent-instructions](../../.agents/skills/agent-instructions/SKILL.md) | `claude-md-management`, `/claude-md` |

Callers, team references, agent profiles, generated host guidance, audits, and
website names now use the neutral terminology. Old skill names remain small
reviewed aliases; old protocol resource paths forward to their current guides.
Pure alias commands resolve directly to the canonical skill in source, packaged,
and actual global lookups. Customized aliases retain their own procedure.

Instruction maintenance supports `AGENTS.md` and the applicable host files without
automatically preferring `CLAUDE.md`, scanning unrelated global profiles, or asking
again to apply already-authorized maintenance. Audit-only and automatic selection
remain read-only unless persistence is authorized.

## Shared guidance cleanup

- Hookify selects the actual host's supported events and registration schema. The
  Claude adapter is conditional, and its payload guidance now uses JSON on stdin,
  following the [official hooks reference](https://code.claude.com/docs/en/hooks).
  A post-action warning is distinguished from an actual pre-action block.
- Browser exploration preserves the configured provider/model rather than requiring
  an Anthropic key or Sonnet default. Provider examples are conditional, based on
  the [upstream provider guide](https://github.com/browser-use/browser-use/blob/main/skills/open-source/references/models.md).
  Native host browser policy still governs when a standalone browser is appropriate.
- CI gates keep their reusable checks separate from host registration. Claude event
  templates are an explicit adapter; other hosts need their actual supported mapping
  or an appropriate Git/package/CI integration.
- React research uses task-owned Arcwright paths and relevant primary evidence.
  The six research lenses are optional scopes rather than mandatory Claude agents.
- MCP guidance starts with the selected clients and version-matched protocol/SDK
  capabilities. It no longer fetches a full Claude documentation export, assumes
  Claude transport/auth rules apply everywhere, or submits every server to a
  provider directory. See the [official MCP server guide](https://modelcontextprotocol.io/docs/develop/build-server).
- Removed Claude-only compatibility wording from the pdf-lib skills. Image inspection
  uses the host's actual image tool. Legal workflows use configured practice profiles;
  UFL lookup no longer assumes one person's Claude skill directory. Existing project
  instructions and explicitly configured host integrations remain supported.

Genuine host identifiers and package names are preserved, including documented
Claude hook fields and the MCPB tool package. Attribution and upstream source URLs
are source notices, not runtime host requirements.

## Validation and installed state

- Package build passed resource/link validation and content leak checks.
- All **369 package tests** passed through the two configured CI coverage partitions
  (317 integration and 52 focused tests), with existing coverage gates satisfied.
  The 27 focused routing/capability checks also passed. The new regression exercises
  both neutral names and legacy aliases, including packaged command resolution.
- Website lint, TypeScript/bundle build, and data integrity checks passed.
- Source/provenance and reviewed-footprint audits passed for 280 model-invocable
  skills and all 17 profile roles. Upstream revisions were not changed.
- Package dry-run includes both neutral skills, compatibility routes, resource
  redirects, and conditional adapters. No package was published.
- Managed project/global installations were refreshed with ownership guards and
  backups. Fourteen neutral native command/agent routes were installed in existing
  host integrations; no new host integration was enabled. The workshop's source
  command generation remains authoritative.
- Actual global aliases resolve to the neutral skills, and all 219 shared
  project/global skill entrypoints match. Existing configuration choices and
  customizations were preserved, including the Kiro `VENDORED-MCP.md` and legacy
  `rust-ffmpeg` overrides. Required optional modules were not silently installed.

Validation covers documentation, routing, packaging, and installer behavior. Live
external browser/model calls and a complete live hook matrix across every host
were not run. Unsupported host capabilities are reported rather than fabricated.
Temporary snapshots, logs, package inventory, and installation records are in this
conversation's evidence directory under `host-neutral-skills-2026-10-18/`.
