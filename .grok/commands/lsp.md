---
description: Run live LSP/compiler diagnostics on changed files and fix errors in a loop — TypeScript (tsc) and Python (pyright/mypy)
---

# /lsp — Live Compiler Diagnostics

Load the `lsp-diagnostics` skill and run type-checking on changed files. Fixes errors one at a time until clean or a stall is detected.

## Instructions

### Step 1: Load the skill

Read `.agents/skills/lsp-diagnostics/SKILL.md` for full detection, invocation, and fix-loop protocol.

### Step 2: Detect language and tools

```bash
# TypeScript?
[ -f tsconfig.json ] && echo "ts-project"
npx tsc --version 2>/dev/null

# Python?
[ -f pyproject.toml ] || [ -f setup.py ] || [ -f requirements.txt ] && echo "py-project"
pyright --version 2>/dev/null || npx pyright --version 2>/dev/null
```

### Step 3: Run diagnostics on target

If `$ARGUMENTS` is provided, scope to those files/dirs. Otherwise run full project check.

**TypeScript:**
```bash
npx tsc --noEmit --pretty false $ARGUMENTS 2>&1
```

**Python:**
```bash
pyright --outputjson $ARGUMENTS 2>/dev/null
```

### Step 4: Fix loop

1. Parse errors from output.
2. Fix the first error (one at a time — see skill for systematic-debugging rules).
3. Re-run diagnostics.
4. Repeat until error count = 0 or stall detected (3 passes, no improvement).

### Step 5: Report

- State final error count (0 = clean).
- If stalled, list remaining errors and explain what would need to change.
- If a tool is missing, give the install command.

## Arguments

`$ARGUMENTS` — optional file(s) or directory to scope the check. If empty, checks the whole project.
