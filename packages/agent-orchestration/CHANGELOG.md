# Changelog

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
