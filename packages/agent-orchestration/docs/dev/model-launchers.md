# Model Surface And Alternate Launchers

Use **Hermes CLI through OmniRoute** as the primary model surface for grouped Claude/Codex
subscriptions with free-model fallback. Legacy Claude Code direct-provider launchers are still
available for users who want one process pinned to Z.ai, MiniMax, OpenRouter, or a plain
Anthropic subscription.

The primary surface is **optional and off by default**. Enable it with:

```bash
ARCWRIGHT_OMNIROUTE_API_KEY=<gateway-key> \
  npx @arcwright-ai/agent-orchestration --model-surface --global --yes
```

The older direct-provider shell functions are enabled separately with `--model-launchers`.

---

## Preferred Global CLI Agent: Hermes Through OmniRoute

For a Codex global `AGENTS.md` or other machine-wide coding-agent base, prefer
**Hermes CLI** as the default launcher when the host has OmniRoute available. In that setup,
Hermes is the user-facing coding agent and OmniRoute is the model gateway behind it.

Arcwright installer behavior:

- `--model-surface` selects the Hermes integration automatically.
- If `hermes` is not on `PATH`, Arcwright does not bootstrap it unless
  `--install-hermes` is explicitly supplied. With that opt-in, Arcwright downloads the
  Nous Research installer from the immutable reviewed source commit
  `5fc308a70719a83cccdbba4c0e39c23f5a8239d5` to a temporary file, verifies SHA-256
  `c0380bc1f78d3d662a77663ce20cc17e14cbc4bec35e61ab7a33bac5f3afed2d`, then runs it.
- Arcwright installs Hermes skills into `~/.hermes/skills/` and team bundles into
  `~/.hermes/skill-bundles/` for global installs.
- When an OmniRoute API key is available, Arcwright configures Hermes with
  `model.provider=custom`, `model.base_url=<omniroute>`, `model.default=agent-fallback`, and
  `model.api_key=<gateway-key>`.
- API key source order: `--omniroute-api-key`, `ARCWRIGHT_OMNIROUTE_API_KEY`,
  `OMNIROUTE_API_KEY`.
- Base URL source order: `--omniroute-base-url`, `ARCWRIGHT_OMNIROUTE_BASE_URL`,
  `OMNIROUTE_BASE_URL`, then `http://omniroute:20128/v1`.

### Bootstrap trust decision

Hermes bootstrap is an explicit trust decision because the upstream installer and its
dependency setup execute with the current user's privileges. The installer is fetched only
over HTTPS with redirects constrained to HTTPS, checked against the reviewed SHA-256 above,
and then invoked with a full Git commit pin. A changed upstream installer fails closed until
the maintainer reviews and updates both pins and this documentation.

Herdr configuration is also explicit. `arcwright herdr` configures an existing Herdr install
but does not install third-party plugins unless `--install-plugins` is supplied. The default
plugin set is pinned to reviewed full Git commits and passed to Herdr as `--ref`; Herdr checks
out that exact commit before running plugin build commands.

| Plugin | Reviewed commit |
| --- | --- |
| `persiyanov/herdr-reviewr` | `4fc80835699e293f0608c243028f8513557d7c77` |
| `smarzban/herdr-file-viewer` | `647f03236d9aa20de0b07c9de0a951e13a1e59bf` |
| `JanTvrdik/herdr-command-palette` | `eab940018c2135ac23718efa11e23e9dddcd2a75` |
| `lmilojevicc/herdr-tab-rename` | `8a2ad73847ec7e9f3137b7502557ffed58415f31` |
| `x0d7x/herdr-fzf-url` | `7f5fc52a4367c537cae11b636bb27bc26e2279ad` |

These are reviewed immutable source pins, not publisher signatures. Updating one requires a
source review and a corresponding code and documentation change.

