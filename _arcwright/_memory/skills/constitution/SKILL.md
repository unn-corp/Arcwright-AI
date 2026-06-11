---
name: "constitution"
description: "Use when you need to create, update, validate, or propagate a project's CONSTITUTION.md — the versioned, checked-in document of standing non-negotiables (test discipline, security posture, house conventions)."
allowed-tools: Read, Write, Edit, Bash, Glob
---

# constitution

A project's `CONSTITUTION.md` is its versioned document of standing non-negotiables.
It lives at `_arcwright-output/planning/CONSTITUTION.md` and is checked in (or
committed alongside other planning docs). When it changes, downstream artifacts re-check
against it.

---

## 1. What Belongs in a Constitution

**Non-negotiables only** — rules the team will never override without a formal version bump.

| Category | Examples |
|----------|---------|
| Test discipline | "All public APIs have unit tests. No untested code ships." |
| Security posture | "No secrets in source. All inputs validated at boundary." |
| House conventions | "TypeScript strict mode. No `any`. Files < 300 lines." |
| Architecture invariants | "No direct DB calls outside the repository layer." |
| Review gates | "Security review required for all auth / file-op changes." |

**Does NOT belong:**
- Project roadmap or milestones (→ `ROADMAP.md`)
- Decisions with rationale (→ `DECISIONS.md`)
- Coding style preferences (→ project `.eslintrc` / `CLAUDE.md`)
- Tasks or sprint items (→ sprint plan)

---

## 2. Semantic Versioning Rules

Constitution uses `MAJOR.MINOR.PATCH`:

| Bump | When |
|------|------|
| **MAJOR** | A non-negotiable is **removed** or **weakened** (e.g., "tests required" → "tests recommended"). Breaking change to standing policy. |
| **MINOR** | A new non-negotiable is **added** (new category or new rule). |
| **PATCH** | Wording clarified, formatting fixed, no policy change. |

**Bump discipline:** Downstream artifacts that reference the constitution version should re-validate when MAJOR or MINOR bumps. PATCH bumps need no re-check.

---

## 3. Create Procedure (`/constitution create`)

1. Read `_arcwright-output/planning/` — check if `CONSTITUTION.md` already exists.
   - If yes: abort and offer `/constitution update` instead.
2. Gather context: read `CLAUDE.md`, `.kiro/steering/*.md`, any existing `DECISIONS.md`.
3. Draft the constitution using the template in §6.
4. **Starting version: `1.0.0`**
5. Write to `_arcwright-output/planning/CONSTITUTION.md`.
6. Write a `D-` entry to `DECISIONS.md`: "Initialised constitution v1.0.0."
7. Present the draft to the user for approval before writing (use `plan` mode if available).

---

## 4. Update Procedure (`/constitution update`)

1. Read current `CONSTITUTION.md` — note current version.
2. Determine bump type (§2) based on the proposed change.
3. Apply change and bump version.
4. Add a `## Changelog` entry with date and description.
5. Update `DECISIONS.md` — append entry: "Constitution bumped to v{new} — {reason}."
6. **Propagation check** — if MAJOR or MINOR bump:
   - Grep `_arcwright-output/**/*.md` for references to constitution rules that may now conflict.
   - List any artifacts that reference the changed rule.
   - Notify the user: "These artifacts may need re-review against v{new}: [list]."

---

## 5. Validate Procedure (`/constitution validate`)

Checks whether the current codebase and planning artifacts comply with the constitution's non-negotiables.

1. Read `CONSTITUTION.md` — extract each non-negotiable as a checkable assertion.
2. For each assertion, run an appropriate check:
   - Test discipline → check if recent PRDs have test plans; check `package.json` for test scripts.
   - Security posture → grep for `process.env` without validation, hardcoded secrets patterns.
   - Convention rules → check `tsconfig.json` `strict` flag; grep for `any` types if rule prohibits them.
   - Architecture invariants → grep for direct DB calls outside allowed paths.
3. Report findings as `CONST-{N}` violations:
   ```
   CONST-01: [rule text] — FAIL: [evidence]
   CONST-02: [rule text] — PASS
   ```
4. If any FAIL: write findings to `_arcwright-output/planning/constitution-violations.md`.
5. Do NOT auto-fix violations — report only. The user decides remediation.

---

## 6. Template

```markdown
# CONSTITUTION — [Project Name]

version: 1.0.0
created: 2026-06-11
updated: 2026-06-11

> Non-negotiables. Bump version to change any rule. Downstream artifacts re-check on MAJOR/MINOR bumps.

---

## Test Discipline

- All public API surface has unit tests. No untested code ships.
- Integration tests required for any cross-service boundary.

## Security Posture

- No secrets in source. Credentials via env vars or a secrets manager only.
- All external inputs validated at the system boundary before processing.

## House Conventions

- TypeScript strict mode on all new code. No implicit `any`.
- Files ≤ 300 lines. Modules ≤ 1000 lines. Split at boundary.
- No console.log in shipped code — use structured logging.

## Architecture Invariants

- No direct DB calls outside the repository layer.
- No business logic in route handlers — delegated to service layer.

## Review Gates

- Security review required for: auth changes, file ops, input handling, schema changes.
- Constitution compliance checked before any MAJOR release.

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-06-11 | Initial constitution |
```

---

## 7. Propagation Note

When the constitution is bumped (MAJOR or MINOR), downstream planning artifacts
should re-check against it. Specifically:

- PRDs that reference test plans
- Architecture documents that reference the security posture
- Sprint plans that include convention-violating tasks

The validate procedure (§5) surfaces conflicts. The user is responsible for updating
downstream artifacts — the constitution skill reports, does not auto-fix.

---

## 8. Cross-References

- [`project-memory`](.agents/skills/project-memory/SKILL.md) — `STATE.md`, `ROADMAP.md`, `DECISIONS.md`, `LEARNINGS.md` are managed by `project-memory`. `CONSTITUTION.md` is this skill's sole owned artifact.
- [`project-context`](.agents/skills/project-context/SKILL.md) — surfaces existing `CONSTITUTION.md` at session start via the planning artifact scan.
- [`caveman`](.agents/skills/caveman/SKILL.md) — constitution entries are written concisely; avoid policy bloat.
