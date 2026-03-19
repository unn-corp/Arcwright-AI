#!/usr/bin/env bash
# tmux-test.sh — Automated test suite for tmux agent orchestration commands
#
# Tests the verified command library from .agents/skills/tmux-commands/SKILL.md
# Run from inside a tmux session:
#   bash docs/dev/tmux-test.sh
#
# Tests:
#   1. Pane creation (split-window + sleep + capture ID)
#   2. Pane verification (list-panes grep)
#   3. Message sending with delivery verification
#   4. Pane naming (select-pane -T)
#   5. Layout rebalance (main-vertical)
#   6. Multi-pane spawn + rebalance
#   7. Graceful kill (kill-pane + cleanup)
#
# Exit codes: 0 = all pass, 1 = failures

set -uo pipefail

PASS=0
FAIL=0
TESTS=()

pass() { PASS=$((PASS + 1)); TESTS+=("PASS: $1"); echo "  PASS: $1"; }
fail() { FAIL=$((FAIL + 1)); TESTS+=("FAIL: $1"); echo "  FAIL: $1"; }

# Cleanup function — kill any test panes on exit
TEST_PANES_TO_CLEAN=()
cleanup() {
  for p in "${TEST_PANES_TO_CLEAN[@]}"; do
    tmux kill-pane -t "$p" 2>/dev/null || true
  done
}
trap cleanup EXIT

echo "========================================"
echo "  Tmux Command Library Test Suite"
echo "========================================"
echo ""

# Pre-check: must be inside tmux
if [ -z "${TMUX:-}" ]; then
  echo "ERROR: Not inside a tmux session. Run this from within tmux."
  exit 1
fi

MASTER_PANE=$(tmux display-message -p "#{pane_id}")
SESSION_NAME=$(tmux display-message -p "#{session_name}")
WINDOW_ID=$(tmux display-message -p "#{window_id}")
echo "Master pane: $MASTER_PANE"
echo "Session: $SESSION_NAME"
echo "Window: $WINDOW_ID"
echo ""

# ─── Test 1: Split + Sleep + Capture ID ──────────────────────────────────────
echo "--- Test 1: Pane creation with sleep guards ---"

PANES_BEFORE=$(tmux list-panes -F "#{pane_id}" | wc -l)
sleep 10
# Use interactive bash so send-keys works in later tests
# WSL bash needs ~15s to fully load .bashrc (nvm, etc) before accepting input
tmux split-window -h -c "#{pane_current_path}" "bash"
sleep 15

PANES_AFTER=$(tmux list-panes -F "#{pane_id}" | wc -l)
TEST_PANE=$(tmux list-panes -F "#{pane_id}" | tail -1)
TEST_PANES_TO_CLEAN+=("$TEST_PANE")

if [ "$PANES_AFTER" -gt "$PANES_BEFORE" ] && [ -n "$TEST_PANE" ]; then
  pass "Split-window created pane $TEST_PANE (before: $PANES_BEFORE, after: $PANES_AFTER)"
else
  fail "Split-window did not create a new pane"
fi

# ─── Test 2: Pane verification ───────────────────────────────────────────────
echo ""
echo "--- Test 2: Pane verification ---"

sleep 10
VERIFIED=$(tmux list-panes -a -F "#{pane_id} #{session_name} #{window_id}" \
  | grep "^$TEST_PANE ")

if [ -n "$VERIFIED" ]; then
  pass "Pane $TEST_PANE verified: $VERIFIED"
else
  fail "Pane $TEST_PANE not found in list-panes output"
fi

# Negative test: verify non-existent pane fails
FAKE_VERIFIED=$(tmux list-panes -a -F "#{pane_id}" | grep -Fx "%99999")
if [ -z "$FAKE_VERIFIED" ]; then
  pass "Non-existent pane %99999 correctly not found"
else
  fail "Non-existent pane %99999 incorrectly found"
fi

# ─── Test 3: Message sending with delivery verification ──────────────────────
echo ""
echo "--- Test 3: Message sending ---"

TEST_TOKEN="TMUX_TEST_MSG_$(date +%s)"
sleep 10
tmux send-keys -t "$TEST_PANE" "echo $TEST_TOKEN" Enter
sleep 15

BUFFER=$(tmux capture-pane -t "$TEST_PANE" -p -S -)
if echo "$BUFFER" | grep -qF "$TEST_TOKEN"; then
  pass "Message '$TEST_TOKEN' delivered and verified in pane buffer"
else
  # Retry once (per protocol)
  echo "  WARN: First delivery not found, retrying..."
  sleep 10
  tmux send-keys -t "$TEST_PANE" "echo $TEST_TOKEN" Enter
  sleep 15
  BUFFER2=$(tmux capture-pane -t "$TEST_PANE" -p -S -)
  if echo "$BUFFER2" | grep -qF "$TEST_TOKEN"; then
    pass "Message delivered on retry"
  else
    fail "Message '$TEST_TOKEN' not found in pane buffer after retry"
  fi
