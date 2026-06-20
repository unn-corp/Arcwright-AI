# 21. Container & Image Hardening
**Maps to:** `infrastructure/docker.md`, `references/misconfiguration.md`, `references/supply-chain.md`

**Principle:** a container is a deployment artifact with its own attack surface. A breach inside
a container that runs as root, ships a fat base image full of CVEs, or bakes in secrets is far
more damaging than it needs to be. This scans `Dockerfile`(s), `.dockerignore`, and compose/IaC
image config — repo-static.

> **N/A** if the repo has no container artifacts. Runtime/orchestration hardening (K8s
> securityContext, seccomp, runtime admission) is broader — flag as recommendations.

**Detect:**
```bash
git ls-files | grep -iE "Dockerfile|\.dockerignore|docker-compose|Containerfile" | head
```

**What good looks like:**
- **Runs as non-root** — an explicit `USER` directive (a non-root UID); the process doesn't
  need root. Filesystem read-only where possible (`--read-only` / `readOnlyRootFilesystem`).
- **Pinned, minimal base image** — a specific tag/digest (not `:latest`), and a slim/distroless/
  alpine base to shrink CVE surface. Multi-stage build so build tools/secrets don't ship in the
  final image.
- **No secrets in the image** — secrets not passed via `ARG` (they persist in history/layers) or
  `ENV`; injected at runtime instead (topic 7). `.dockerignore` excludes `.env`, `.git`, keys, `node_modules`.
- **Reproducible & current** — dependencies installed from a lockfile (topic 10); base image
  patched/rebuilt regularly; `HEALTHCHECK` defined.
- Minimal surface: no unnecessary packages, no `curl | bash` installs, no SSH server in the image.

**Red flags:**
| Pattern | Severity |
|---------|----------|
| No `USER` directive → container runs as **root** | **High** |
| Secret in `ARG`/`ENV` or `COPY`'d into a layer (key, token, `.env`) | **High** |
| Base image `:latest` or unpinned (non-reproducible, drifts onto new CVEs) | **Medium** |
| `.env`/`.git`/credentials not in `.dockerignore` → copied into image | **Medium/High** |
| `curl … \| bash` / `wget … \| sh` install in the Dockerfile (unverified supply chain) | **Medium** |
| `ADD <remote-url>` instead of `COPY`; fat base image with known HIGH/CRITICAL CVEs | **Medium** |

**Tools (hybrid):**
```bash
# Image/Dockerfile scanners (any installed)
command -v hadolint >/dev/null && hadolint $(git ls-files | grep -i Dockerfile) 2>/dev/null | head -40
command -v trivy >/dev/null && trivy config $(git ls-files | grep -i Dockerfile | head -1) 2>/dev/null | tail -30
command -v dockle >/dev/null && echo "dockle available (scans built images)"
# Quick greps
grep -rniE "^FROM .*:latest|^FROM [^@:]+$" $(git ls-files | grep -i Dockerfile) 2>/dev/null
grep -rniE "^USER |^ARG .*(SECRET|TOKEN|KEY|PASSWORD)|curl.*\| ?(bash|sh)|^ADD https?://" $(git ls-files | grep -i Dockerfile) 2>/dev/null
cat .dockerignore 2>/dev/null | grep -iE "\.env|\.git|node_modules|secret" || echo "no/empty .dockerignore"
```

**Verdict guidance:**
- ✅ **Pass** — non-root USER, pinned minimal base, multi-stage, no baked secrets, `.dockerignore`
  excludes secrets, healthcheck present.
- ⚠️ **Weak** — runs non-root but uses `:latest`, or missing `.dockerignore`, or a fat base.
- ❌ **Fail** — runs as root **and**/or bakes a secret into the image.

Report findings as `SCAN-NN` with the `Dockerfile:line`.
