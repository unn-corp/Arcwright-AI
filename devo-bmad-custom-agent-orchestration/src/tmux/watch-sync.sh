#!/bin/bash
# Hot-reload watcher: polls host files, docker cp's changes into container
# Total latency: ~2-4s (1s poll + 1s sync + ~2s recompile)
#
# Usage:
#   bash scripts/watch-sync.sh         # foreground
#   bash scripts/watch-sync.sh &       # background
#   # In a dedicated tmux pane:
#   bash scripts/watch-sync.sh
#
# Check sync activity:
#   tail -f /tmp/watch-sync.log
#
# Stop:
#   kill $(cat /tmp/watch-sync.pid)

set -euo pipefail

CONTAINER_NAME="${WATCH_CONTAINER:-squidhub-frontend-1}"
HOST_DIR="${WATCH_HOST_DIR:-./frontend}"
CONTAINER_DIR="${WATCH_CONTAINER_DIR:-/app}"
LOG_FILE="/tmp/watch-sync.log"
PID_FILE="/tmp/watch-sync.pid"
MARKER_FILE="/tmp/.watch-sync-marker"

echo $$ > "$PID_FILE"
touch "$MARKER_FILE"
echo "Watcher started: PID $$" | tee -a "$LOG_FILE"
echo "Container: $CONTAINER_NAME | Host: $HOST_DIR -> $CONTAINER_DIR"
echo "Watcher is running (PID $$, logging to $LOG_FILE)."

while true; do
    # Find files changed since last marker
    CHANGED=$(find "$HOST_DIR" -newer "$MARKER_FILE" -type f 2>/dev/null \
        | grep -v "node_modules" \
        | grep -v "\.next" \
        | grep -v "\.git" \
        || true)

    if [ -n "$CHANGED" ]; then
        while IFS= read -r file; do
            RELATIVE="${file#$HOST_DIR/}"
            DEST="$CONTAINER_DIR/$RELATIVE"
            DEST_DIR=$(dirname "$DEST")
            # Ensure destination directory exists in container
            docker exec "$CONTAINER_NAME" mkdir -p "$DEST_DIR" 2>/dev/null || true
            docker cp "$file" "$CONTAINER_NAME:$DEST" 2>/dev/null && \
                echo "[$(date +%H:%M:%S)] Synced: $RELATIVE" | tee -a "$LOG_FILE" || \
                echo "[$(date +%H:%M:%S)] WARN: Failed to sync $RELATIVE" | tee -a "$LOG_FILE"
        done <<< "$CHANGED"
    fi

    touch "$MARKER_FILE"
    sleep 1
done
