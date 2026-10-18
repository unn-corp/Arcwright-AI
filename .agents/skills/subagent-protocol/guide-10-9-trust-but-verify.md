# Verify returned work

Inspect the child result and the actual affected artifact or diff. A completion
summary is evidence to assess, not proof that the requested change happened.
Confirm source identity, scope, and required gates before accepting the result.

| Work | Proportionate verification |
| --- | --- |
| Code change | Inspect the diff and observed behavior; reuse focused tests plus required checks |
| Security, schema, deletion, or concurrency change | Inspect the changed boundary and evidence covering the material failure |
| Documentation or formatting | Check the actual artifact and relevant links/structure; add no routine test harness |
| Read-only review | Check finding evidence, affected source, and unresolved objections |

For test authoring or review, load `test-quality`. Existing successful evidence on
the same source can be reused. Repeat or broaden tests only for changed code,
failures, unresolved risk, or repository requirements. A file's existence or size
alone does not establish that its behavior is correct. Record unrun gates and
limits honestly; do not label incomplete required verification as approval.
