# Arcwright Code / T3 Code MCP operations

Use the exposed schemas for exact arguments; names can have a harness prefix such as `mcp__t3_code__`. These app-owned operations are part of all three workflows. They are separate from the Unnamed Development MCP, which requires its own explicit request.

## Discover and delegate

Call `orchestrator_capabilities({})` for current provider instances, custom models, options, and available features. Honor the user's reviewer choice. Prefer native delegation for the same provider only when it supports that model and isolation. Use `delegate_task` for explicitly app-owned children, unsupported native model choices, cross-provider work, or worktree isolation. Creating ordinary threads with `t3_thread_launch` or `create_threads` is not a substitute for a review subagent, because those are separate top-level conversations.

For an app-owned review round, use the live schema, for example:

```json
{
  "task": "Review the supplied brief, acceptance criteria, and scoped change or explicit existing-code audit files at the specified revision. Return evidenced findings with closure conditions and a verdict for this revision. Include the supplied prior findings, closure evidence, responses, and unresolved objections. Read-only: do not edit, publish, or start subagents.",
  "target": {
    "providerInstanceId": "<advertised-provider-instance-id>",
    "model": "<advertised-model-id>"
  },
  "role": "review",
  "mode": "async",
  "clientRequestId": "<workflow-id>-review-<round>"
}
```

Supply the actual brief, acceptance criteria, revision and diff or explicit audit file set, and ledger in `task`; children do not receive the parent's conversation automatically. An existing-code audit needs relevant source access or file contents at the specified revision, not just an empty patch. Use **one new `delegate_task` per review round**, with a distinct request ID per round, persisted before dispatch and stable across retries. Retain its `taskId`; `childThreadId` is backing storage, not a target for starting the next round through `t3_thread_send`.

Async completion wakes the parent. After independent work is done, persist the next action and end the turn to receive that event. Use `task_status({taskId})` when the result is needed mid-turn or when resuming. A completed turn with live nested work is not a finished task; check `workState`, pending work, and the result. `waitTimedOut: true` does not cancel the task. Reuse its ID rather than commissioning a duplicate. Use `task_cancel` for obsolete or abandoned work and check its state before replacing work that may still be active. Resolve child questions from known scope through the pending-request API advertised by the live catalog. Current hosts expose `t3_pending_request` with `action: "list"`, `"read"`, or `"respond"`; older hosts expose `t3_pending_request_list`, `t3_pending_request_read`, and `t3_pending_request_respond`. These operations cannot approve permission requests.

Use shared checkout access for uncommitted review, or explicitly supply the complete diff and needed file content. `isolation: "worktree"` starts from the parent **local commit**, runs setup, and omits uncommitted edits. Never describe such a child as reviewing uncommitted changes it did not receive.

If the tools are initially absent, make one bounded attempt at the known `orchestrator_capabilities` name. In an ACP environment with `T3_ACP_MCP_NODE`, the supported transport fallback is:

```bash
ELECTRON_RUN_AS_NODE=1 "$T3_ACP_MCP_NODE" ${T3_ACP_MCP_ENTRYPOINT:+"$T3_ACP_MCP_ENTRYPOINT"} acp-mcp-call orchestrator_capabilities '{}'
```

The same transport accepts `delegate_task`, `task_status`, and other exposed calls. Pass JSON with proper shell quoting or a safely quoted body file; do not interpolate task text as executable shell code. If the required transport remains unavailable, report that blocker instead of fabricating a review or silently dropping the MCP workflow.

## Recover temporary failures without duplicate writes

Delegation uses the shared [recovery guide](../../subagent-protocol/guide-11-10-failure-and-recovery.md): transport recovery and corrective child retries have separate budgets. For other MCP operations, default to at most **three transport attempts per logical operation**, including the first attempt; honor a lower user limit. Persist the attempt count and last result across immediate retries and resumptions. Retry transient connection/service failures with short backoff, respecting a server's retry-after instruction. Use available independent work during a delay; do not spin or create an unrequested schedule. Correct actionable argument errors; blind retries do not resolve authentication, permission, or permanent validation failures. Ask only when correction requires unavailable authority or input.

