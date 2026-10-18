<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Claude host specifics

| `_meta.ui.*` key | Where | Effect |
|---|---|---|
| `resourceUri` | tool | Which `ui://` resource the host renders for this tool's results. |
| `visibility: ["app"]` | tool | Hide a widget-only helper tool (e.g. geometry/image fetcher called via `callServerTool`) from Claude's tool list. |
| `prefersBorder: false` | resource | Drop the host's outer card border (mobile). |
| `csp.{connectDomains, resourceDomains, baseUriDomains}` | resource | Declare external origins; default is block-all. `frameDomains` is currently restricted in Claude. |

- `hostContext.safeAreaInsets: {top, right, bottom, left}` (px) — honor these for notches and the composer overlay.
- Directory submission requires OAuth or **authless** (`none`) — static bearer is private-deploy only and blocks listing — plus tool `annotations` and 3–5 PNG screenshots; see `references/directory-checklist.md`.

---
