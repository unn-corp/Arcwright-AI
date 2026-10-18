---
title: 'Story implementation completion checks'
validation-target: 'Story markdown ({{story_path}}) and its scoped implementation'
---

# Story completion

Apply these checks to the assigned story. Reuse verifiable unchanged evidence;
do not create another validation run merely to fill this checklist.

- [ ] The requested scope, acceptance criteria, relevant AGENTS.md, and actual
  branch/commit/local changes are identified; unrelated work is preserved.
- [ ] Implementation satisfies each acceptance criterion and applicable
  architecture, security, dependency, and UX constraints.
- [ ] Only tasks supported by implementation and appropriate verification are
  checked complete. Necessary failure/edge paths have evidence.
- [ ] Test effort follows `test-quality`: suitable tests/fixtures are reused;
  added cases distinguish plausible defects in changed public behavior. Cosmetic
  or documentation-only tasks need no tests without a concrete risk.
- [ ] Affected tests and repository-required gates pass on the relevant source
  and inputs. Failed, skipped, zero-selection, interrupted, and unrun checks are
  distinguished from passes; pre-existing failures are identified.
- [ ] UI/runtime behavior is inspected where relevant and practical, with any
  unavailable verification stated. Test doubles alone are not runtime proof.
- [ ] The review required by the selected task/workflow is complete; confirmed
  material findings are resolved or explicitly accepted within authorization.
  Required independent review is not silently replaced by self-review.
- [ ] File List, concise implementation notes, Change Log, and useful skill
  references describe actual work without model/attribution fields or footers.
- [ ] Status is `done` only when all required gates and acceptance criteria pass;
  use `review` for pending required review or `in-progress` for incomplete work.
  Only the matching sprint entry is updated, when tracking exists.
- [ ] Completion returns the assigned story result without implicitly starting
  another story, retrospective, publication, or release.

Report PASS or the specific pending/failed items, observed checks, status, and
remaining work. A skipped or unavailable required gate prevents completion.
