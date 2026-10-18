---
name: nda-review
description: Triage commercial NDAs against the configured attorney-reviewed playbook, classifying GREEN, YELLOW, or RED and routing missing positions or deviations to the actual approver.
user-invocable: false
---

# NDA triage

Classify a commercial NDA **GREEN / YELLOW / RED** against this team's actual
attorney-reviewed positions. This skill sorts; it does not negotiate, draft new
substantive terms, approve deviations, execute signatures or send documents.

## Load the necessary context

Use the configured practice profile and playbook, from the active project or an
explicitly selected host-plugin source. Read the
matching sales/purchasing playbook's NDA triage positions, role, approvers,
work-product header and closing preference. Determine our side from this
transaction, even for mutual NDAs; ask only if material facts remain unclear.
A missing/unconfigured position is not permission to invent a default or edit the
profile. Flag the gap for its owner; record new positions only when authorized.

If enabled, apply active matter context/overrides without reading other matters
unless cross-matter context is on. Resolve an unspecified matter or the user's
practice-level choice. Keep working artifacts in host evidence or the active
project's `_arcwright/_memory/skill-runs/nda-review-<id>/`; use a designated matter
folder for the deliverable, never the skill directory.

## Scope before clauses

Check for standstill, license/IP assignment, exclusivity, non-compete/non-solicit,
ROFR/MFN or dispute terms extending beyond confidentiality. Non-NDA obligations
make the result at least **YELLOW**, regardless of otherwise acceptable NDA terms.
M&A, employment/investment or broader covenants may need a different legal workflow.
Do not let a filename substitute for substantive scope.

Apply recorded criteria to mutuality, confidential-information definition/marking,
public/prior/independent/third-party/legal-disclosure carveouts, residuals,
term/survival/trade-secret treatment, restrictive covenants, fees, retention/backups
and governing law. Categories are not universal acceptance thresholds. A one-way
NDA is not automatically RED; establish disclosure direction/purpose and apply the
actual playbook, or return YELLOW with missing-position facts.

## Classification and decision gates

- **GREEN:** every applicable attorney-reviewed playbook position passes, with no
  uncovered or red term. Missing/default positions cannot justify GREEN. Give the
  short clean conclusion and check-to-playbook evidence; avoid a lengthy clean report.
- **YELLOW:** deviations, uncovered positions or broader obligations need the named
  lawyer/approver's decision. List each section, actual text/effect, playbook reason,
  legal risk, business friction and likely resolution. Do not decide acceptance.
- **RED:** a configured never-accept condition or incompatible structure. Quote the
  relevant text, explain the violated position and route to the named escalation
  owner. Do not submit to standard CLM/signature flow or promise signature.

Triage is not signature authorization. Before a non-lawyer proceeds to legal
execution, preserve the configured attorney-review gate and prepare a focused brief
if it has not been satisfied. Existing explicit review approval remains in force.
CLM records/messages need authorization; RED has no automatic record creation.

## Deliver and stop

Use the configured work-product header. Check an intended external/broad distribution
against the privilege circle; offer an appropriate sanitized version when needed.
Verify outcome-changing jurisdiction claims with current authorized primary sources;
flag unconfigured jurisdictions rather than asserting transferability.

Executive summaries contain simple mechanical actions only. If a solution requires
new language or restructuring, write “Section X: route to Legal for review.” Use
surgical redlines only within the authorized scope. Include applicable passed checks,
missing facts and the named next step. Append the configured closing action, or
“Route final NDA through your standard approval process,” plus relevant decision
options. Do not perform those external actions automatically.

## Conditional detail

Use [triage/output templates](references/workflow-guide.md#the-triage),
[check categories](references/workflow-guide.md#detailed-check-reference), or
[closing/CLM rules](references/workflow-guide.md#integration-clm) for that part of
the review. No template authorizes an unrequested send, signature or profile edit.
