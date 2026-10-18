# Full Send — Quick Rules

Load `SKILL.md` and its shared delivery procedure before execution.

- Require an explicit full-send delivery request; authoring is not invocation.
- Persist merge mode and honor later user instructions before resuming.
- Own scoped implementation, proof, review, CI fixes, and confirmed merge.
- Use review-loop for repeated findings and repairs. Ask for a reviewer model once unless already selected for this run; reuse it on resume.
- Preserve unrelated work and honor existing scope and permissions.
- Prove acceptance criteria; return a verified no-op when no delivery remains.
- Keep proof and review valid for the actual current PR head.
- Required checks and approvals remain binding; never bypass protections.
- Register every relevant PR with `link_pull_request` and verify its links.
- Use native watchers and end the turn while awaiting host events.
- Reassess readiness on wake; a notification is not merge authorization.
- A queue entry or auto-merge setting is not a confirmed merge.
- Verify the actual merge revision and applicable post-merge checks separately.
- Bound transport retries; assess compatibility/recovery when contracts change.
- Report useful results and evidence without AI attribution or model credits.
