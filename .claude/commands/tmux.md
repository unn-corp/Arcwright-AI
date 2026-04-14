---
description: Install or configure tmux for AI agent workflows — runs @arcwright-ai/tmux-setup
---

# /tmux — Install tmux Setup

Run the Arcwright tmux setup to install the full tmux configuration optimized for AI agent workflows.

## What It Installs

- **Catppuccin Frappe theme** with Powerline status bar
- **Actions popup** (click `⚙ Actions` on status bar) with 4 columns:
  - Window & Session controls
  - Pane Controls (split, swap, move)
  - Tools & Clipboard (float terminal, paste image, save/restore session)
  - **Launch column** — Neovim (E or Alt+E), NvimTree (N), Yazi (Y), Lazygit (G), Lazydocker (D)
- **Pane title sync** — each pane's window name updates from Claude Code's OSC 2 title
- **Clipboard integration** (WSL2: Windows clipboard; Linux: xclip)
- **Agent orchestration scripts** — dispatch.sh, float_term.sh, paste wrappers
- **Status widgets** — CPU, RAM, Claude usage

## Prerequisites

- tmux 3.4+
- WSL2 (Windows) or native Linux/macOS
- Nerd Font (e.g. JetBrainsMono NFM) for Powerline separators

## Instructions

Run the interactive installer:

```bash
npx @arcwright-ai/tmux-setup
```

The installer will:

1. Check tmux version
2. Walk through prerequisite install (WSL, tmux, clipboard tools, fzf, TPM, fonts, gh)
3. Add `tmux-ai` and `tmux-claude` shell aliases to `~/.bashrc`
4. Install config files: `~/.tmux.conf`, `~/.config/tmux/bin/*.sh`, `colors.conf`
5. Merge `~/.claude/CLAUDE.md` with tmux-aware agent spawning rules

After install, start tmux with `tmux-ai` or `tmux-claude`, then press `Ctrl+B I` to finish TPM plugin install.

## Alternative — All-in-One

If you have the main Arcwright package installed, you can also run:

```bash
npx @arcwright-ai/agent-orchestration tmux
```

Both paths install the exact same files.
