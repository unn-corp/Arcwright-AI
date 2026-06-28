# Self-hosted runners (self-hosted-first default)

The scaffolded `ci.yml` targets **self-hosted** runners by default, not GitHub-
hosted. Every job shares one `runs-on` label set — change it in one place.

## Label set

```yaml
runs-on: [self-hosted, linux, x64]
```

`runs-on` with an array is **AND** semantics: the job runs only on a runner that
carries *every* label. Add a custom org label to pin to your own fleet:

```yaml
runs-on: [self-hosted, linux, x64, unn]   # only this org's runners
```

There is **no native fallback** in `runs-on` — if no online runner matches all
the labels, the job queues until one appears (this is the intended "self-hosted
only, no GitHub-hosted fallback" posture). To allow GitHub-hosted instead, set
`runs-on: ubuntu-latest`.

## unn-corp fleet (this org)

Org-scoped runners live on the **mothership** VPS as Docker containers
(`myoung34/github-runner`, ubuntu-jammy):

| Property | Value |
|----------|-------|
| Containers | `ci-runner-runner-1`, `-2`, `-3` (org-scoped) |
| Scope | `RUNNER_SCOPE=org`, `ORG_NAME=unn-corp` |
| Runner group | `default` |
| Labels | `self-hosted, linux, x64, unn, dind` |

So the org-runner target is `[self-hosted, linux, x64, unn]`. The `dind` label
marks docker-in-docker capability (the security job's container actions —
gitleaks/trivy/semgrep — need a Docker daemon, which these runners provide).

The repo-scoped `ci-runner-runner-fcm-*` / `-external-*` containers are bound to
other repos and will **not** pick up this org's jobs.

## Troubleshooting "queued forever"

1. **Runner group access** — the org runner group (`default`) must grant the
   repo access. Org admin: Settings → Actions → Runner groups → repository access.
   (Listing this needs the `admin:org` API scope.)
2. **Runners online** — on the VPS: `docker ps | grep ci-runner-runner` and
   `docker logs ci-runner-runner-1 --tail 50` (look for "Listening for Jobs").
3. **Label typo** — every label in `runs-on` must exist on a runner; one extra
   label no runner has = permanent queue.
4. **Concurrency** — three org runners = three concurrent jobs; the workflow's
   `concurrency:` cancels superseded runs to avoid backlog.
