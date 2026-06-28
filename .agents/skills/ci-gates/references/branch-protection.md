# Turning CI jobs into hard merge gates

The `ci.yml` jobs only *report* status until you make them *required*. Two ways:

## Option A — classic branch protection (per branch)

```bash
# Require the named status checks to pass before merge into main.
gh api -X PUT repos/<owner>/<repo>/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  -f required_status_checks='{"strict":true,"contexts":["static (node)","test (node)","security"]}' \
  -F enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":1}' \
  -f restrictions=null
```

- `strict: true` = branch must be up to date with base before merge.
- `contexts` must match the job `name:` values in `ci.yml` exactly.

## Option B — repository ruleset (newer, org-scalable)

Settings → Rules → Rulesets → New branch ruleset:
- Target: `main` (and `dev`).
- Require status checks to pass → add the same job names.
- Require pull request before merging → 1 approval, dismiss stale approvals.
- Block force pushes.

## Recommended required set

| Check | Why |
|-------|-----|
| `static (node)` | format + lint + type-check |
| `test (node)` | unit tests + 80/80/70 coverage |
| `security` | secret scan + dep/SAST |
| `pr title` | conventional PR title (squash-merge commit hygiene) |

Keep `python`/E2E jobs required only on repos that have them. Don't require a
job that doesn't run on every PR, or merges will hang waiting for a check that
never reports.
