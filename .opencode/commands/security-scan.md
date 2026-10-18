---
description: Read-only repository security posture scan with applicable tool checks, evidence-backed findings, and a report card; accepts a path or selected topic.
---

# Security posture scan

Scope from `$ARGUMENTS`: a path selects the repository, a topic number/name selects
that topic, and empty input uses the current repository. Load the compact rules
from `.agents/skills/security-review/SKILL.md`. Trace attacker-controlled data and
confirmed access paths; report high-confidence findings with severity and evidence.
A suspected pattern alone is not a vulnerability.

Use `.agents/skills/security-review/posture/posture-scan.md` for tool detection,
the 12 core topics, OWASP mappings, and the report format. Read only the selected
topic's section and its applicable references at a time; do not preload every
security document for a topic-limited scan. Use available scanners and report
missing tools rather than installing them or pretending a scan ran.

Additional topic references under `.agents/skills/security-review/posture/`:

| Evidence in scope | Topic and reference |
| --- | --- |
| AWS IaC | 13, `aws-cdk.md` |
| Tokens or credentials | 14, `token-scoping.md` |
| HTTP APIs | 15, `api-inventory.md` |
| Database config/migrations/connections | 16, `database-hardening.md` |
| HTML or browser UI | 17, `browser-security.md` |
| Error/exception paths | 18, `error-handling.md` |
| Tenancy or business rules | 19, `multitenancy-logic.md` |
| Outbound requests or deserialization | 20, `ssrf-deserialization.md` |
| Containers | 21, `container-hardening.md` |
| LLM APIs or WebSockets | 22, `ai-websocket.md`, applicable half only |
| User text input | 23, `input-fields.md` |
| Personal/financial data | 24, `data-encryption.md` |

For each in-scope topic: establish applicability, run available checks, trace the
relevant control, and record Pass/Weak/Fail/N/A. Report a row for every assessed
topic, severity-ranked `SCAN-NN` findings with `file:line`, fixes, and priorities.
Identify unverified risks and scans that could not run. Critical findings require
a deliberate owner decision before merging. This command reports; remediation is
an explicitly requested follow-up or `/sec-loop`. A diff-only review uses
`/security-review`. Preserve source confidentiality and omit AI attribution.
