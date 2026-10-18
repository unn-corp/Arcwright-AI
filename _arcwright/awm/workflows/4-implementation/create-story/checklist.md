# Story context quality

Validate the prepared story against its actual sources. Reuse unchanged context
and inspect only sections needed to verify a claim or resolve uncertainty.
Independent validation is conditional on the selected task/workflow, not a
requirement to spawn a fresh reviewer or reread the whole corpus.

- [ ] The target story/epic, user goal, scope boundaries, and dependencies match
  the request. No extra story or implementation work has been added implicitly.
- [ ] Acceptance criteria reflect verified requirements and map to practical,
  dependency-ordered tasks. No arbitrary issue, subtask, or test quota applies.
- [ ] Existing functionality, utilities, and suitable tests/fixtures are reused
  where appropriate; task verification follows installed `test-quality`.
- [ ] Relevant architecture, APIs, ownership/auth rules, data/migration risks,
  code locations, and project standards are supported by sources.
- [ ] Library/API details use the project's pinned versions. Uncertain material
  claims are checked against primary documentation rather than guessed or
  replaced with an unrequested latest-version upgrade.
- [ ] UI scope is determined from behavior. Relevant design-system,
  accessibility, responsive, and loading/error/empty-state requirements are
  included even when a dedicated UX document is absent.
- [ ] Relevant prior-work decisions and risks are captured without repeating
  entire reports. References point to code, documents, or source URLs; reusable
  context records source identities and unresolved gaps.
- [ ] Concrete gaps are fixed within scope. Optional suggestions may be declined
  with reasons; a clean review is valid. Unresolved material questions, required
  review, and dependencies remain visible and prevent ready-for-dev status.
- [ ] The story is concise, contains no unresolved implementation-blocking
  placeholders when ready, and has no model fields or attribution labels.
- [ ] Status and any matching sprint entry agree. Existing authored content,
  comments, ordering, and unrelated stories are preserved.

For an audit-only request, report findings without edits. For authorized plan
maintenance, apply supported in-scope corrections without another selection
prompt. Report the final path/status and blockers. Start `dev-story` only when
implementation is already authorized; otherwise return the prepared plan.
