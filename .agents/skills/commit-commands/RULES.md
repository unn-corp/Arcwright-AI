# Commit commands: quick rules

Read `SKILL.md` for the selected operation.

- Honor existing commit/push/PR authority without repeated confirmation; show the
  intended message before committing. Ask only for missing authority or scope.
- Inspect and stage authorized changes; preserve unrelated work and ignored fleet records.
- Run required repository checks; use `test-quality` to choose focused verification.
- Use `<type>(<scope>): <subject>`, imperative, lowercase, at most 72 characters.
- Use a message/body file for multiline text. No model/harness credits or coauthor trailers.
- Keep hooks and branch protections. No published-history rewrite without explicit authority.
- Push submodule commits before their parent pointers. Link worked-on PRs in Arcwright Code.
- Prune selected merged local branches with `git branch -d`; unmerged or remote deletion
  requires its own authorization.
