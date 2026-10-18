# Verify the actual merge result

Apply this after a confirmed full-send merge. Full-stop never merges to obtain this evidence. A verified no-op with no outstanding PR delivery does not create a merge or a new post-merge obligation.

## Pin the result and demonstrate the outcome

Obtain the actual merge revision and target branch from the source host. Squash and rebase merges can have different commit identities from the reviewed PR head. Confirm the requested changes are present at that actual revision on the intended target, using read-only tree/diff inspection and the acceptance criteria. Do not keep chasing unrelated later default-branch commits or disturb a dirty working tree to inspect the result.

Keep proof for the PR head labeled with that head. Reuse still-valid evidence only after establishing that the tested behavior and relevant context match the merged result; refresh affected checks if integration changed them. Never relabel pre-merge CI as a run on the merge revision. Record the source comparison and any additional evidence against the actual merge revision.

## Inspect applicable post-merge checks

If the repository defines post-merge/default-branch verification, inspect the runs for the **actual merge revision**, not a green status for a different commit. Distinguish successful, failed, queued/running, expected-but-not-yet-observed, unavailable, and not-configured states. Missing expected evidence is not a pass. For repositories without such checks, do not invent a new pipeline or add irrelevant reporting boilerplate.

Use source-control/CI tools and an actually available run-event continuation when supported. The PR watch ends on merge/close; `watch_pull_request` is not a watcher for default-branch CI on a merged PR. Without supported continuation, make one status observation and at most one later observation after other available verification work, then hand off if results remain pending or unavailable. Do not wait or poll just to obtain the second observation. Transport failures use the separate bounded retry policy; a queued run is pending work, not a failed transport to redispatch.

Preserve the merge revision, pending status, run link when known, observation count, and next check. End with an explicit **merged; post-merge verification pending** handoff, stating that no background monitoring is registered. Resume that check only on an explicit user continuation or a real supported CI event; reread actual run state for the same merge revision without repeating the merge or opening another PR. Do not spin, create a new watcher process, invent an event subscription, or claim automatic resumption.

## Report and respond accurately

Report the confirmed merge independently from its verification outcome. If post-merge proof is pending or failed, state that limitation instead of claiming a clean verified delivery. Inspect actual failure evidence before attributing its cause to the change. Investigate or repair in scope only within existing authorization and the remaining review budget; any follow-up change follows normal review and protections.

Observation does not authorize deployment, production changes, forced history edits, or automatic rollback. Use the conditional compatibility/recovery assessment to explain relevant options; execute those actions only with existing authorization.