**Server state, 2026-07-07:** the Global Agent container's Hermes config at
`/home/agent/.hermes/config.yaml` on the persistent `global-agent-hermes` volume is set to
`provider=custom`, `base_url=http://omniroute:20128/v1`, and `default=agent-fallback`. The
container is on `dokploy-network`, so this is an internal service URL with no tunnel or
Cloudflare Access path. The config uses the `global-agent` OmniRoute gateway key, scoped for
`agent-fallback`, `claude/*`, `codex/*`, and exact approved free model ids with provider token
limits.

The global `unnamed-agent` AgentProfile (`01KVTHEY1EZ66KSG6BBGAR9BAQ`) now has its
`hermes-cli` `defaultModel` set to `hermes/agent-fallback`, replacing the prior direct free
OpenRouter model (`hermes/openrouter:...:free`). That means dispatched `@unnamed-agent` dev
work now consumes the paid Claude/Codex subscription pools before falling back to free models.

The intended model is a colon-less Hermes model id such as:

```bash
hermes -z "<prompt>" -m agent-fallback
```

That shape matters. Because the model id has no explicit provider segment, Hermes does not
emit a `--provider` override. It uses its configured default provider instead:

```bash
hermes config set model.provider custom
hermes config set model.base_url http://omniroute:20128/v1
hermes config set model.default agent-fallback
```

OmniRoute then resolves `agent-fallback` as a grouped subscription chain, for example:

| Group | Purpose |
|-------|---------|
| `claude/*` | Primary paid Claude subscription capacity |
| `codex/*` | Secondary paid Codex/OpenAI subscription capacity |
| Free model ids | Graceful fallback when subscription capacity is exhausted |

Runner mechanics:

1. AgentProfile model is `hermes/agent-fallback`.
2. `RunnerSelectionService` routes the `hermes/` prefix to the Hermes runner.
3. `buildHermesArgs` strips `hermes/`, yielding `agent-fallback`.
4. Because `agent-fallback` contains no `:`, the runner does not pass `--provider`.
5. Hermes uses its configured `custom` provider, which points at OmniRoute.
6. OmniRoute serves the first available model in the grouped fallback chain.

The practical rule for global agent docs is:

- Use **Hermes CLI** for default global autonomous coding work.
- Let **OmniRoute** choose the backing model group through `agent-fallback`.
- Avoid provider-qualified Hermes ids like `hermes/openrouter:...` for this path, because they
  bypass the configured OmniRoute default provider.
- Treat subscription-backed groups as real paid quota, even when the chain eventually falls
  through to free models.
- Do not treat `OPENROUTER_API_KEY` in the runner environment as authoritative for this path.
  `buildEnv` may set it from `OPENAI_API_KEY`, but the Hermes custom provider authenticates
  with the key in `/home/agent/.hermes/config.yaml`.

Change or revert through the UnnamedDev script:

```bash
AWS_PROFILE=unnamed-prod MAIN_TABLE_NAME=Unnamed-prod-Main AWS_REGION=us-east-1 \
  npx tsx app/scripts/set-hermes-omniroute-model.ts --apply
```

To revert, edit that script's `NEW_MODEL` back to the direct free OpenRouter id and rerun it
with `--apply`.

This is the same runner-side pattern documented in
`global-agent/OMNIROUTE.md` in the UnnamedDev Hermes deployment bundle.

---

## The Central Lesson: Use Native Provider Endpoints for Reasoning Models

GLM and MiniMax are **reasoning models** that emit `thinking` blocks. When routed through
**OpenRouter's Anthropic-compatibility shim**, those thinking blocks come back with **empty
signatures**, which breaks Claude Code's agentic loop: you get **HTTP 200 responses with
empty or malformed bodies** mid-task, and the session stalls or errors out.

**The fix is to route each reasoning model through its provider's own native Anthropic
endpoint**, which handles thinking blocks correctly:

