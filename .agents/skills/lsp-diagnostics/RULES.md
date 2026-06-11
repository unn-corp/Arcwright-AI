# LSP Diagnostics — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Always run diagnostics AFTER edits, not before — the pre-edit state is irrelevant
- One error at a time: fix the first reported error, re-run, repeat — never attempt batch fixes
- Stop after 3 passes with no error reduction; report stall instead of looping forever
- Scope diagnostics to changed files when possible — full-project runs are slower and noisier
- Fix at source, not symptom — trace the error to its origin (type mismatch, missing import, wrong signature)
- Never suppress errors with `// @ts-ignore`, `# type: ignore`, or `any` casts just to pass the check
- Cross-reference `typescript-best-practices` RULES.md before fixing TS errors
- Cross-reference `python-backend` RULES.md before fixing Python errors in backend code
- Prefer `pyright --outputjson` over mypy — structured JSON is easier to parse and more precise

## Detection Priority
- **TypeScript:** `npx tsc --version` → if missing, `npm install --save-dev typescript`
- **Python:** `pyright --version` → fallback to `mypy --version` → fallback to report unavailability

## Red Flags (stop and apply skill)
- About to commit/ship code that hasn't been type-checked
- Error count is increasing after a fix (introduced regression)
- Same error appearing in 3+ different files (systemic type issue — fix the shared type, not each callsite)
- `any` or `object` used to silence a type error instead of fixing the root cause
