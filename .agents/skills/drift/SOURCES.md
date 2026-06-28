# Sources, drift skill

This skill drives the upstream VibeDrift CLI. It **references** the tool (invokes
`@vibedrift/cli` via `npx`) rather than vendoring or redistributing its code, so no
upstream source is copied into this repository.

| Field | Value |
|-------|-------|
| Project | VibeDrift |
| Upstream repo | https://github.com/VibeDrift/VibeDrift |
| npm package | `@vibedrift/cli` |
| Website / docs | https://vibedrift.ai · https://vibedrift.ai/guide |
| License | MIT |
| Pinned commit (reviewed) | `1d3f723248032ea5362b0cf4f46806c522656478` |

## What was used

- Distilled the command surface, flags, in-loop `tools` checks, and the "drift =
  deviation from the repo's own dominant pattern" framing from the upstream
  `README.md`, `AGENTS.md`, `docs/tools-api.md`, and `skills/vibedrift/SKILL.md`.
- No upstream files were copied. The CLI is fetched at runtime by `npx`; the user
  runs it under VibeDrift's own MIT license.

The optional cloud deep-scan service VibeDrift can talk to is a separate hosted
product; only the local, MIT-licensed CLI is referenced here.