| Provider | Endpoint (`ANTHROPIC_BASE_URL`) | Use for |
|----------|----------------------------------|---------|
| **Z.ai (GLM)** | `https://api.z.ai/api/anthropic` | GLM reasoning models — reliable agentic use |
| **MiniMax** | `https://api.minimax.io/anthropic` | MiniMax-M3 and similar — reliable agentic use |
| **OpenRouter** | `https://openrouter.ai/api` | **Non-reasoning** models only (e.g. `qwen3-coder`) |

OpenRouter is **kept** in the launcher set, but only for non-reasoning models that survive
the shim. Do **not** route GLM or MiniMax through OpenRouter for agentic Claude Code work.

Provider docs:
- Z.ai + Claude Code: https://docs.z.ai/devpack/tool/claude (lists `glm-5.1` / `glm-5-turbo` / `glm-4.5-air`)
- MiniMax + Claude Code: https://platform.minimax.io/docs/guides/text-ai-coding-tools (`MiniMax-M3`)

---

## Overview & Tradeoffs

**What you get:**

- `claude-glm` — GLM via Z.ai native endpoint (main `glm-5.1` / `ARC_GLM_MODEL`, background `glm-4.5-air` / `ARC_GLM_SMALL`)
- `claude-minimax` — MiniMax via native endpoint (main+background `MiniMax-M3` / `ARC_MINIMAX_MODEL`, `ARC_MINIMAX_SMALL`)
- `claude-qwen` — `qwen/qwen3-coder` via OpenRouter (non-reasoning, shim-safe)
- `claude-or <slug>` — any OpenRouter model (use only for non-reasoning models)
- `claude-sub` — plain Anthropic subscription, no routing
- `tmux-claude-glm` / `tmux-claude-minimax` / `tmux-claude-qwen` / `tmux-claude` — named tmux sessions

**Caveats:**

| Concern | Detail |
|---------|--------|
| **Separate billing per provider** | Each provider (Z.ai, MiniMax, OpenRouter) bills independently and needs its own key. None of them use your Anthropic Pro/Max subscription. `claude-sub` is the only launcher that uses your subscription. |
| **Reasoning models + OpenRouter = broken** | See above. Use direct provider endpoints for GLM/MiniMax. |
| **One base URL per process** | Claude Code reads one `ANTHROPIC_BASE_URL` per session. You cannot mix providers in a single session natively — each launcher pins one provider/model. For true per-slot mixing, see the appendix. |
| **Tool-use & caching** | Non-Anthropic models may degrade prompt-caching efficiency and some Claude-specific tool-use behaviors. Test before long runs. |
| **`--dangerously-skip-permissions`** | Every launcher applies it (required by Arcwright automated workflows). |

---

## Per-Provider Key Setup

Each provider stores its key in its own file (chmod 600). The installer creates placeholders;
replace them with your real keys.

### Z.ai (GLM)

```bash
mkdir -p ~/.config/zai
echo 'YOUR-ZAI-KEY' > ~/.config/zai/key
chmod 600 ~/.config/zai/key
```

Get a key from your **Z.ai GLM Coding Plan** at https://z.ai.
Base URL: `https://api.z.ai/api/anthropic`. Main model `glm-5.1` (override `ARC_GLM_MODEL`),
background/Haiku slot `glm-4.5-air` (override `ARC_GLM_SMALL`) — the cheaper background model
saves plan quota. Example: `ARC_GLM_MODEL=glm-5-turbo claude-glm`.

### MiniMax

```bash
mkdir -p ~/.config/minimax
echo 'YOUR-MINIMAX-KEY' > ~/.config/minimax/key
chmod 600 ~/.config/minimax/key
```

Get a key from https://platform.minimax.io.
Base URL: `https://api.minimax.io/anthropic`. Main + background slots both `MiniMax-M3`
(override `ARC_MINIMAX_MODEL` and `ARC_MINIMAX_SMALL`).

### OpenRouter (non-reasoning models only)

```bash
mkdir -p ~/.config/openrouter
echo 'sk-or-YOUR-OPENROUTER-KEY' > ~/.config/openrouter/key
chmod 600 ~/.config/openrouter/key
```

