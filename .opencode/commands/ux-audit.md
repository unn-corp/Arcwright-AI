---
description: Single-pass UX/accessibility audit of current UI changes. Reports findings as UV-NNN.
---

# /ux-audit — UX & Accessibility Audit

Run a single-pass UX and accessibility review against the current UI files or the paths provided. Reports findings using the UV-NNN ID format.

## Instructions

1. Load `.agents/skills/ux-audit/SKILL.md` for the full rule set (design token compliance, WCAG, component reuse, layout patterns, interaction quality).
2. Identify the scope to review:
   - If `$ARGUMENTS` names specific files, directories, or component names, review those.
   - Otherwise, review all UI files changed in the current working tree (`git diff --name-only HEAD`), filtered to `.tsx`, `.jsx`, `.vue`, `.svelte`, `.css`, `.scss`.
3. Apply each rule in the skill. For each violation, assign the next available UV-NNN ID.
4. Report findings grouped by severity (critical → major → minor). Each finding must include:
   - ID (UV-NNN)
   - Rule violated
   - File and line range (if determinable)
   - One-sentence explanation
   - Suggested fix (concise)
5. End with a summary line: `X findings (Y critical, Z major, W minor)`.

Do not auto-fix in this mode. Use `/ux-loop` for automated remediation.

## Arguments

`$ARGUMENTS` — optional list of files, directories, or component names to audit. If empty, audits all UI files changed relative to HEAD.
