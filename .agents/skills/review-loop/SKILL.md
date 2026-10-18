---
name: review-loop
description: Review and fix substantive findings in bounded rounds with a user-selected model. Use for repeated review and repair with little human interaction, or the independent review stage of full-send or full-stop.
---

# Review Loop

Own **find → fix → verify → review again** until substantive in-scope issues are
resolved. Use one read-only reviewer at a time; the coordinator fixes findings.
This workflow supports any available provider/model and host. Follow
[subagent-protocol](../subagent-protocol/SKILL.md) for delegation mechanics.
Editing this skill does not start a review or authorize publication or merging.

## Choose the review model

Before the first review, ask the user **which model to use** through the host's
question tool, or an ordinary question when no such tool exists. Offer a short
list from the live catalog, including custom models when available; the current
model may be an option, never an automatic selection. In Arcwright Code/T3 Code,
use `orchestrator_capabilities` for advertised provider/model IDs and options.
Other hosts use their actual native catalog and supported delegation tools.

A model explicitly selected by the user for this run already answers the question.
Record that selection, its provider and relevant options in the private ledger;
reuse it across rounds, resumptions, and the enclosing delivery workflow. Ask again
only for a new run, an unavailable selection, or an explicit model change. Do not
silently substitute a model, infer consent from a preselected option, or treat a
question timeout as an answer. Scope inspection may continue while waiting, but
no reviewer starts until the choice is resolved. If the requested model cannot run,
explain the limitation and ask for an available alternative.

## Scope and record

Inspect `git status --short`, requested paths/base, and the current source. For an
existing-code audit, name the file set and target revision even if the diff is
empty. Preserve unrelated changes. Derive observable acceptance criteria and
non-goals; ask about scope only when a material decision cannot be resolved.

Keep a resumable ledger in host-managed evidence storage when available, otherwise
`_arcwright/_memory/skill-runs/review-loop-<run>/`. Record scope/criteria, selected
model/provider/options, base/head and uncommitted source fingerprint, round/budget,
task/request IDs, findings with evidence and closure conditions, dispositions,
verification, and next action. Keep installed skills read-only during execution.

Supply a small [capability brief](../subagent-protocol/guide-07-7-handoff-context-contract.md):
relevant installed skill names/paths, finder, actual tools, source identity, and
known decisions. Use `review-orchestrator` with the task lens for suggestions;
they are nonexclusive and need no preload. Reuse unchanged discovery and read
selected SKILL.md files directly when no native Skill tool exists.

## Review and repair

1. Dispatch a read-only review using the selected model, one reviewer, and no nested
   agents. The first round covers the requested scope. Supply acceptance criteria,
   boundaries, exact current source/diff or audit files, and prior findings when
   resuming. Require each finding's ID, location, concrete evidence, impact,
   severity (`blocker`, `should`, `nit`), closure condition, and a verdict tied to
   the reviewed source. An empty patch alone is not an existing-code audit.
2. Evaluate findings against the requested outcome. A `blocker` prevents the
   required result; a `should` is another substantive in-scope defect; a `nit` is
   optional polish. Fix valid defects minimally. Dismiss unsupported findings with
   evidence; defer out-of-scope enhancements with a reason. Do not downgrade or
   defer a confirmed substantive defect merely to finish. Close findings against
   their conditions; reopen only for new evidence or changed code that invalidates
   the prior disposition. Unrelated polish cannot reopen an already-fixed defect.
3. Verify fixes with [verification guidance](references/verification.md), loading
   details only for the affected contracts. Handle routine edits and disagreements
   without repeated human approval. Do not push during the loop; use existing
   publication authority only after the local revision is settled.
4. Obtain a fresh review of changed behavior and open findings. Pass the original
   brief and current source, with a concise summary of findings/closures, responses,
   evidence, and unresolved objections. Reference accessible immutable ledger/history
   details instead of retransmitting closed discussions. Include required facts
   directly when the reviewer cannot access those artifacts. Follow the shared protocol for fresh review tasks,
   request-ID idempotency, status, and bounded recovery. In Arcwright Code/T3 Code,
   read [MCP operations](references/arcwright-mcp.md) for exact native calls; each
   review round is a new `delegate_task`, never a child-thread continuation.

## Budget and finish

Default to three review rounds. Extend automatically to at most five for any
evidenced substantive in-scope issue while fixes or new evidence show progress.
Honor a lower user limit; exceed five only with a larger authorized budget.
Repeated rejected nits without new evidence justify neither another round nor a
question. Comment, documentation, and formatting fixes need relevant checks,
not another behavioral review unless they change operative instructions.

Finish when acceptance criteria have evidence, current-source review and proof
pass, every `blocker`/`should` is fixed or dismissed with evidence, and no
substantive independent concern remains. Disposition remaining nits. Approval
cannot waive an actual defect. Budget exhaustion or stalled material disagreement
means **incomplete**, never approval. Ask only for a remaining material blocker,
missing authority, or a scope/outcome decision, with evidence and choices together.

Account for live review tasks before handoff. Push only with existing authority
to push, ship, or update a PR; the enclosing delivery mode controls its endpoint.
Report changes, observed verification, unresolved items, and relevant links. Keep
AI/model attribution, model/effort/usage blurbs, and reviewer-credit banners out of
commits, PRs, comments, releases, and handoffs. Model selection and task IDs remain
private operational data. Preserve required copyright/license/source notices.