Get a key from https://openrouter.ai/keys.
Base URL: `https://openrouter.ai/api`. `claude-qwen` uses `qwen/qwen3-coder`; `claude-or <slug>`
takes any non-reasoning slug.

---

## Linux / macOS Setup

The installer (with `--model-launchers`) does steps 1–3 automatically.

### 1. Key files

Create the three key files as shown above (the installer writes placeholders if absent —
edit them with your real keys).

### 2. Launcher script

The script ships in the package. Manual install:

```bash
cp "$(npm root -g)/@arcwright-ai/agent-orchestration/launchers/claude-or.sh" \
   ~/.config/openrouter/claude-or.sh
```

(The script lives under `~/.config/openrouter/` because it self-references that path; it is
the single multi-provider launcher, not OpenRouter-specific.)

### 3. Source from your shell rc

Add to `~/.bashrc` (or `~/.zshrc`):

```bash
# ─── Arcwright model launchers ───
[ -f "$HOME/.config/openrouter/claude-or.sh" ] && source "$HOME/.config/openrouter/claude-or.sh"
# ─── End Arcwright model launchers ───
```

Reload: `source ~/.bashrc`

### 4. Usage

```bash
claude-glm                  # GLM via Z.ai (reliable for agentic work)
claude-minimax              # MiniMax-M3 via native endpoint
claude-qwen                 # qwen3-coder via OpenRouter
claude-or moonshot/kimi-k2  # any non-reasoning OpenRouter model
claude-sub                  # plain Anthropic subscription

# Model overrides
ARC_GLM_MODEL=glm-5-turbo claude-glm        # main slot
ARC_GLM_SMALL=glm-5.1 claude-glm            # background/Haiku slot
ARC_MINIMAX_MODEL=MiniMax-M3 claude-minimax

# Dedicated tmux sessions
tmux-claude-glm
tmux-claude-minimax
tmux-claude-qwen
tmux-claude
```

---

## Windows (WSL2) Setup

Do the Linux/WSL-side setup first (inside your WSL distro). Then add the Windows integrations.

### .cmd launchers

