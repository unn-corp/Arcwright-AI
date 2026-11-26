#!/usr/bin/env bash
# Loop budget/state helper — deterministic time + loop accounting.
# Shared verbatim by the bug-hunt-loop and dry-fix-loop skills (keep copies identical).
# The model cannot feel time passing; this script is the only source of truth
# for "may I start another loop?".
#
#   budget.sh init [--duration 2h30m] [--loops N] [--until "17:30"|ISO|"tomorrow 9am"] [--dry-stop N]
#   budget.sh check          # exit 0 CONTINUE | exit 3 STOP (prints reason)
#   budget.sh remaining      # seconds left before the deadline (or "none"); WRAP_UP when <= 0
#   budget.sh loop-start     # bump loop counter, stamp loop start
#   budget.sh loop-end --confirmed N --fixed N
#   budget.sh set KEY VALUE  # persist e.g. BRANCH, BASE, PR_URL
#   budget.sh get KEY
#   budget.sh status
#   budget.sh dir            # print the state directory (ledger lives there too)
#
# State lives inside the git dir (never committed): <git-dir>/<skill-name>/state.env
# where <skill-name> is the directory containing scripts/. Override with LOOP_STATE_DIR.
set -euo pipefail

state_dir() {
  if [[ -n ${LOOP_STATE_DIR:-} ]]; then echo "$LOOP_STATE_DIR"; return; fi
  local skill; skill=$(basename "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)")
  echo "$(git rev-parse --absolute-git-dir)/$skill"
}
DIR=$(state_dir)
STATE="$DIR/state.env"
# GNU date is required for --until parsing (macOS: `brew install coreutils` → gdate).
if date -d @0 +%s >/dev/null 2>&1; then DATE=date
elif command -v gdate >/dev/null 2>&1; then DATE=gdate
else DATE=""; fi
need_gnu_date() { [[ -n $DATE ]] || { echo "GNU date required (macOS: brew install coreutils)" >&2; exit 2; }; }
now() { date +%s; }
fmt() { if [[ -n $DATE ]]; then $DATE -d "@$1" '+%Y-%m-%d %H:%M:%S %Z'; else date -r "$1" '+%Y-%m-%d %H:%M:%S %Z'; fi; }
human() { local s=$1 neg=""; (( s < 0 )) && { neg="-"; s=$(( -s )); }; printf '%s%dh%02dm%02ds' "$neg" $((s/3600)) $((s%3600/60)) $((s%60)); }

get() { [[ -f $STATE ]] || { echo "no loop state at $STATE; run init" >&2; exit 2; }; grep -E "^$1=" "$STATE" | tail -n1 | cut -d= -f2- || true; }
set_kv() {
  mkdir -p "$DIR"; touch "$STATE"
  local tmp; tmp=$(mktemp "$DIR/.state.XXXX")
  grep -vE "^$1=" "$STATE" > "$tmp" || true
  printf '%s=%s\n' "$1" "$2" >> "$tmp"
  mv "$tmp" "$STATE"
}

parse_duration() { # 90 (minutes), 90m, 2h, 1h30m, 45s, 1d
  local s=$1 total=0 rest n unit
  if [[ $s =~ ^[0-9]+$ ]]; then echo $(( s * 60 )); return; fi
  rest=$s
  while [[ $rest =~ ^([0-9]+)([dhms])(.*)$ ]]; do
    n=${BASH_REMATCH[1]}; unit=${BASH_REMATCH[2]}; rest=${BASH_REMATCH[3]}
    case $unit in d) total=$((total+n*86400));; h) total=$((total+n*3600));; m) total=$((total+n*60));; s) total=$((total+n));; esac
  done
  [[ -z $rest && $total -gt 0 ]] || { echo "invalid duration: '$s' (use e.g. 45m, 2h, 1h30m)" >&2; return 1; }
  echo "$total"
}

parse_until() { # anything GNU date -d accepts; a bare clock time already past rolls to tomorrow
  local t n; n=$(now); need_gnu_date
  t=$($DATE -d "$1" +%s 2>/dev/null) || { echo "invalid end time: '$1'" >&2; return 1; }
  if (( t <= n )) && [[ $1 =~ ^[0-9]{1,2}(:[0-9]{2})?[[:space:]]*([aApP][mM])?$ ]]; then
    t=$($DATE -d "tomorrow $1" +%s)
  fi
  (( t > n )) || { echo "end time is in the past: '$1' ($(fmt "$t"))" >&2; return 1; }
  echo "$t"
}

cmd_init() {
  local duration="" loops="" until="" dry=3
  while (( $# )); do
    case $1 in
      --duration) duration=$2; shift 2;;
      --loops) loops=$2; shift 2;;
      --until|--end) until=$2; shift 2;;
      --dry-stop) dry=$2; shift 2;;
      *) echo "unknown arg: $1" >&2; exit 2;;
    esac
  done
  [[ -z $loops || $loops =~ ^[1-9][0-9]*$ ]] || { echo "--loops must be a positive integer" >&2; exit 2; }
  [[ $dry =~ ^[0-9]+$ ]] || { echo "--dry-stop must be a non-negative integer" >&2; exit 2; }
  local start deadline="" d u
  start=$(now)
  if [[ -n $duration ]]; then d=$(parse_duration "$duration"); deadline=$(( start + d )); fi
  if [[ -n $until ]]; then u=$(parse_until "$until"); if [[ -z $deadline ]] || (( u < deadline )); then deadline=$u; fi; fi
  if [[ -z $loops && -z $deadline ]]; then
    loops=3; echo "NOTICE: no bound given — defaulting to --loops 3"
  fi
  mkdir -p "$DIR"; : > "$STATE"
  set_kv START "$start"; set_kv DEADLINE "$deadline"; set_kv MAX_LOOPS "$loops"
  set_kv DRY_STOP "$dry"; set_kv LOOP 0; set_kv LOOP_STARTED ""; set_kv LOOP_SECONDS_TOTAL 0
  set_kv CONFIRMED 0; set_kv FIXED 0; set_kv DRY_STREAK 0
  cmd_status
}

