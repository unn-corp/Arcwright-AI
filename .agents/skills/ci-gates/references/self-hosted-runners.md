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
marks docker-in-docker capability (the SAST job needs a Docker daemon, which
these runners provide — but mount it correctly; see the trap below).

The repo-scoped `ci-runner-runner-fcm-*` / `-external-*` containers are bound to
other repos and will **not** pick up this org's jobs.

## DinD trap: `docker run -v "$GITHUB_WORKSPACE"` mounts an EMPTY dir

These runners are themselves **containers** with the host's Docker socket mounted
(docker-in-docker sibling). That breaks the obvious ways of running a scanner in
a container, and the failure is silent in the worst case:

- **`docker run -v "${{ github.workspace }}:/src" img …`** — the `-v` source is
  resolved by the **host** daemon, where the workspace path (inside the runner
  container) does not exist. Docker creates an **empty** dir there and mounts it.
  The scanner then either errors (config not found) or, worse, **passes
  vacuously** — it scanned nothing. Do **not** trust a green from this pattern.
- **`container:` jobs** — the runner must inject its own `node` (for JS actions
  like `actions/checkout`) and a `_temp` script mount into the job container.
  A self-hosted DinD runner often lacks the matching externals (e.g. the musl
  `node24_alpine` build for an Alpine image), so `actions/checkout` and even
  plain `run:` steps fail with `exec: node …: no such file` or
  `sh: can't open /__w/_temp/…sh`.

**Two patterns that DO work:**

1. **Native release binaries** (preferred for scanners that ship one — gitleaks,
   trivy, osv-scanner). `curl` the linux binary and run it against
   `$GITHUB_WORKSPACE` directly. No daemon, no mount. Works on self-hosted and
   GitHub-hosted alike. This is what the scaffolded `security` job uses.
2. **`docker cp` into the container** (for tools that only ship an image, e.g.
   semgrep with its bundled `semgrep-core`). Run a *normal* job (so
   `actions/checkout` works on the bare runner), then:

   ```bash
   CID=$(docker create img <scan-cmd> /src)
   trap 'docker rm -f "$CID" >/dev/null 2>&1 || true' EXIT
   docker cp "$GITHUB_WORKSPACE/." "$CID:/src"   # daemon API — no path mismatch
   docker start -a "$CID"                        # runs + propagates exit code
   ```

   `docker cp` transfers files through the daemon API, so the host/container path
   mismatch is irrelevant. This is what the scaffolded `sast` (semgrep) job uses.

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