Distinguish a failed transport from ordinary pending work: `waitTimedOut: true`, a queued CI run, and a running child are not reasons to redispatch an operation or start another review round.

Before retrying a mutation whose response was lost, reconcile its actual server state. If the API guarantees idempotency, retry the identical payload with the **same persisted `clientRequestId`** within the attempt budget. `delegate_task` supports this: an identical retry recovers the same logical task when no `taskId` reached the parent. Once known, use that task ID. Never use a new round/request ID merely because the old response disappeared. A genuinely new operation or review round gets a new ID, not a changed payload under an old retry key.

For operations without a guaranteed idempotency key, inspect the corresponding resource before repeating it: match a PR by repository, head/base, and requested operation; reconcile a comment by its actual content and posting context; read thread PR links or watcher state for registration calls. A failed lookup or temporarily absent result does not establish that an earlier write failed. If acceptance remains ambiguous, retain **unknown/pending** status and report the blocker rather than submitting another potentially duplicate mutation. Never infer cancellation, publication, or successful monitoring from a transport error.

After bounded recovery is exhausted, retain resource IDs, acceptance state, and the next action. Surface only a genuine remaining blocker; preserve existing scope/authority and do not claim background retries that were not registered.

## Register, watch, and release a PR

- Immediately call `link_pull_request({url})` when creating a PR or beginning work on an existing one. Register every worked-on layer of a stack. Before handoff, call `list_thread_pull_requests({})` and link missing relevant PRs. Surface registration failures accurately.
- Use the repository's source-control tools or authenticated `gh` for PR creation, checks, review threads, and merging. Linking and watching do not create, approve, or merge a PR.
- Handle existing comments/check failures, then call `watch_pull_request({url})` when waiting. Persist the delivery mode, head, open items, and next action, then **end the turn**. Arcwright wakes the parent on relevant changes. Do not poll, sleep, or create another watcher process, because the native watcher already owns continuation. Child reviewers cannot watch; their parent owns this step.
- On wake, reread actual PR state and the current head before continuing. The notification is news, not merge authorization. Reconcile `list_thread_pull_requests` after interruption so an existing subscription or PR is not duplicated.
- Call `unwatch_pull_request({url})` when handing work back, including a ready `full-stop` PR or a blocked workflow needing the user. Leaving a watch active would keep the thread in Working rather than the user's inbox. Successful watches end automatically on merge/close. If watching still fails after bounded recovery, report the failure and the remaining next action; do not claim background monitoring exists.

## Inspect behavior and keep evidence

For browser verification, call `preview_status` first. Open an automation-capable tab with `preview_open` if needed, then use `preview_navigate`, `preview_snapshot`, and focused interaction tools. Read the user's relevant tab, but operate on it only while unclaimed; while its owner is human, read it or open an owned tab. Use snapshot locators before coordinates.

Use `preview_snapshot` with `save: true` for shareable screenshot paths. Use `preview_recording_start` / `preview_recording_stop` when motion or sequencing matters. Call `t3_evidence_directory({})` before writing temporary ledgers, command output, or other captures; native preview captures already use conversation evidence storage. Save permanent deliverables in the project or user-selected location. Reference useful evidence paths in the handoff; use the app's attachment tools when actual upload is needed and authorized.

## Ask only when input is necessary

Use the available harness question tool (`request_user_input_async`, `AskUserQuestion`, or its equivalent) so waiting is visible. `request_user_input` applies only where supported. Include the PR link if present, material blocker, evidence, recommendation, and choices in one self-contained question. Resolve routine child questions independently; request user approval only where existing authorization is insufficient. Never bypass a host permission gate, because a skill does not expand runtime permissions.