cmd_check() {
  local loop max deadline dry streak n total reserve avg remaining
  loop=$(get LOOP); max=$(get MAX_LOOPS); deadline=$(get DEADLINE)
  dry=$(get DRY_STOP); streak=$(get DRY_STREAK); total=$(get LOOP_SECONDS_TOTAL); n=$(now)
  if [[ -n $max ]] && (( loop >= max )); then echo "STOP reason=loop_limit loops=$loop/$max"; exit 3; fi
  if (( dry > 0 && streak >= dry )); then echo "STOP reason=saturated dry_streak=$streak (no confirmed bugs in $streak consecutive loops)"; exit 3; fi
  if [[ -n $deadline ]]; then
    remaining=$(( deadline - n ))
    # Reserve: don't start a loop we can't plausibly finish. Use the average loop
    # length (capped at 15m) once known, else 5m.
    if (( loop > 0 )); then avg=$(( total / loop )); reserve=$(( avg < 900 ? avg : 900 )); else reserve=300; fi
    (( reserve < 120 )) && reserve=120
    if (( remaining <= reserve )); then
      echo "STOP reason=time remaining=$(human "$remaining") reserve=$(human "$reserve") deadline=$(fmt "$deadline")"; exit 3
    fi
    echo "CONTINUE next_loop=$((loop+1))${max:+/$max} remaining=$(human "$remaining") deadline=$(fmt "$deadline")"
  else
    echo "CONTINUE next_loop=$((loop+1))/$max"
  fi
}

cmd_remaining() {
  local deadline; deadline=$(get DEADLINE)
  if [[ -z $deadline ]]; then echo "none"; return; fi
  local r=$(( deadline - $(now) ))
  if (( r <= 0 )); then echo "WRAP_UP over_by=$(human $(( -r )))"; else echo "$r ($(human "$r"))"; fi
}

cmd_loop_start() {
  local loop; loop=$(( $(get LOOP) + 1 ))
  set_kv LOOP "$loop"; set_kv LOOP_STARTED "$(now)"
  echo "LOOP $loop started $(fmt "$(now)")"
}

cmd_loop_end() {
  local confirmed=0 fixed=0
  while (( $# )); do
    case $1 in --confirmed) confirmed=$2; shift 2;; --fixed) fixed=$2; shift 2;; *) echo "unknown arg: $1" >&2; exit 2;; esac
  done
  local started dur
  started=$(get LOOP_STARTED); [[ -n $started ]] || { echo "loop-end without loop-start" >&2; exit 2; }
  dur=$(( $(now) - started ))
  set_kv LOOP_SECONDS_TOTAL $(( $(get LOOP_SECONDS_TOTAL) + dur )); set_kv LOOP_STARTED ""
  set_kv CONFIRMED $(( $(get CONFIRMED) + confirmed )); set_kv FIXED $(( $(get FIXED) + fixed ))
  if (( confirmed == 0 )); then set_kv DRY_STREAK $(( $(get DRY_STREAK) + 1 )); else set_kv DRY_STREAK 0; fi
  echo "LOOP $(get LOOP) ended in $(human "$dur") confirmed=$confirmed fixed=$fixed dry_streak=$(get DRY_STREAK)"
}

cmd_status() {
  local deadline max; deadline=$(get DEADLINE); max=$(get MAX_LOOPS)
  echo "state:      $STATE"
  echo "started:    $(fmt "$(get START)")"
  if [[ -n $deadline ]]; then echo "deadline:   $(fmt "$deadline") (remaining $(human $(( deadline - $(now) ))))"; else echo "deadline:   none"; fi
  echo "loops:      $(get LOOP)${max:+/$max}"
  echo "dry-stop:   $(get DRY_STOP) (streak $(get DRY_STREAK))"
  echo "confirmed:  $(get CONFIRMED)  fixed: $(get FIXED)"
  local k; for k in BRANCH BASE PR_URL; do [[ -n $(get "$k") ]] && printf '%-11s %s\n' "$(printf '%s' "$k" | tr '[:upper:]' '[:lower:]'):" "$(get "$k")"; done
  return 0
}

case ${1:-} in
  init) shift; cmd_init "$@";;
  check) cmd_check;;
  remaining) cmd_remaining;;
  loop-start) cmd_loop_start;;
  loop-end) shift; cmd_loop_end "$@";;
  set) set_kv "$2" "$3";;
  get) get "$2";;
  status) cmd_status;;
  dir) echo "$DIR";;
  *) sed -n '2,18p' "$0"; exit 2;;
esac
