---
name: "lsp-diagnostics"
description: "Use when validating code edits against real compiler/type-checker output — TypeScript (tsc / typescript-language-server) and Python (pyright). Wire live diagnostics into the fix loop instead of guessing at static errors."
allowed-tools: Bash, Read, Edit, Write
---

# LSP Diagnostics Skill

Wire language-server diagnostics into the agent fix loop so edits are validated against real compiler output, not guessed. CLI-driven (no persistent daemon required). Cross-platform: WSL2 / Linux / macOS.

---

## TypeScript Diagnostics

### Detection

```bash
# Preferred: typescript-language-server (LSP CLI mode)
npx --yes typescript-language-server --version 2>/dev/null
# Fallback: tsc from local or global install
npx tsc --version 2>/dev/null || tsc --version 2>/dev/null
```

### Invoke — changed files only

```bash
# Fast: type-check only the files you touched (no emit)
npx tsc --noEmit --pretty false 2>&1

# Structured JSON output (TS 4.7+)
npx tsc --noEmit --pretty false 2>&1 | grep -E "^.+\([0-9]+,[0-9]+\): error TS"
```

Parse format: `<file>(<line>,<col>): error TS<code>: <message>`

### Scope to changed files

When only a subset of files changed, pass them directly. tsc respects `--isolatedModules` or just accepts file list:

```bash
# Single file
npx tsc --noEmit --pretty false path/to/changed.ts 2>&1

# Multiple files (still uses tsconfig for lib/types)
npx tsc --noEmit --pretty false src/a.ts src/b.ts 2>&1
```

> Note: passing explicit files skips `tsconfig.json` path/exclude rules. For full project check, omit file args.

### Structured output via `tsc --listFilesOnly` + grep

```bash
# Count errors before/after fix
ERROR_COUNT=$(npx tsc --noEmit 2>&1 | grep -c "error TS")
echo "Errors: $ERROR_COUNT"
```

### Fix loop protocol

1. Run `tsc --noEmit` — capture output.
2. Parse each `error TS<code>` line: extract file, line, col, message.
3. Apply the minimal fix (one error at a time — follow systematic-debugging rules).
4. Re-run `tsc --noEmit`. Stop when exit code 0.
5. If error count is not decreasing after 3 passes, stop and report — do not loop indefinitely.

### Common TS error codes

| Code | Meaning | Typical fix |
|------|---------|------------|
| TS2304 | Cannot find name | Import missing or typo |
| TS2339 | Property does not exist | Wrong type or missing property |
| TS2345 | Argument not assignable | Type mismatch — narrow or fix type |
| TS2322 | Type not assignable to | Assignment mismatch |
| TS7006 | Parameter implicitly `any` | Add explicit type annotation |

### Graceful degradation

| Scenario | Fallback |
|----------|---------|
| `tsc` not found | `npm install --save-dev typescript` then retry |
| No `tsconfig.json` | Run `npx tsc --init` or note unavailability |
| Project uses Babel/SWC only | Note: no TS type-checking available; suggest adding `tsc --noEmit` as check step |

---

## Python Diagnostics

### Detection

```bash
# Preferred: pyright (Microsoft, structured JSON output)
pyright --version 2>/dev/null || npx --yes pyright --version 2>/dev/null

# Fallback: mypy
mypy --version 2>/dev/null
```

### Invoke — structured JSON (pyright)

```bash
# Full project
pyright --outputjson 2>/dev/null

# Single file or directory
pyright --outputjson src/mymodule.py 2>/dev/null
pyright --outputjson src/ 2>/dev/null
```

JSON schema (key fields):

```json
{
  "generalDiagnostics": [
    {
      "file": "/abs/path/to/file.py",
      "severity": "error",
      "message": "...",
      "range": { "start": { "line": 4, "character": 2 } }
    }
  ],
  "summary": { "errorCount": 3, "warningCount": 1 }
}
```

Parse with:

```bash
pyright --outputjson 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
for d in data.get('generalDiagnostics', []):
    if d['severity'] == 'error':
        f = d['file']; ln = d['range']['start']['line'] + 1
        print(f\"{f}:{ln}: {d['message']}\")
print('Errors:', data['summary']['errorCount'])
"
```

### Invoke — human output (mypy fallback)

```bash
mypy src/ --ignore-missing-imports 2>&1
# Parse: <file>:<line>: error: <message>
```

### Fix loop protocol

1. Run `pyright --outputjson` — parse `generalDiagnostics` where `severity == "error"`.
2. Fix one error at a time. Cross-reference `python-backend` skill for async/Pydantic patterns.
3. Re-run. Stop at `errorCount == 0`.
4. If stalled (same errors after 3 passes), stop and report.

### Common pyright error categories

| Category | Meaning | Typical fix |
|----------|---------|------------|
| `reportMissingImports` | Import not found | Install package or fix path |
| `reportGeneralTypeIssues` | Type incompatibility | Annotate or narrow type |
| `reportArgumentType` | Wrong arg type | Fix call site or update signature |
| `reportReturnType` | Return type mismatch | Fix return or annotate `-> None` |
| `reportOptionalMemberAccess` | `None` not guarded | Add `if x is not None:` guard |

### Graceful degradation

| Scenario | Fallback |
|----------|---------|
| `pyright` not found | `pip install pyright` or `npm i -g pyright`; if neither works → use mypy |
| `mypy` not found | `pip install mypy`; if absent → note no static checking available |
| Python not found | Report: "Python not installed — cannot run type checks" |

---

## Cross-language Fix Loop (general pattern)

```
┌─────────────────────────────────────┐
│  1. Collect diagnostics (tsc/pyright) │
│  2. If errorCount == 0 → done ✓      │
│  3. Fix top error (one at a time)    │
│  4. Re-run diagnostics              │
│  5. If no improvement after 3× → stop│
└─────────────────────────────────────┘
```

Apply systematic-debugging rules: fix at source, not symptom. Never bundle multiple fixes.

---

## Integration Notes

- Load `typescript-best-practices` skill before fixing TS errors — many errors have idiomatic TS solutions.
- Load `python-backend` skill before fixing Python errors in FastAPI/SQLAlchemy code.
- In CI or pre-commit hooks, prefer `tsc --noEmit` and `pyright --outputjson` over IDE-only checks.
- On WSL2: `npx tsc` uses Linux Node; ensure `node_modules/.bin/tsc` exists in the project.
