---
name: ip-clause-review
description: "Review intellectual-property ownership and licensing clauses, identifying the governing scope, exceptions, and proposed revisions."
argument-hint: "[file path | Drive link | paste text]"
---

# Review IP clauses

Review an agreement against the user's configured practice profile and actual side
of the transaction. Produce actionable clause findings without silently deciding
subjective rights allocation. Do not sign, send, publish or change a legal profile
merely because review was requested.

## Establish the review context

Read the supplied agreement and the project's explicitly selected practice profile.
Use a legacy host-plugin profile only when it is the configured source. Check jurisdiction, approvers and work-product header.
If missing or placeholder-only, report what is needed before representing a
profile-based review. Use an available setup workflow; do not invent a callable
`/ip-legal:*` command.

If matter workspaces are enabled, read the active matter's context/overrides only.
Clarify an absent active matter or use the user's explicit practice-level choice.
Never read another matter unless cross-matter context is enabled. Working artifacts
belong in host evidence or the active project's
`_arcwright/_memory/skill-runs/ip-clause-review-<id>/`; use a matter destination only
when designated for the deliverable, never the installed skill folder.

Establish agreement type, company/counterparty, consideration, governing law and
whether our side grants, receives or does both. This is per agreement, not a
permanent profile assumption. For both directions review each separately; clarify
material uncertainty before assigning risks.

## Review in priority order

1. **Assignment gap first** for employment/consulting/SOW/work-for-hire or other
   acquisition of work-product IP: present assignment versus promise, scope,
   background-IP exclusions, moral-rights treatment and further assurances.
   Put material gaps at the top with the section, business risk, targeted redline
   and named approver. Do not assume work-for-hire or waiver enforceability.
2. **Relevant clauses:** assignment/ownership, improvements/derivatives, background/
   foreground IP, license scope/exclusivity/territory/field/sublicensing/term,
   warranties, indemnities/caps/procedure/exclusions, moral rights, OSS, trademarks
   and trade secrets. For each give what it says, the supported playbook/market
   reference, severity, business impact and specific needed change.
3. **Cross-clause consistency:** compare grant with warranties/remedies, ownership
   with licenses/background rights, termination with survival, and related SOWs/
   orders/side letters. A clean clause can conflict with another provision.
4. **Jurisdiction:** verify outcome-changing legal propositions using current
   primary/authorized legal sources. Preserve uncertainty for moral rights,
   work-for-hire, implied rights and patent/indemnity questions.

For ambiguous allocation, surface both readings and flag attorney review. Prefer
word/phrase/subclause edits over whole-clause replacement. Explain a necessary
replacement. Do not add generic representations or new obligations without a
concrete agreement/profile risk.

## Evidence, memo and completion

Use the configured legal research source. If it has insufficient coverage, report
that gap and the available options; do not silently fill it with an unverified
recollection. Preserve citation provenance and verification status. Do not fabricate
market norms, cases or approvers.

Return the configured work-product header, date, sides/law, concise outcome,
assignment gaps, clauses by severity, consistency/jurisdiction notes and approval
routing. Critical/high issues need precise proposed language; distinguish confirmed
from conditional risk. Respect confidentiality and the intended distribution; a
header does not make external delivery privileged. End with the configured next-step
options for the lawyer to decide. State missing documents and unverified legal rules.

## Conditional detail

Use [assignment checks](references/workflow-guide.md#step-2-assignment-gap-check-highest-priority),
[clause/severity blocks](references/workflow-guide.md#step-3-clause-by-clause-review),
[jurisdiction topics](references/workflow-guide.md#step-5-jurisdiction-note) or
[memo template](references/workflow-guide.md#step-6-assemble-the-memo) when needed.
