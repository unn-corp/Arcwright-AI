# Full Stop — Quick Rules

Load `SKILL.md` and its shared delivery procedure before execution.

- Activate only for an explicit full-stop request, not a request to stop work.
- Persist ready mode and honor later changes to the user's instructions.
- Own scoped implementation, proof, CI, and review until the PR is ready.
- Use review-loop for repeated findings and repairs. Ask for a reviewer model once unless already selected for this run; reuse it on resume.
- Preserve unrelated work and respect existing scope and permissions.
- Prove acceptance criteria; return a verified no-op when no delivery remains.
- Never merge, enable auto-merge, or enter a merge queue.
- Disable existing automatic merging and remove this PR's queue entry.
- Keep proof and review valid for the current source.
- Bound transport retries; assess compatibility/recovery when contracts change.
- Register every relevant PR with `link_pull_request` and verify its links.
- Use native watchers and end the turn while awaiting host events.
- Unwatch before a ready or blocked handoff; verify the PR remains unmerged.
- Report useful results and evidence without AI attribution or model credits.
