#!/bin/bash
# wsl_cleanup.sh — kill zombie processes, orphaned AI pollers, stale browser instances
# Usage: bash ~/.config/tmux/bin/wsl_cleanup.sh [--dry-run]

DRY=${1:-}
KILLED=0
FREED=0

log()  { echo "  $1"; }
kill_pid() {
    local pid=$1 label=$2
    if [[ "$DRY" == "--dry-run" ]]; then
        log "DRY  pid=$pid  $label"
    else
        kill "$pid" 2>/dev/null && { log "KILL pid=$pid  $label"; ((KILLED++)); }
    fi
}

echo ""
echo "WSL Cleanup"
echo "==========="

# ── 1. Zombie processes ────────────────────────────────────────────────────────
echo ""
echo "► Zombies"
while IFS= read -r line; do
    pid=$(echo "$line" | awk '{print $2}')
    ppid=$(echo "$line" | awk '{print $3}')
    cmd=$(echo "$line" | awk '{print $11}')
    log "zombie pid=$pid ppid=$ppid cmd=$cmd"
    # Kill the parent to let it reap the zombie
    if [[ "$DRY" != "--dry-run" ]]; then
        kill "$ppid" 2>/dev/null && ((KILLED++))
    fi
done < <(ps aux | awk '$8=="Z" {print}')

# ── 2. Orphaned Claude / Kiro bash pollers ────────────────────────────────────
# These are backgrounded bash shells sourcing Claude shell-snapshots, stuck in
# sleep/until loops from sessions that have already ended.
echo ""
echo "► Orphaned AI bash pollers (no tty, sourcing shell-snapshot)"
MY_SID=$(ps -o sid= -p $$)
while IFS= read -r line; do
    pid=$(echo "$line" | awk '{print $2}')
    sid=$(ps -o sid= -p "$pid" 2>/dev/null | tr -d ' ')
    # Skip if same session as us
    [[ "$sid" == "$MY_SID" ]] && continue
    # Skip tmux status bar scripts (cpu_usage, ram_usage)
    cmd=$(ps -o args= -p "$pid" 2>/dev/null)
    echo "$cmd" | grep -qE 'cpu_usage|ram_usage|title_sync|float_term|dispatch|open_path|paste_image|actions_popup' && continue
    kill_pid "$pid" "$(echo "$cmd" | cut -c1-80)"
done < <(ps aux | awk '$7=="?" && ($11=="/bin/bash" || $11=="bash" || $11=="/bin/sh" || $11=="sh") {print}')

# ── 3. Stale Playwright / browser processes ───────────────────────────────────
echo ""
echo "► Stale Playwright / browser processes"
while IFS= read -r line; do
    pid=$(echo "$line" | awk '{print $2}')
    cpu=$(echo "$line" | awk '{print $3}')
    cmd=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf $i" "; print ""}' | cut -c1-80)
    # Only kill if CPU is near-zero (idle/zombie browser, not actively used)
    cpu_int=${cpu%.*}
    if [[ "$cpu_int" -lt 1 ]]; then
        kill_pid "$pid" "$cmd"
    else
        log "SKIP pid=$pid (cpu=${cpu}% — active)  $cmd"
    fi
done < <(ps aux | grep -iE 'playwright|chromium-browser|chrome.*remote-debugging|firefox.*headless|webkit' | grep -v grep)

# ── 4. Orphaned Node processes from dead Claude/Kiro task runners ─────────────
echo ""
echo "► Orphaned node task runners"
while IFS= read -r line; do
    pid=$(echo "$line" | awk '{print $2}')
    tty=$(echo "$line" | awk '{print $7}')
    cmd=$(ps -o args= -p "$pid" 2>/dev/null | cut -c1-80)
    [[ "$tty" != "?" ]] && continue  # skip if has a tty (active terminal)
    echo "$cmd" | grep -qE 'claude|kiro|playwright-cli|\.claude' || continue
    kill_pid "$pid" "$cmd"
done < <(ps aux | grep -iE '\bnode\b' | grep -v grep)

# ── 5. Clean up stale /tmp files ─────────────────────────────────────────────
echo ""
echo "► Stale /tmp files"
TMP_DIRS=$(find /tmp -maxdepth 1 -name 'claude-1000' -o -name '.com.google.Chrome*' -o -name 'playwright*' 2>/dev/null)
for dir in $TMP_DIRS; do
    size=$(du -sh "$dir" 2>/dev/null | cut -f1)
    if [[ "$DRY" == "--dry-run" ]]; then
        log "DRY  $dir  ($size)"
    else
        # Only remove task output dirs older than 1 hour
        find "$dir" -maxdepth 3 -name '*.output' -mmin +60 -delete 2>/dev/null
        find "$dir" -maxdepth 3 -name '*.yml' -path '*playwright-cli*' -mmin +60 -delete 2>/dev/null
        log "CLEAN $dir  ($size freed est.)"
    fi
done

# ── 6. Drop reclaimable page cache ───────────────────────────────────────────
# Frees buff/cache that Linux holds speculatively — safe, kernel re-populates on demand
echo ""
echo "► Page cache / memory reclaim"
if [[ "$DRY" == "--dry-run" ]]; then
    log "DRY  drop pagecache (echo 1 > /proc/sys/vm/drop_caches)"
    log "DRY  swappiness → 10 (currently $(cat /proc/sys/vm/swappiness))"
else
    if sudo sysctl -w vm.drop_caches=1; then
        log "Dropped pagecache"
    else
        log "SKIP drop_caches (sudo failed)"
    fi
    if sudo sysctl -w vm.swappiness=10; then
        log "swappiness → 10"
    else
        log "SKIP swappiness (sudo failed)"
    fi
    # Compact WSL2 memory balloon — returns freed pages to Windows
    # WSL_DISTRO_NAME is set by WSL itself — no need to query wsl -l
    distro="${WSL_DISTRO_NAME:-Ubuntu}"
    powershell.exe -NoProfile -Command "wsl.exe --manage '$distro' --set-sparse true" 2>/dev/null \
        && log "WSL2 balloon compacted ($distro)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "==========="
if [[ "$DRY" == "--dry-run" ]]; then
    echo "Dry run complete — no processes killed."
else
    echo "Done. Killed $KILLED process(es)."
    echo ""
    echo "RAM before → after:"
    free -h | grep Mem
fi
echo ""
echo "Tip: run 'wsl --shutdown' from Windows to fully reclaim balloon RAM."
echo ""
