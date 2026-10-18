# Resolve review scope

Use this for story implementation and code review. Review the requested change
and the context needed to understand it; workspace dirt is not task ownership.

1. Honor explicit files, patches, commit ranges, PR bases, and worktrees. Record
   selected paths/source identities. Include changed configuration, tests, skills,
   or workflows when they are the product under review. Exclude unrelated or
   generated material by relevance, not universal directory-name exclusions.
2. For branch/PR reviews, use supplied PR metadata or repository default-branch
   metadata (`git symbolic-ref --quiet refs/remotes/origin/HEAD` when present).
   Verify the ref exists locally and is the intended base. A tracking ref is not
   necessarily the PR base. Never assume `Production`, `main`, or `master` exists.
   Ask if the requested range remains ambiguous; a separate scoped worktree
   review may proceed with its limitation stated.
3. Pin base/head object IDs, compute their merge base, then inspect
   `git diff --name-status <merge-base-oid> <head-oid> -- <scoped-paths>` and its
   content diff, including renames/deletions and necessary integration context.
   Honor explicitly requested commit-range semantics instead of replacing them
   silently with a merge-base diff.
4. Inspect applicable local changes with `git status --short`, `git diff`,
   `git diff --cached`, and `git ls-files --others --exclude-standard`. Include
   only task-owned relevant edits. If overlapping edits cannot be separated,
   ask rather than staging, stashing, discarding, or attributing unrelated work
   to the story. Use quoted arguments/argument arrays for task-supplied paths.
5. Cross-check a story's File List against committed and applicable local changes.
   No worktree diff does not prove a listed file is unchanged: work may already
   be committed. Ledger discrepancies are not automatically high severity or
   evidence of false claims; verify the acceptance criterion and actual impact.
6. Bind review/check evidence to the resolved source and relevant inputs. Reuse
   unchanged evidence; changed source, base, configuration, or unverifiable
   provenance requires affected checks again. State limits without a Git
   repository or usable base; preserve other work.
