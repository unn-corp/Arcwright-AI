---
name: full-send
description: Use when the user explicitly requests full send or invokes full-send for autonomous delivery through a merged PR in Arcwright Code or T3 Code. Discussing or authoring the skill is not an invocation.
---

# Full Send

Own the requested work from its current state through a verified, reviewed, confirmed PR merge. Assume the user is away; resolve ordinary implementation, review, and CI problems independently.

An explicit delivery invocation is required. Discussing, creating, or editing this skill does not authorize a delivery run. Read the [shared delivery procedure](references/delivery.md), select **merge mode**, and follow it through the confirmed merge. Read its linked MCP and verification guidance. Use **review-loop** for repeated independent review and repairs within the recorded budget. Obtain its unanswered reviewer-model choice before the first review; reuse an explicit selection for this delivery run.

## Authority

The invocation authorizes scoped commits, pushes, conflict fixes, PR updates, and merging after the current-source readiness gate passes. Update the branch using repository convention. After a necessary rebase, `--force-with-lease` is limited to the PR's own authorized branch and requires inspecting the remote head first. Preserve unrelated edits and concurrent contributions.

Follow repository protections and existing host permission gates. Production changes, data deletion, unrelated changes, PR closure, and another branch's force-push need separate authorization unless already granted. Do not ask again for actions already authorized.

## MCP follow-through

- Use `orchestrator_capabilities` for live reviewer choices. Use `delegate_task`, `task_status`, and `task_cancel` according to the shared guidance; each app-owned review round has its own task and request ID.
- Immediately call `link_pull_request` when creating or starting work on a PR. Register every worked-on stack layer and check `list_thread_pull_requests` before final handoff.
- Process existing findings before `watch_pull_request`, save mode/head/next action, then end the turn. Resume on the host event and reassess actual state; notifications do not grant approval.
- Use `preview_*` for direct UI verification and `t3_evidence_directory` for private evidence and resumable state.
- Call `unwatch_pull_request` when handing a blocked workflow back for user input. Do not claim background monitoring if watch registration failed.

## Completion

Establish observable acceptance criteria before editing and map each to source-specific proof. Apply compatibility/recovery checks when affected APIs, schemas, persisted settings, or data formats warrant them. If the requested outcome is already demonstrated on the intended target and no PR delivery remains, use the shared procedure's verified no-op endpoint without manufacturing a commit, PR, or user question.

Merge only after current-source proof, independent review, required checks and approvals, resolved findings, branch currency, and mergeability all establish readiness. Use an allowed merge method and the host's expected-head guard when supported. Do not bypass protections, because authorization to deliver is not authorization to weaken merge requirements. Follow a queue or auto-merge until the host confirms the actual merge.

After a merge, follow [post-merge verification](references/post-merge.md): confirm the expected changes at the actual merge revision and inspect repository-defined post-merge checks. Distinguish a confirmed merge from queued, failed, or unavailable verification. No production deployment or rollback is implied. Recover temporary MCP failures with the shared bounded retry/reconciliation rules; never duplicate an uncertain write.

Report changes or the verified no-op, verification, remaining issues, the PR link, and the confirmed merge commit when applicable. Include material compatibility limitations or pending/failed post-merge checks. Ask through the harness question tool for an unanswered reviewer-model choice, a material blocker, missing authority, or a decision that changes the outcome. Do not add AI attribution, AI co-author/generated-by trailers, model/effort/usage blurbs, or reviewer-credit banners, because the requested output excludes attribution.
