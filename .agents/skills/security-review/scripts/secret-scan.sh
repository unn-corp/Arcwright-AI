#!/usr/bin/env bash
# Status-only screening: never forward scanner output, including error messages.
# 0 = completed without candidates; 1 = candidates; 2 = missing tool or scan error.
set +x
set -u

if [[ $# -ne 2 ]]; then
  printf '%s\n' 'Usage: bash secret-scan.sh files|git|image TARGET' >&2
  exit 2
fi
mode=$1
target=$2
candidates=0
incomplete=0

scan_status() {
  local label=$1 findings_exit=$2 tool=$3 status
  shift 3
  if ! command -v "$tool" >/dev/null 2>&1; then
    printf '%s: unavailable (not installed)\n' "$label"
    incomplete=1
    return
  fi
  if "$tool" "$@" >/dev/null 2>&1; then
    printf '%s: completed; no candidates reported in selected scope\n' "$label"
  else
    status=$?
    if [[ $status -eq $findings_exit ]]; then
      printf '%s: candidates found; values suppressed, verification required\n' "$label"
      candidates=1
    else
      printf '%s: scan error (exit %s); coverage incomplete\n' "$label" "$status"
      incomplete=1
    fi
  fi
}

case "$mode" in
  files|git)
    if ! cd -- "$target" >/dev/null 2>&1; then
      printf '%s\n' 'Scan error: target directory unavailable' >&2
      exit 2
    fi
    if [[ $mode == git ]]; then
      scan_status 'gitleaks history' 3 gitleaks git . --no-banner --redact=100 --exit-code=3
    else
      scan_status 'gitleaks files' 3 gitleaks dir . --no-banner --redact=100 --exit-code=3
      scan_status 'trufflehog files' 183 trufflehog filesystem . --no-update --no-verification --fail --fail-on-scan-errors
    fi
    ;;
  image)
    scan_status 'trufflehog image' 183 trufflehog docker "--image=$target" --no-update --no-verification --fail --fail-on-scan-errors
    ;;
  *)
    printf '%s\n' 'Scan error: expected files, git, or image mode' >&2
    exit 2
    ;;
esac

if [[ $incomplete -ne 0 ]]; then exit 2; fi
exit "$candidates"
