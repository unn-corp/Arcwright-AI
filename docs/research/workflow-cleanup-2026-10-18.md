# Workflow instruction cleanup

All eight approved findings are addressed in the maintained sources and owned
installed copies. The workflows use the existing runtime, skill router,
`test-quality`, and `subagent-protocol`; no new orchestration protocol was added.

| Finding | Result |
| --- | --- |
| Finding quotas and review inflation | Removed the required 3–10, 20, and 50 finding counts, mandatory research/validation panels, and final all-agent pass. Reviews can return no findings. Required independent review remains a gate; reviewer sets cover distinct material risks. |
| Repeated test effort | Reuse suitable tests and fixtures, add only meaningful missing cases, run affected tests before required gates, and repeat only for changed inputs or unresolved risk. TDD applies when selected. Routine tests do not require a QA child. |
| Scope expansion | Story preparation returns a plan. Implementation handoff requires existing authorization; a completed story does not start another or trigger a retrospective. Authorized batch orchestration retains its explicit queue. |
| Context preloading | Story workflows use catalog selection and targeted source context. Discovery defaults to index-guided loading, honors conditional relevance, supports selective whole-file sections, and preserves explicit full-corpus loading. |
| Incorrect Git scope | A shared review-scope reference resolves actual base/head/range, committed changes, and task-owned local edits. No assumed Production branch or automatic false-claim severity from a missing worktree diff. Requested configuration/workflow sources remain reviewable. |
| Security guidance | Authenticated paths receive role, ownership, tenant, and attacker-control review. Credential/PII discovery returns filenames. A status-only helper suppresses scanner output and separates completed scans, candidates, unavailable tools, and execution errors. |
| Attribution leftovers | Removed model/version fields, researcher identities in source citations, AI review labels, and the generated-document footer found in this pass. Review tasks use neutral labels; legal notices and source credits remain. |
| Interaction conflicts | Actionable tasks default to autonomous completion within authorization; explicit interviews and interactive planning keep their checkpoints. Real missing-input/approval questions remain pending. No simulated user decisions. Existing documents are preserved during template initialization. |

The implementation, preparation, and review checklists now agree with their
instructions and status gates. Review-only requests remain read-only. Workflow
menu command IDs and targets are unchanged; labels and corresponding website
descriptions reflect scoped execution and proportional verification.

## Instruction footprint

| File | Before | After |
| --- | ---: | ---: |
| Dev Story instructions | 27,119 B | 7,940 B |
| Create Story instructions | 30,642 B | 7,840 B |
| Code Review instructions | 10,558 B | 5,012 B |
| Combined | 68,319 B | 20,792 B |

These three instruction files shrink **69.6%** combined. The shared review-scope
guide adds 2,287 B and loads when implementation/review needs it. Measurements
are UTF-8 bytes, not provider token, billing, latency, or quality measurements.

## Validation

- All **375 package tests** and existing coverage gates pass (323 integration
  group, 52 focused group). Two focused tests cover the new scanner helper's
  status and output boundary using synthetic tools, without real credentials.
- Synthetic scanner checks reproduce the original raw-value output and incorrect
  unavailable status. Ten helper cases and 33 discovery searches pass with
  synthetic values suppressed. Actual scanners were not installed or run.
  CLI contracts were checked against [Gitleaks source](https://github.com/gitleaks/gitleaks/blob/master/cmd/root.go)
  and [TruffleHog documentation](https://github.com/trufflesecurity/trufflehog#usage).
- Three isolated workflow executions pass: review of a committed change against
  a nonstandard base branch with unrelated local edits; plan-only story creation;
  and an existing-plan refresh preserving an authored maintainer note. The clean
  review returned no findings, focused tests passed 2/2, and a replay against the
  original implementation detected the regression. No next story, implementation,
  extra reviewers, or continuation prompts were started by the planning cases.
- XML/configuration, source hashes for 36 provenance families, reviewed footprints
  for 281 skills, model invocation/capability checks, menu mappings, and whitespace
  pass. Upstream pins and audited source/license information are unchanged.
- Final package build/dry run contains the shared guide, all 15 updated module
  files, and scanner helper; built module bytes match source. Website data and
  production build checks pass.
- Updated five existing skill scopes and the shared global workflow tree with
  ownership checks and private backups. No customization conflict occurred;
  saved installation choices remain unchanged. All 122 enabled direct command
  routes per scope and both delivery modes still resolve correctly. Verified
  1,450 manifest entries, with zero drift across 220 shared skill names.

Temporary evidence lives in this conversation's `workflow-cleanup-2026-10-18/`
evidence directory. The behavioral cases exercise the instruction interpreter
in isolated fixtures; they are not a full live matrix of every native host.
No application binary, release, publication, commit, or push was part of this task.
