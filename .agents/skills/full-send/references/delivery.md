# Shared delivery procedure

The entry skill selects the endpoint: `full-send` means **merge**, `full-stop` means **ready for the user to merge**. Persist that mode and honor the latest explicit user direction on resumption. A literal request to stop working ends work; it does not activate `full-stop`.

For a literal stop, record the stopped state and, where the runtime still permits cleanup, cancel this workflow's live children and pending automatic merge actions and remove its PR watch. Perform no further implementation or readiness work. Later notifications do not authorize resuming a stopped workflow; wait for a new user instruction. Report cleanup only when confirmed.

Read [MCP operations](../../review-loop/references/arcwright-mcp.md) for native tool calls and [verification](../../review-loop/references/verification.md) for proof. Use **review-loop** for independent finding and fixing; read [its full instructions](../../review-loop/SKILL.md). This authorizes that skill's single reviewer, not unrelated teams or top-level conversations.

## Establish ownership and continuation

Read applicable repository instructions and the current request. Inspect `git status --short`, remotes, branch/base, scoped diff, and any existing PR. Reuse appropriate work; use `list_thread_pull_requests` and the source host to avoid duplicate PRs. Immediately `link_pull_request` each PR this workflow creates or begins working on, including worked-on stack layers.

Before editing or creating a branch/PR, derive observable acceptance criteria and scope boundaries using the verification guidance. Map those criteria to source-specific evidence in the private ledger; infer routine details without asking for approval. Include compatibility/recovery evidence when the affected contracts require it.

## Recognize work that is already complete

If the requested outcome is already demonstrated on the intended target revision and no requested PR delivery remains, finish as **already satisfied / no changes needed**. Record the target revision, criterion-to-proof mapping, and any existing completion link. No additional confirmation, empty commit, artificial change, PR, or redundant review loop is needed. Preserve unrelated edits and reconcile this workflow's live tasks and watches before handoff. Say the work was already complete; do not claim to have merged someone else's work.

An empty diff, matching symbol, or another PR's title is insufficient proof. An explicitly requested audit still needs inspection of its scope. Reuse an existing relevant open PR and satisfy its delivery gates rather than declaring no-op because no new edits are needed. Do not use this path to bypass an explicit request to deliver that PR or any outstanding required checks. Do not close, discard, or modify unrelated work merely to produce a no-op result. If another PR's outcome is materially uncertain, investigate and ask only when that uncertainty cannot be resolved independently.

## Continue work that remains

Create a working branch when on the default branch. Preserve unrelated edits and concurrent contributions. Commit, push, and resolve conflicts only for the authorized scope. Update from the default branch by the repository's accepted merge or rebase method. Use `--force-with-lease` only for the PR's own authorized branch after a necessary rebase and after inspecting the actual remote head. Never force-push the default or another branch, because that would rewrite work outside this grant.

Use `t3_evidence_directory` for the private resumable record: mode, scope/acceptance criteria, reviewer provider/model/options, branch/base, tested/reviewed source, applicable uncommitted diff fingerprint, findings/closure conditions, criterion-to-proof mapping, compatibility limitations, check results, round budget, task/request IDs, transport attempts/acceptance state, PR URL, watcher state, actual merge revision/post-merge results when applicable, and next action. Preserve the existing ledger and review budget across wakes and bot-fix cycles. Keep workflow state out of product files and PR descriptions. Apply the MCP guide's bounded recovery before escalating transient failures; reconcile uncertain writes before repeating them.

In ready mode, prevent an existing automatic merge from racing the handoff: inspect auto-merge and queue state as soon as the PR is identified, disable auto-merge, remove its queue entry, and cancel merge-capable tasks owned by this workflow with `task_cancel`. Confirm their actual state before handoff. Ownership includes an earlier full-send phase of this same workflow. Known merge-capable work owned by another workflow is a blocker to surface, not permission to cancel unrelated work. Verify the result; if unable, report the blocking condition instead of claiming a safe ready handoff.

## Implement, verify, and review

Complete the requested behavior with minimal scoped changes. Use direct verification and `review-loop` to resolve substantive findings before publishing. Preserve evidence-based reasons for declined suggestions. Optional polish does not justify expanding scope or repeatedly involving the user.

