---
name: full-stop
description: Use when the user explicitly requests full stop or invokes full-stop to have a PR prepared for their own merge in Arcwright Code or T3 Code. A request to stop working does not invoke this skill.
---

# Full Stop

Own implementation, proof, review, and PR follow-through until the work is ready for the user to merge. Keep finding and fixing issues independently. **Never merge it.**

Discussing, creating, or editing this skill does not authorize a delivery run.

Read the [shared delivery procedure](../full-send/references/delivery.md), select **ready mode**, and follow it through the verified handoff. Read its linked MCP and verification guidance. Use **review-loop** for repeated independent review and repairs; keep the recorded budget and disposition minor findings without routine human questions. Obtain the unanswered reviewer-model choice before the first review; reuse an explicit selection for this delivery run.

## Authority and endpoint

An explicit invocation authorizes scoped commits, pushes, conflict fixes, and updates to the PR. Update the branch by repository convention; `--force-with-lease` is limited to the PR's own authorized branch after a necessary rebase and inspection of the remote head. Preserve unrelated work. Existing host permission gates still apply.

Do not merge, enable auto-merge, or enter a merge queue, because this mode reserves the merge decision for the user. On an existing PR, inspect and disable automatic merging, remove queue membership, and reconcile any merge-capable tasks belonging to this workflow as soon as it is identified. Verify this again before handoff. A request to switch from full-send to full-stop changes the saved endpoint immediately.

## MCP follow-through

- Use `orchestrator_capabilities`, `delegate_task`, `task_status`, and `task_cancel` as described in the shared guidance for independent reviews.
- Call `link_pull_request` when creating or starting work on a PR; check `list_thread_pull_requests` before the final handoff.
- Use `watch_pull_request` and end the turn while checks/reviews are pending. Resume on the host event and verify the current head.
- Call `unwatch_pull_request` when returning the ready PR or a material blocker to the user.
- Use `preview_*` for direct UI checks and `t3_evidence_directory` for private evidence and continuation state.

## Completion

Establish observable acceptance criteria before editing and map each to source-specific proof. Apply compatibility/recovery checks when affected contracts warrant them. If the requested outcome is already demonstrated on the intended target and no PR delivery remains, use the shared procedure's verified no-op endpoint without creating an empty PR or asking for routine confirmation. An existing relevant open PR still needs its delivery gates; an empty diff alone is not completion.

For PR delivery, finish only when the acceptance criteria, proof, independent review, host reviews, required checks and approvals, and mergeability establish readiness on the current source. Otherwise report the actual blocker and use the harness question tool only when input is necessary. Keep ordinary fixes autonomous and preserve prior authorization. Use bounded MCP recovery and reconcile uncertain writes before retrying. Post-merge verification belongs to full-send; never merge to perform it here.

Report changes or the verified no-op, verification, remaining issues, and the PR link when applicable. Include material compatibility/recovery limitations. State that the PR is ready and remains unmerged only after verifying that state. Do not add AI attribution, AI co-author/generated-by trailers, model/effort/usage blurbs, or reviewer-credit banners, because the requested output excludes attribution.
