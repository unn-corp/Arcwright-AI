# Changelog

## 1.2.3

### Added
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
