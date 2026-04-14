---
description: Single-pass OWASP-based security audit of current changes. Reports findings as SR-NNN.
---

# /security-review — Security Code Review

Run a single-pass security review against the current changes or specified files. Based on the OWASP Top 10 and the Arcwright security review skill. Reports findings using the SR-NNN ID format.

## Instructions

1. Load `.agents/skills/security-review/SKILL.md` for the full rule set (injection, XSS, authentication, authorization, cryptography, and more).
2. Identify the scope to review:
   - If `$ARGUMENTS` names specific files or directories, review those.
   - Otherwise, review all files changed in the current working tree (`git diff --name-only HEAD`).
3. Apply each rule systematically. For each finding, assign the next available SR-NNN ID.
4. Report findings grouped by severity (critical → high → medium → low). Each finding must include:
   - ID (SR-NNN)
   - Vulnerability class (e.g., SQL Injection, Broken Auth, Insecure Direct Object Reference)
   - File and line range
   - CVSS severity estimate (critical/high/medium/low)
   - One-sentence explanation of the risk
   - Suggested remediation (concise)
5. Flag any critical findings that require human review before merging.
6. End with: `X findings (Y critical, Z high, W medium, V low)`.

Do not auto-fix in this mode. Use `/sec-loop` for automated remediation.

## Arguments

`$ARGUMENTS` — optional list of files or directories to review. If empty, reviews all files changed relative to HEAD.
