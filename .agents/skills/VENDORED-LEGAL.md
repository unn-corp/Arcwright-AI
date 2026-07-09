# Vendored legal-drafting skills

Discovered via `/skill-scout` and vendored into the package. Each skill retains
its upstream LICENSE file. Only redistribution-permissive licenses are included here.

| Skill | Upstream | License | Purpose |
|-------|----------|---------|---------|
| `nda-review` | anthropics/claude-for-legal (commercial-legal) | Apache-2.0 | Triage inbound NDAs GREEN/YELLOW/RED |
| `ip-clause-review` | anthropics/claude-for-legal (ip-legal) | Apache-2.0 | Review IP assignment/ownership/license clauses |
| `contract-review` | evolsb/claude-legal-skill | MIT | CUAD-based contract/NDA redline review |
| `ip-assignment` | CaseMark/skills (skills/legal) | Apache-2.0 | Draft IP-assignment agreements |

## Deliberately NOT vendored
- `contract-and-proposal-writer` (borghei/Claude-Skills) — **MIT + Commons Clause**.
  Commons Clause restricts commercial resale; kept as a global/personal install only,
  excluded from the package to avoid a redistribution-restricted license in a shared package.
- `custom-nda-generator` (zubair-trabzada/ai-legal-claude) — **no license** (all-rights-reserved).
  Personal install only.
