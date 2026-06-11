---
name: commit-commands
description: >
  Use when committing staged changes, creating a commit + PR in one step, or pruning
  local branches whose remote is gone. Lighter than verify-and-ship (no tests/lint/typecheck).
  NEVER auto-commits — always shows the message first. Triggers on /commit, /commit-push-pr,
  /clean-gone.
allowed-tools: Bash
---

# Commit Commands — Lightweight Daily Git Trio

Three lean git operations. No test runs, no quality checks — those are `verify-and-ship`.
**NEVER commit without showing the message and getting confirmation.**

---

## Conventional Commit Rules

Format: `<type>(<scope>): <subject>`

| Type | When |
|------|------|
| `feat` | New capability or user-visible behavior |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `test` | Adding or fixing tests |
| `chore` | Build scripts, deps, config |
| `perf` | Performance improvement |
| `ci` | CI pipeline changes |

Rules:
- `<scope>` optional; use the module/area name in parentheses if helpful (e.g. `feat(installer): …`)
- `<subject>` imperative, lowercase, no period, ≤72 chars
- Body (optional): wrap at 72 chars, explain *why* not *what*, blank line after subject
- Breaking change: append `!` after type/scope and add `BREAKING CHANGE:` footer
- Do NOT add `Co-Authored-By` or any attribution footer

---

## /commit — Staged Changes → Conventional Commit

### Procedure

1. Run `git diff --cached --stat` — if nothing staged, report "Nothing staged" and stop.
2. Run `git diff --cached` to read the actual diff.
3. Derive the commit type from the diff:
   - New files → `feat` unless they're tests (`test`) or docs (`docs`)
   - Bug fix pattern → `fix`
   - Refactor (rename/extract, no new behavior) → `refactor`
   - Config/build changes → `chore`
4. Draft the subject: imperative, ≤72 chars, summarize the *intent* not the file list.
5. If body is warranted (breaking change, complex rationale), draft it too.
6. **Show the full commit message and ask for confirmation.**
7. On confirmation (or `--yes`): `git commit -m "$(cat <<'EOF'\n<message>\nEOF\n)"`.
8. Report the short SHA after commit.

---

## /commit-push-pr — Commit + Push + Open PR

### Procedure

1. Run `/commit` steps 1–7. Stop if nothing staged or user rejects the message.
2. After commit, push: `git push -u origin HEAD`.
3. Check for existing PR: `gh pr view --json url 2>/dev/null`.
   - If PR exists → show its URL, offer to update description.
   - If no PR → create one with `gh pr create --fill`.
     - `--fill` uses commits for title/body. Enhance if the description would be sparse.
4. Show the PR URL.

---

## /clean-gone — Prune Branches Whose Remote Is Gone

### Procedure

1. Fetch with prune: `git fetch --prune`.
2. List branches with gone remotes:
   ```bash
   git branch -vv | grep ': gone]' | awk '{print $1}'
   ```
3. If none → report "No gone branches found."
4. Show the list and ask for confirmation before deleting.
5. On confirmation: `git branch -d <branch>` for each. Use `-D` only if `-d` fails and user confirms force-delete.
6. Report deleted branches.

---

## Constraints

- NEVER run `git commit` without user seeing the message first.
- NEVER use `--no-verify` — do not bypass hooks.
- NEVER amend a commit that has already been pushed.
- If `git push` is rejected (non-fast-forward), stop and report — do not force push.
- `/clean-gone` only deletes local branches — never touches remotes.

---

## Compared to verify-and-ship

| | `commit-commands` | `verify-and-ship` |
|--|-------------------|--------------------|
| Runs tests | No | Yes |
| Runs lint/typecheck | No | Yes |
| Updates changelog | No | Yes |
| Creates PR | `/commit-push-pr` only | Yes (always) |
| When to use | Fast daily commits | Pre-ship quality gate |
