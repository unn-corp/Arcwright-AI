# Claude Code multi-provider launchers
# Source this from ~/.bashrc. Provides provider-aware launchers + Herdr session variants.
# Every launcher runs `claude --dangerously-skip-permissions`.
#
# Installed by @arcwright-ai/agent-orchestration
# Docs: https://arcwright.space/docs/model-launchers
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

# --- Herdr variants: open (or attach) a named Herdr session per provider ---
_arc_herdr() {
  local name="$1" cmd="$2"
  local self="$HOME/.config/openrouter/claude-or.sh"
  if [ "${HERDR_ENV:-}" = "1" ]; then eval "$cmd"; return; fi
  if command -v herdr >/dev/null 2>&1; then
    herdr --session "$name"
  else
    eval "$cmd"
  fi
}
herdr-claude-glm()     { _arc_herdr "glm"     "claude-glm"; }
herdr-claude-minimax() { _arc_herdr "minimax" "claude-minimax"; }
herdr-claude-qwen()    { _arc_herdr "qwen"    "claude-qwen"; }
herdr-claude()         { _arc_herdr "claude"  "claude-sub"; }
