#!/usr/bin/env bash
# Run tests individually to find which creates unwanted files/state.
# Usage: bash find-polluter.sh <file_or_dir_to_check> <test_pattern>
# Example: bash find-polluter.sh '.git' 'src/**/*.test.ts'

set -e

if [ $# -ne 2 ]; then
  echo "Usage: $0 <file_to_check> <test_pattern>"
  echo "Example: $0 '.git' 'src/**/*.test.ts'"
  exit 1
fi

POLLUTION_CHECK="$1"
TEST_PATTERN="$2"

# Tests can create files of their own. Never run them from an installed skill
# tree; invoke this helper by absolute path from the application/isolated fixture.
RUN_DIRECTORY="$(pwd -P)"
case "$RUN_DIRECTORY/" in
  */.agents/skills/*|*/.agent/skills/*|*/.claude/skills/*|*/.codex/skills/*|*/.kiro/skills/*|*/.hermes/skills/*|*/.grok/skills/*|*/.opencode/skills/*|*/_arcwright/_memory/skills/*)
    echo "Skill installations are read-only. Run from the active project or an Arcwright run fixture."
    exit 2
    ;;
esac
# Plugin caches can use arbitrary directory names. A SKILL.md ancestor still
# identifies the read-only bundle even when no host-specific path is present.
SCAN_DIRECTORY="$RUN_DIRECTORY"
while :; do
  if [ -f "$SCAN_DIRECTORY/SKILL.md" ]; then
    echo "Skill installations are read-only. Run tests from the active project or an Arcwright run fixture."
    exit 2
  fi
  SCAN_PARENT="$(dirname "$SCAN_DIRECTORY")"
  [ "$SCAN_PARENT" = "$SCAN_DIRECTORY" ] && break
  SCAN_DIRECTORY="$SCAN_PARENT"
done

echo "🔍 Searching for test that creates: $POLLUTION_CHECK"
echo "Test pattern: $TEST_PATTERN"
echo ""

# find emits ./-prefixed paths and **/ does not match zero directory levels.
# Accept either prefix and include files directly under the base directory.
# A NUL-delimited array preserves spaces in test filenames without sort -z,
# which is not available in every supported shell environment.
TEST_PATTERN="${TEST_PATTERN#./}"
TEST_FILES=()
while IFS= read -r -d '' TEST_FILE; do
  TEST_FILES+=("$TEST_FILE")
done < <(find . -type f \( -path "./$TEST_PATTERN" -o -path "./${TEST_PATTERN//\*\*\//}" \) -print0)
TOTAL=${#TEST_FILES[@]}

echo "Found $TOTAL test files"
echo ""

if [ "$TOTAL" -eq 0 ]; then
  echo "No matching test files; no tests were run. Check the pattern."
  exit 2
fi

if [ -e "$POLLUTION_CHECK" ]; then
  echo "Pollution already exists; use a clean fixture before testing."
  exit 2
fi

COUNT=0
for TEST_FILE in "${TEST_FILES[@]}"; do
  COUNT=$((COUNT + 1))

  # A concurrently-created marker cannot be attributed to the next test.
  if [ -e "$POLLUTION_CHECK" ]; then
    echo "⚠️  Pollution already exists before test $COUNT/$TOTAL"
    echo "   Cannot isolate: $TEST_FILE"
    exit 2
  fi

  echo "[$COUNT/$TOTAL] Testing: $TEST_FILE"

  # Run the test
  npm test "$TEST_FILE" > /dev/null 2>&1 || true

  # Check if pollution appeared
  if [ -e "$POLLUTION_CHECK" ]; then
    echo ""
    echo "🎯 FOUND POLLUTER!"
    echo "   Test: $TEST_FILE"
    echo "   Created: $POLLUTION_CHECK"
    echo ""
    echo "Pollution details:"
    ls -la "$POLLUTION_CHECK"
    echo ""
    echo "To investigate:"
    echo "  npm test $TEST_FILE    # Run just this test"
    echo "  cat $TEST_FILE         # Review test code"
    exit 1
  fi
done

echo ""
echo "✅ No polluter found - all tests clean!"
exit 0
