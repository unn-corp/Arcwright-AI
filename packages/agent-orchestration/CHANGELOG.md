# Changelog

## Unreleased

- Add opt-in global instructions and personal skill sharing with all/custom/none
  selection, per-account preferences, path previews, private backups and guarded
  restore. Existing installations and unattended personal content stay unchanged.
- Add Linux/WSL account discovery, owned launchers and separate sign-in walkthroughs
  for Claude, Codex and Grok; preserve Arcwright Code shadow ownership and private
  account state. OpenCode supports content sharing without multi-account setup.
- Wire saved Codex health policies into every global install/update through the
  companion health and Code settings modules, with marked integration placeholders.

## 1.2.5

- Publish changed main commits as daily GitHub nightlies and promote mature nightlies to stable weekly, using isolated self-hosted runners and verified draft assets.
- Install Ponytail 5.3.2's six skills and refresh Caveman from 4.0.1 with retained licenses and pinned provenance.
- Use Review Loop as the canonical folder and command; retire the Sol Loop compatibility bundle and Herdr skill routes.
- Remove the Ungate and Hermes application submodules while preserving the T3 fork submodule.

## 1.2.4

- Distribute standalone runtimes through GitHub Releases with a SHA-256-verified
  Node launcher and bundled production dependencies.
- Migrate existing npm-created project/global installations while preserving
  configuration, host selections, optional packs, and personal skills/settings.
- Preserve project host selections on unattended updates and honor explicit
  Claude-only and stable-channel selections.
- Retire npm publication for both legacy packages and document their replacements.
- Verify release artifacts in isolated Codex and Claude homes/projects, including
  upgrades from the published npm baseline.

## 1.2.3

### Added
- **Managed Herdr runtime standard.** Existing Herdr installs now receive Claude and Codex
  integrations, native conversation restoration, space-grouped agents, follow-cwd behavior,
  MIME-aware `Ctrl+V` for clipboard text/images, unrestricted Codex/Claude launch policies,
  and account-aware Claude resume across multiple `CLAUDE_CONFIG_DIR` profiles. Run or repair
  the setup with `arcwright herdr`.
- **Optional multi-provider Claude Code launchers** (`--model-launchers`, off by default).
  Installs provider-aware shell launchers that route Claude Code through alternate models:
  - `claude-glm` — GLM via Z.ai's native Anthropic endpoint (`https://api.z.ai/api/anthropic`),
    main model `glm-5.1` with a cheaper `glm-4.5-air` background slot to save plan quota.
  - `claude-minimax` — MiniMax via its native endpoint (`https://api.minimax.io/anthropic`),
    `MiniMax-M3`.
  - `claude-qwen` / `claude-or <slug>` — OpenRouter, for **non-reasoning** models only.
  - `claude-sub` — plain Anthropic subscription, no routing.
  - tmux variants for each.

  Direct provider endpoints are used for GLM/MiniMax because OpenRouter's Anthropic-compat
  shim breaks reasoning models in Claude Code's agentic loop (thinking blocks with empty
  signatures → HTTP 200 empty/malformed). OpenRouter is kept only for non-reasoning models.

  The installer creates placeholder key files (chmod 600) under `~/.config/{zai,minimax,openrouter}/`,
  installs the launcher script, and sources it from `~/.bashrc` / `~/.zshrc`. On WSL2 it also
  writes `.cmd` launchers, PowerShell profile functions, and a Windows Terminal fragment, with
  the WSL distro name auto-detected from `WSL_DISTRO_NAME` (falls back to `Ubuntu`).

  `--openrouter-launchers` is retained as a hidden alias for `--model-launchers`.

  Docs: `docs/dev/model-launchers.md`.
- **`motion` skill** — Motion (formerly Framer Motion) is now the prioritized React
  animation library for Arcwright frontends. Lean distillation (SKILL.md + RULES.md sidecar)
  of the MIT-licensed motion skill from `secondsky/claude-skills`: when-to-use decision guide
  (Motion vs CSS vs `auto-animate` vs `framer-motion` on Cloudflare Workers), core API,
  framework integration gotchas (Next.js `"use client"`, Tailwind `transition-*` conflicts),
  `LazyMotion` bundle optimization, and `prefers-reduced-motion` accessibility. Wired into the
  `ux-designer` agent (Animation Library Rule) and the proactive skill-invocation tables so any
  JS-driven animation defaults to Motion over hand-rolled CSS/`requestAnimationFrame`.
