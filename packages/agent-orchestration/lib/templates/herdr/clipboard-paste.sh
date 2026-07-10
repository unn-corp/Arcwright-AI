#!/usr/bin/env bash
set -euo pipefail

# Resolve the herdr binary via the path herdr injects; the detached keybind
# process herdr spawns may not have ~/.local/bin on PATH.
HERDR="${HERDR_BIN_PATH:-herdr}"
# When herdr replaces its on-disk binary during an update while the server keeps
# running, current_exe() (and thus HERDR_BIN_PATH) resolves to a stale
# "…/herdr (deleted)" path that no longer executes — so `herdr pane send-text`
# below silently fails and nothing pastes. Recover the real path by stripping the
# " (deleted)" suffix (the new binary lives at that same path); the keybind
# process often lacks ~/.local/bin on PATH, so `command -v herdr` alone is not
# enough. Keeps paste working across updates without a server restart.
if [[ ! -x "$HERDR" ]]; then
  stripped="${HERDR% (deleted)}"
  if [[ -x "$stripped" ]]; then
    HERDR="$stripped"
  else
    HERDR="$(command -v herdr 2>/dev/null || echo "$HOME/.local/bin/herdr")"
  fi
fi

pane="${HERDR_ACTIVE_PANE_ID:-}"
if [[ -z "$pane" ]]; then
  "$HERDR" notification show "Paste failed" --body "No active Herdr pane" --sound none
  exit 1
fi

types="$(wl-paste --list-types 2>/dev/null || true)"
if [[ -z "$types" ]]; then
  "$HERDR" notification show "Paste failed" --body "The clipboard is empty or unavailable" --sound none
  exit 1
fi

mime=""
extension=""
for candidate in image/png image/jpeg image/webp image/gif image/bmp; do
  if grep -Fxq "$candidate" <<<"$types"; then
    mime="$candidate"
    extension="${candidate#image/}"
    [[ "$extension" == jpeg ]] && extension="jpg"
    break
  fi
done

if [[ -n "$mime" ]]; then
  directory="$HOME/.cache/herdr/clipboard-images"
  mkdir -p "$directory"
  image="$(mktemp --tmpdir="$directory" "clipboard-XXXXXXXX.$extension")"
  if ! wl-paste --type "$mime" >"$image" || [[ ! -s "$image" ]]; then
    rm -f "$image"
    "$HERDR" notification show "Image paste failed" --body "Could not read $mime from the clipboard" --sound none
    exit 1
  fi
  content="Please inspect this image: $image"
else
  text_mime=""
  for candidate in 'text/plain;charset=utf-8' text/plain UTF8_STRING STRING; do
    if grep -Fxq "$candidate" <<<"$types"; then
      text_mime="$candidate"
      break
    fi
  done
  if [[ -z "$text_mime" ]]; then
    "$HERDR" notification show "Paste failed" --body "Clipboard has no supported text or image data" --sound none
    exit 1
  fi
  content="$(wl-paste --no-newline --type "$text_mime")"
fi

"$HERDR" pane send-text "$pane" $'\e[200~'"$content"$'\e[201~'