Create on your `PATH` (e.g. `C:\Users\<you>\bin\`):

**`claude-glm.cmd`**
```bat
@echo off
wsl.exe -d Ubuntu -- bash -ic "tmux-claude-glm"
```

**`claude-minimax.cmd`**
```bat
@echo off
wsl.exe -d Ubuntu -- bash -ic "tmux-claude-minimax"
```

**`claude-qwen.cmd`**
```bat
@echo off
wsl.exe -d Ubuntu -- bash -ic "tmux-claude-qwen"
```

**`claude-sub.cmd`**
```bat
@echo off
wsl.exe -d Ubuntu -- bash -ic "tmux-claude"
```

> **Note:** Replace `Ubuntu` with your actual WSL distro name if different (`wsl.exe --list`).

### PowerShell profile functions

Add to **both** PS7 (`Documents\PowerShell\profile.ps1`) and PS5.1
(`Documents\WindowsPowerShell\profile.ps1`):

```powershell
# ─── Arcwright model launchers ───
function claude-glm     { wsl.exe -d Ubuntu -- bash -ic "tmux-claude-glm" }
function claude-minimax { wsl.exe -d Ubuntu -- bash -ic "tmux-claude-minimax" }
function claude-qwen    { wsl.exe -d Ubuntu -- bash -ic "tmux-claude-qwen" }
function claude-sub     { wsl.exe -d Ubuntu -- bash -ic "tmux-claude" }
# ─── End Arcwright model launchers ───
```

Reload with `. $PROFILE`.

### Windows Terminal dropdown profiles

The installer writes a 4-profile fragment (Subscription, GLM (Z.ai), MiniMax, Qwen-Coder) to:

```
%LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\arcwright-openrouter\launchers.json
```

The fragment ships at `launchers/windows-terminal-fragment.json` in the package. The installer
substitutes your detected WSL distro name (from `WSL_DISTRO_NAME`) for `Ubuntu` when writing it.

> **Distro name note:** the fragment and `.cmd` files reference `Ubuntu`. Edit them if your
> WSL distro has a different name.

---

## PowerShell Quick Usage

After adding the profile functions:

```powershell
claude-glm       # GLM via Z.ai in tmux
claude-minimax   # MiniMax via native endpoint
claude-qwen      # qwen3-coder via OpenRouter
claude-sub       # Anthropic subscription
```

---

## Model Menu

| Launcher | Provider | Endpoint | Default model |
|----------|----------|----------|---------------|
| `claude-glm` | Z.ai | `https://api.z.ai/api/anthropic` | `glm-5.1` (`ARC_GLM_MODEL`), bg `glm-4.5-air` (`ARC_GLM_SMALL`) |
| `claude-minimax` | MiniMax | `https://api.minimax.io/anthropic` | `MiniMax-M3` (`ARC_MINIMAX_MODEL` / `ARC_MINIMAX_SMALL`) |
| `claude-qwen` | OpenRouter | `https://openrouter.ai/api` | `qwen/qwen3-coder` |
| `claude-or <slug>` | OpenRouter | `https://openrouter.ai/api` | (any non-reasoning slug) |
| `claude-sub` | Anthropic | (subscription default) | — |

List OpenRouter models:

```bash
curl -s https://openrouter.ai/api/v1/models | grep -oE '"id":"[^"]*"' | sed 's/"id":"//;s/"//'
```

---

## `claude-sub` and `--dangerously-skip-permissions`

`claude-sub` runs your Anthropic Pro/Max subscription Claude directly — no third-party
routing. Like all Arcwright launchers it passes `--dangerously-skip-permissions`, because
Arcwright agent workflows are fully automated and cannot answer interactive permission
prompts. For interactive Claude, run `claude` directly without these wrappers.

---

## The Full `claude-or.sh` Script

```bash
# Claude Code multi-provider launchers
# Source this from ~/.bashrc. Provides provider-aware launchers + tmux variants.
# Every launcher runs `claude --dangerously-skip-permissions`.
#
# Keys (one per provider, chmod 600):
#   ~/.config/zai/key        <- Z.ai GLM Coding Plan key   (https://z.ai)
#   ~/.config/minimax/key    <- MiniMax platform key       (https://platform.minimax.io)
#   ~/.config/openrouter/key <- OpenRouter key (sk-or-...) (https://openrouter.ai/keys)
#
# WHY direct providers for GLM/MiniMax: these are reasoning models. OpenRouter's
# Anthropic-compat shim emits thinking blocks with empty signatures that break
# Claude Code's agentic loop (HTTP 200 empty/malformed). The providers' OWN
# Anthropic-native endpoints handle them correctly. OpenRouter is kept only for
# NON-reasoning models (e.g. qwen3-coder) that survive the shim.

# Endpoints
ZAI_BASE="https://api.z.ai/api/anthropic"
MINIMAX_BASE="https://api.minimax.io/anthropic"
OPENROUTER_BASE="https://openrouter.ai/api"

# Default models (override per-call, e.g. ARC_GLM_MODEL=glm-5-turbo claude-glm)
# GLM uses a cheaper model for the background/haiku slot to save plan quota.
ARC_GLM_MODEL="${ARC_GLM_MODEL:-glm-5.1}"
ARC_GLM_SMALL="${ARC_GLM_SMALL:-glm-4.5-air}"
ARC_MINIMAX_MODEL="${ARC_MINIMAX_MODEL:-MiniMax-M3}"
ARC_MINIMAX_SMALL="${ARC_MINIMAX_SMALL:-MiniMax-M3}"

_arc_key() { cat "$1" 2>/dev/null; }

# _arc_launch <base_url> <key_file> <main_model> <small_model> [claude args...]
_arc_launch() {
  local base="$1" keyfile="$2" model="$3" small="$4"; shift 4
  local key; key="$(_arc_key "$keyfile")"
  case "$key" in
    ""|REPLACE-*|sk-or-REPLACE*)
      echo "No key yet. Add it:  echo '<your-key>' > $keyfile"; return 1 ;;
  esac
  ANTHROPIC_BASE_URL="$base" \
  ANTHROPIC_AUTH_TOKEN="$key" \
  ANTHROPIC_API_KEY="" \
  ANTHROPIC_MODEL="$model" \
  ANTHROPIC_SMALL_FAST_MODEL="$small" \
  ANTHROPIC_DEFAULT_OPUS_MODEL="$model" \
  ANTHROPIC_DEFAULT_SONNET_MODEL="$model" \
  ANTHROPIC_DEFAULT_HAIKU_MODEL="$small" \
  CLAUDE_CODE_SUBAGENT_MODEL="$model" \
  API_TIMEOUT_MS="3000000" \
  claude --dangerously-skip-permissions "$@"
}

# --- Direct-provider presets (reliable agentic use) ---
claude-glm()     { _arc_launch "$ZAI_BASE"     "$HOME/.config/zai/key"     "$ARC_GLM_MODEL"     "$ARC_GLM_SMALL"     "$@"; }
claude-minimax() { _arc_launch "$MINIMAX_BASE" "$HOME/.config/minimax/key" "$ARC_MINIMAX_MODEL" "$ARC_MINIMAX_SMALL" "$@"; }

# --- OpenRouter (non-reasoning models only) ---
# claude-or <slug> [args] — any OpenRouter model. Reasoning models (GLM/MiniMax)
# will break Claude Code's loop; use the direct presets above for those.
claude-or()   { local m="$1"; shift; _arc_launch "$OPENROUTER_BASE" "$HOME/.config/openrouter/key" "$m" "$m" "$@"; }
claude-qwen() { claude-or "qwen/qwen3-coder" "$@"; }

# --- Plain Anthropic subscription (no third-party routing) ---
claude-sub() { claude --dangerously-skip-permissions "$@"; }

# --- tmux variants: open (or attach) a named session, keep pane alive after exit ---
_arc_tmux() {
  local name="$1" cmd="$2"
  local self="$HOME/.config/openrouter/claude-or.sh"
  if [ -n "$TMUX" ]; then eval "$cmd"; return; fi
  tmux new-session -A -s "$name" "bash -c 'source \"$self\"; $cmd; exec bash'"
}
tmux-claude-glm()     { _arc_tmux "glm"     "claude-glm"; }
tmux-claude-minimax() { _arc_tmux "minimax" "claude-minimax"; }
tmux-claude-qwen()    { _arc_tmux "qwen"    "claude-qwen"; }
tmux-claude()         { _arc_tmux "claude"  "claude-sub"; }
```

---

## Appendix: Per-Provider Slot Routing (Advanced)

To mix providers within a single Claude Code session — e.g. Opus on Anthropic-direct,
Sonnet on a third-party provider — you need a local proxy such as
[`claude-code-router`](https://github.com/musistudio/claude-code-router):

```bash
npm install -g @musistudio/claude-code-router
```

Run it with `ccr`, configure `~/.claude-code-router/config.json` to map model names to
providers, and point Claude Code at the proxy:

```bash
ANTHROPIC_BASE_URL=http://localhost:3000 claude
```

**Requirements:**
- An Anthropic **API key** from [console.anthropic.com](https://console.anthropic.com) for
  the Anthropic-routed slots — not a Pro/Max subscription.
- Separate keys for each third-party provider you route to.

The router can also help with the reasoning-model issue by giving you finer control over how
thinking blocks are handled per-provider, but the direct-endpoint launchers in this doc are
the simpler, recommended path for single-provider sessions.