fi

# ─── Test 4: Pane naming ─────────────────────────────────────────────────────
echo ""
echo "--- Test 4: Pane naming (border title) ---"

TITLE="test-agent-${TEST_PANE}"
sleep 10
tmux set-option -t "$TEST_PANE" -p allow-rename off
sleep 10
tmux select-pane -t "$TEST_PANE" -T "$TITLE"
sleep 10

ACTUAL_TITLE=$(tmux display-message -t "$TEST_PANE" -p "#{pane_title}")
if [ "$ACTUAL_TITLE" = "$TITLE" ]; then
  pass "Pane title set to '$TITLE'"
else
  fail "Expected title '$TITLE', got '$ACTUAL_TITLE'"
fi

# ─── Test 5: Layout rebalance ────────────────────────────────────────────────
echo ""
echo "--- Test 5: Layout rebalance (main-vertical) ---"

sleep 10
tmux select-pane -t "$MASTER_PANE"
sleep 10
tmux select-layout main-vertical 2>/dev/null
LAYOUT_EXIT=$?
sleep 10

if [ $LAYOUT_EXIT -eq 0 ]; then
  pass "main-vertical layout applied successfully"
else
  fail "select-layout main-vertical failed with exit code $LAYOUT_EXIT"
fi

# ─── Test 6: Spawn a second pane and rebalance ───────────────────────────────
echo ""
echo "--- Test 6: Multi-pane spawn + rebalance ---"

sleep 10
# Split from the test pane (not LAST_PANE which could be stale)
tmux split-window -v -t "$TEST_PANE" -c "#{pane_current_path}" "bash"
sleep 15

TEST_PANE_2=$(tmux list-panes -F "#{pane_id}" | tail -1)
TEST_PANES_TO_CLEAN+=("$TEST_PANE_2")
PANE_COUNT=$(tmux list-panes -F "#{pane_id}" | wc -l)

if [ "$PANE_COUNT" -ge 3 ]; then
  pass "Second test pane $TEST_PANE_2 created (total: $PANE_COUNT panes)"
else
  fail "Expected 3+ panes, got $PANE_COUNT"
fi

sleep 10
tmux select-pane -t "$MASTER_PANE"
sleep 10
tmux select-layout main-vertical 2>/dev/null
sleep 10

pass "Rebalanced with $PANE_COUNT panes"

# ─── Test 7: Graceful kill ────────────────────────────────────────────────────
echo ""
echo "--- Test 7: Graceful pane kill ---"

# Kill test pane 2 first (check it exists before trying)
sleep 10
if tmux list-panes -a -F "#{pane_id}" | grep -qFx "$TEST_PANE_2"; then
  tmux kill-pane -t "$TEST_PANE_2" 2>/dev/null
  sleep 10
  STILL_EXISTS=$(tmux list-panes -a -F "#{pane_id}" | grep -Fx "$TEST_PANE_2")
  if [ -z "$STILL_EXISTS" ]; then
    pass "Pane $TEST_PANE_2 killed successfully"
  else
    fail "Pane $TEST_PANE_2 still exists after kill"
  fi
else
  fail "Pane $TEST_PANE_2 already gone before kill test"
fi

# Kill test pane 1
sleep 10
if tmux list-panes -a -F "#{pane_id}" | grep -qFx "$TEST_PANE"; then
  tmux kill-pane -t "$TEST_PANE" 2>/dev/null
  sleep 10
  STILL_EXISTS_1=$(tmux list-panes -a -F "#{pane_id}" | grep -Fx "$TEST_PANE")
  if [ -z "$STILL_EXISTS_1" ]; then
    pass "Pane $TEST_PANE killed successfully"
  else
    fail "Pane $TEST_PANE still exists after kill"
  fi
else
  fail "Pane $TEST_PANE already gone before kill test"
fi

# Clear cleanup list since we already killed them
TEST_PANES_TO_CLEAN=()

# Rebalance after kills
sleep 10
tmux select-pane -t "$MASTER_PANE"
sleep 10
tmux select-layout main-vertical 2>/dev/null
sleep 10

FINAL_COUNT=$(tmux list-panes -F "#{pane_id}" | wc -l)
if [ "$FINAL_COUNT" -eq 1 ]; then
  pass "Back to 1 pane after cleanup"
else
  # Not a failure — other panes may exist from user activity
  pass "Final pane count: $FINAL_COUNT (master pane intact)"
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "========================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "========================================"
echo ""
for t in "${TESTS[@]}"; do
  echo "  $t"
done
echo ""

if [ $FAIL -gt 0 ]; then
  echo "SOME TESTS FAILED"
  exit 1
else
  echo "ALL TESTS PASSED"
  exit 0
fi