Create or update the PR using the available source-control tooling or authenticated `gh`. Follow the repository template and describe the problem, resulting behavior, relevant verification, and actual limitations. For multiline CLI bodies, use a properly written body file rather than shell-interpolating prose. Inspect generated titles, bodies, comments, and commit trailers before publishing; remove inserted AI attribution, AI-generated-by notices, model/effort/usage blurbs, and reviewer-credit banners from this workflow's new content. Preserve unrelated contributors' existing work and history.

Follow CI, host reviews, and bot findings. Fix valid in-scope findings, verify the fix, and refresh affected independent review through `review-loop` within its recorded budget. Do not rerun unchanged successful checks without a reason. Treat a real required failure as a failure even when pre-existing; explain the limitation rather than bypassing it.

For pending host checks/reviews, process existing findings first, then `watch_pull_request`, save continuation state, and **end the turn**. For an async child, retain its task ID and end the turn after independent work so its completion can wake the parent. On wake, reread actual PR/task state, source, and latest user instructions. Do not start duplicate PRs, tasks, or watcher processes, because existing work may still be active.

## Readiness on the current source

Before either endpoint, confirm all of the following:

- Proof covers the final scoped behavior and the current PR head; source changes have received affected checks and review.
- Every applicable acceptance criterion is demonstrated, including any relevant compatibility or recovery condition. A green suite does not close an unexercised requested behavior.
- Applicable required checks are successful and required approvals are satisfied.
- Internal review is complete with no confirmed unresolved `blocker` or `should`, and no independent substantive concern. An internal verdict does not count as a required human approval.
- Host review bots have finished; findings are fixed or dismissed with written evidence. Optional advice may be declined with reasons. A required check, approval, or outstanding human request for changes cannot be waived by confidence.
- The branch is current under repository policy, conflicts are resolved, and the host reports it mergeable. An unknown or pending mergeability result is not readiness.
- The scoped diff has no unintended changes, relevant live tasks are reconciled, and the remote head matches the source whose proof is being relied on.

## Complete the selected endpoint

**Merge mode:** Recheck the current mode, authorization, required checks/approvals, base state, and remote head immediately before merging. Use the host's expected-head guard when supported. Use an allowed repository merge method and normal protections. Never use `--admin`, protection changes, or other bypasses, because this workflow does not authorize overriding the repository's merge requirements. Follow a queue or auto-merge through the native watcher until the host confirms the actual merge. If the source changes while queued, reassess readiness for that source; queue admission is not completion. Then apply [post-merge verification](post-merge.md) to the actual merged revision and any repository-defined post-merge checks. Keep confirmed merge state separate from pending or failed post-merge verification.

**Ready mode:** Leave the PR open and unmerged. Do not merge, enable auto-merge, or enter a merge queue, because the user retains the merge decision. Confirm auto-merge is disabled and no queue entry remains. Call `unwatch_pull_request` before the ready handoff so the thread returns to the user's inbox.

Before final handoff in either mode, call `list_thread_pull_requests` and register any relevant missing link. Verify actual host state. For PR delivery in merge mode, report the confirmed merge commit and applicable post-merge status; if it has not merged, keep the workflow pending or explicitly incomplete rather than claiming completion. For a verified no-op, report the already-satisfied outcome and target revision instead of inventing a new PR or merge.

## Human input and output

Continue autonomously within existing scope and permission. Obtain review-loop's unanswered model choice before initial delegation; reuse it across rounds and resumptions. Otherwise ask through the harness question tool only when proof or a required gate cannot be obtained independently, a material unresolved dispute or exhausted budget blocks readiness, necessary authority is missing, ambiguity changes the outcome, or a competing PR leaves material uncertainty about the requested result. A proven already-satisfied outcome uses the no-op path without asking. Include the PR link, evidence, recommendation, and options together. Data deletion, production changes, unrelated repository/external changes, closing a PR, or pushing another branch require their own authorization unless already granted. Existing authorization remains valid; do not ask again merely because the skill is resuming.

When handing a blocked workflow back for a decision, reconcile its child tasks and call `unwatch_pull_request`; do not claim it is monitored or complete. Record enough to resume without repeating finished work. A watcher notification or review budget limit never supplies approval.

Report **changes or the verified no-op, verification, remaining issues, PR link, and merge commit when applicable**. Include material compatibility/recovery limitations and pending or failed post-merge checks when relevant. Give useful evidence paths and significant decisions only when needed to assess the result. No AI attribution, model credits, usage reports, orchestration transcripts, or mandatory diff-size statistics belong in that output.
