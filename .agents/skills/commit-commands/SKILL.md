---
name: commit-commands
description: Commit authorized changes, push or open a PR when requested, and prune local branches whose upstream is gone. Preserve existing authorization, user work, and repository checks.
allowed-tools: Bash
---

# Commit commands

Use the requested Git operation and existing authorization. A request to commit,
push, ship, or update a PR already authorizes its ordinary steps; do not ask for
the same permission again. Show the intended commit message before committing.
When authority or scope is missing, prepare the concrete diff/message first and
ask only for the missing decision. These commands do not commission a release.

## Commit

1. Inspect status, the staged diff, the requested scope, and applicable repository
   instructions. Stage only authorized changes; preserve unrelated work and ignore
   private fleet records. If nothing is staged or changed, report that result.
2. Complete required repository checks. Use [test-quality](../test-quality/SKILL.md)
   when deciding test effort; reuse current verification instead of repeating green
   checks or imposing a new test/changelog requirement.
3. Use `<type>(<scope>): <subject>`: imperative, lowercase, no final period, at most
   72 characters. Scope is optional. Choose `feat`, `fix`, `refactor`, `docs`,
   `style`, `test`, `chore`, `perf`, or `ci` from the change's purpose. A new file
   alone does not imply `feat`. Explain material reasons in the body when needed;
   use `!` and a `BREAKING CHANGE:` footer only for an actual breaking change.
4. Show the message, then commit under existing authority. For multiline messages,
   write the exact text with a file tool to host evidence or an ignored Arcwright
   run directory, then pass that path to `git commit --file`. A single-line example:

   ```sh
   git commit -m 'fix(installer): preserve customized skills on update'
   ```

5. Report the commit ID and observed checks. Keep model/harness credits,
   generated-by notices, and coauthor trailers out of commits and PRs.

## Push and PR

Push only when authorized; commit-only work ends after the commit. Inspect the
remote branch first and preserve concurrent contributions. Reconcile a safe
fast-forward, rebase, or merge according to repository convention; never force-push
or rewrite published history without applicable explicit authority. Publish any
new submodule commits before pushing parent pointers.

Create or update a PR only when requested or authorized by the enclosing workflow.
Reuse an existing PR. For multiline bodies, use a structured API or `gh pr create
--body-file` with the exact text. In Arcwright Code/T3 Code, register every worked-on
PR with `link_pull_request` and check `list_thread_pull_requests` before handoff.

## Prune gone local branches

For an authorized cleanup, fetch/prune remote-tracking refs, inspect local branches
whose upstream is gone, and show the proposed list. Delete only selected merged
local branches with `git branch -d`. A refusal for unmerged work requires a separate
decision; do not substitute `-D`. Never delete a remote branch as part of this mode.

Keep hooks enabled. Do not amend a pushed commit or bypass branch protections.
If publication cannot proceed safely, preserve the local commit and report the
concrete blocker. Preserve required copyright, license, and source notices.
