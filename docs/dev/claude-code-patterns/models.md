# Claude Models & Selection in Claude Code

Last verified: June 2026. This doc deliberately avoids specific model version numbers — they change frequently. Use aliases, which always resolve to the current model. For live specs and pricing, see the official model overview and pricing pages.

---

## CLI Aliases

Aliases are the stable interface — they resolve dynamically to the current model behind each tier. Prefer aliases over pinned version IDs everywhere.

| Alias | Resolves to |
|---|---|
| `best` | Most capable model available (flagship if you have access, else top-tier) |
| `fable` | Flagship model (when available on your account) |
| `opus` | Top-tier model (Bedrock/Vertex/Foundry may lag a version) |
| `sonnet` | Balanced mid-tier model (Bedrock/Vertex/Foundry may lag a version) |
| `haiku` | Fast/cheap model |
| `opus[1m]` | Top-tier model, forced 1M context window |
| `sonnet[1m]` | Mid-tier model, forced 1M context window |
| `opusplan` | Top-tier model plans, then auto-switches to mid-tier for execution |
| `default` | Clears any model override, reverts to account default |

> **Cloud providers lag:** Bedrock, Vertex, and Foundry alias resolution typically trails direct API by one version. Account for this when estimating capability parity.

---

## Selection Priority

Highest wins:

1. `/model <alias>` in session — saves to user settings; press `s` for session-only
2. `claude --model <alias>` CLI flag
3. `ANTHROPIC_MODEL` environment variable
4. `model` field in `settings.json`

### Common commands

```bash
# Start with a specific model
claude --model opus
claude --model sonnet[1m]
claude --model fable

# Switch mid-session
/model opus
/model sonnet
/model              # open interactive picker (left/right arrows also change effort)
/model default      # clear override, revert to account default
```

---

## Default Model by Account Type

The default model varies by plan and platform:

- **Top tier (Max / Enterprise PAYG / API):** defaults to the top-tier model (`opus`)
- **Standard tier (Pro / Team Standard / Enterprise subscription):** defaults to the mid-tier model (`sonnet`)
- **Cloud providers (Bedrock / Vertex / Foundry):** default lags one version behind direct API

> **The flagship (`fable` / `best`) is never the default** — it must be selected explicitly on any account type.

---

## Effort Control

Effort levels apply to top-tier and mid-tier models. Haiku does not support effort levels. Newer top-tier models default to `high` effort and use adaptive thinking.

```bash
# Slash command (persists for session)
/effort low
/effort medium
/effort high
/effort xhigh
/effort max

# CLI flag
claude --effort high

# Environment variable
CLAUDE_CODE_EFFORT_LEVEL=high claude

# settings.json
{ "effortLevel": "high" }

# Interactive: left/right arrows in /model picker
```

**Disable thinking on models that think by default:**

```bash
MAX_THINKING_TOKENS=0 claude
# or
claude --thinking disabled
```

**Special session keywords:**

| Keyword | Effect |
|---|---|
| `ultracode` | Triggers dynamic workflow planning for the session |
| `ultrathink` | Deeper reasoning for one turn only |

---

## Per-Subagent Model & Effort

Set per-agent in skill/agent frontmatter:

```yaml
---
model: sonnet
effort: high
---
```

Override all subagents globally:

```bash
CLAUDE_CODE_SUBAGENT_MODEL=sonnet claude       # force mid-tier for all subagents
CLAUDE_CODE_SUBAGENT_MODEL=inherit claude      # normal resolution (default)
```

---

## Fast Mode (Research Preview)

A research-preview API parameter (`speed: "fast"`) available on top-tier Opus models. Gives faster output at premium cost. Not a slash command, not available on the flagship model, not available on AWS or Batch API.

```json
{ "speed": "fast" }
```

Set at the API level only. Check the official pricing page for current rates — they differ from standard.

---

## Flagship Safety Fallback

When a request is flagged (e.g. cyber/bio topics), the flagship model may silently fall back to the top-tier model:

1. Claude Code silently re-runs the request on the top-tier model
2. A transcript notice is shown
3. The session remains on the fallback model until you explicitly re-select the flagship (`/model fable`)

```bash
# Require a confirmation prompt before switching (opt-in via /config)
/config disable "switch models when a message is flagged"

# Diagnose whether your CLAUDE.md content is triggering the fallback
claude --safe-mode
```

---

## Tokenizer Note

Recent models use a newer tokenizer that produces roughly 30–35% more tokens for the same text compared to older models. Account for this when estimating context usage and cost.

---

## Deprecation & Migration

Older major versions are deprecated and retired on a rolling basis. Always target the current alias (`opus`, `sonnet`, `haiku`) rather than pinning a specific version ID. Check the official deprecations page for current timelines.

---

## Arcwright Delegation Pattern

The workshop's shared instructions live in [AGENTS.md](../../../AGENTS.md).
`CLAUDE.md` is retired. Follow the shared
[subagent-protocol](../../../.agents/skills/subagent-protocol/SKILL.md) for
authorized delegation, including the user's model/provider choice, source-bound
handoffs, task IDs, and the active host's capabilities. There is no fixed
orchestrator/executor model split. Use live provider/model discovery rather than
treating the host-specific examples above as Arcwright defaults.

---

## Related in Arcwright

`claude-subagent-protocol` remains a compatibility alias for the shared protocol.
Team presets and review workflows add their own stages while preserving user
authorization and model-selection rules. See the
[workshop guide](../../workshop-guide.md#installer) for instruction-file policy.

---

## Sources

- https://platform.claude.com/docs/en/about-claude/models/overview
- https://platform.claude.com/docs/en/about-claude/pricing
- https://code.claude.com/docs/en/model-config
