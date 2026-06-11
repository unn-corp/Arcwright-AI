# CONSTITUTION — [Project Name]

version: 1.0.0
created: YYYY-MM-DD
updated: YYYY-MM-DD

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
| 1.0.0 | YYYY-MM-DD | Initial constitution |
