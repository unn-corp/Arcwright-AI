# Amplify deployment performance

Use this reference when a build is slow, a monorepo is expensive to deploy, or a
frontend-only change is redeploying a backend. It is deliberately measurement-first.

## 1. Establish the baseline

Capture at least one cold-ish and one warm job for the same branch. Inspect the job
steps and the actual log, not only the top-level duration:

```bash
APP=<app-id>
BRANCH=main
JOB=<job-id>
REGION=us-east-1

aws amplify get-job --app-id "$APP" --branch-name "$BRANCH" --job-id "$JOB" \
  --region "$REGION" \
  --query 'job.steps[].[stepName,status,startTime,endTime]' --output table

URL=$(aws amplify get-job --app-id "$APP" --branch-name "$BRANCH" --job-id "$JOB" \
  --region "$REGION" --query 'job.steps[0].logUrl' --output text)
curl -fsSL "$URL" -o /tmp/amplify-build.log

grep -aE 'Cloning repository|Retrieving cache|Extracting cache|Retrieved cache|\
Starting Backend Build|Completed Backend Build|Starting Frontend Build|\
Build completed successfully|Creating cache artifact|Created cache artifact|\
Uploading cache artifact|Uploaded cache artifact' /tmp/amplify-build.log
```

Create a phase table with duration, file count/size where relevant, controllability,
and the user-visible or deployment risk. The interval after clone and before backend
build often includes cache retrieval; do not label it clone time without checking the
intermediate markers.

The supplied playbook measured one Gen 2 npm-workspaces/Vite project at 275 seconds
before and 155 seconds after two changes. Those measurements prioritize investigation
of cache handling and no-op CloudFormation, but they are not a promise for another
repo, region, framework, or build image.

## 2. Gate backend deployment safely

`ampx pipeline-deploy` is appropriate when backend source or its deployment inputs
changed. It is wasteful when a frontend-only commit is rebuilding a backend that is
already live. A safe gate has these properties:

- the baseline is the commit whose backend deployment is known to be live for the
  branch, not merely the previous commit;
- the change set includes backend source, function code, generated/deployed inputs,
  workspace packages bundled into functions, and the lockfile/manifests that can
  change backend dependencies;
- the missing-baseline, missing-commit, shallow-clone, state-store failure, and diff
  failure paths all deploy; and
- the baseline advances only after deciding/deploying in a way that cannot make a
  failed backend deploy appear live. If the state store cannot represent that safely,
  use a conservative always-deploy fallback.

Amplify's `envCache --get`/`--set` is a useful per-build state mechanism when the state
is local to the Amplify app/branch. SSM can be appropriate for a deliberately shared
or cross-account contract, but requires least-privilege `ssm:GetParameter`/
`ssm:PutParameter` and careful failure handling. Never add an SSM dependency merely
because it is familiar.

When the backend has already been deployed by another pipeline, use
`npx ampx generate outputs --branch <branch> --app-id <id>` for the frontend. That
command retrieves client configuration; it is not a substitute for deploying a
backend change.

## 3. Optimize the cache by file count and scope

Amplify cache paths are relative to the project root. Absolute paths can appear to
succeed while caching nothing. Start with counts, not only disk usage:

```bash
du -sh node_modules 2>/dev/null || true
find node_modules -type f 2>/dev/null | wc -l
find node_modules -type f 2>/dev/null | sed 's#/[^/]*$##' | sort | uniq -c | sort -nr | head -20
```

For a monorepo, first prove which packages are imported by backend and frontend code.
Then consider a dependency-only backend workspace outside `amplify/` and a scoped
frontend install. A scoped `npm install -w ...` does not prune an already-restored
backend tree, so the old tree must be removed deliberately before the frontend cache
is saved. Do not remove it until a local backend install/deploy path and a local
frontend build have both been validated.

A cache section should contain only paths the build actually reuses. A typical shape
is:

```yaml
cache:
  paths:
    - node_modules/**/*
    - apps/*/node_modules/**/*
    - packages/*/node_modules/**/*
    - .npm-cache/**/*
    - amplify_outputs.json
```

Treat this as a starting point, not a copy/paste prescription. Remove unused paths,
exclude generated/backend-only trees where the phase does not need them, and keep the
cache path relative. Cache an npm tarball directory only when a build step wipes or
misses `node_modules` and measurements show a benefit.

## 4. Keep installs deterministic

- Pin Node and Amplify CLI/tool versions in the supported build configuration; avoid
  a floating `latest` live package update.
- Use `npm ci` when the lockfile is valid for the actual dependency tree and the build
  image. If a bundled dependency causes strict lock validation to fail, record the
  exact error and reason for a fallback to `npm install --no-audit --no-fund
  --prefer-offline`; do not turn that one exception into a universal rule.
- Commit a public registry setting when local credentials or CodeArtifact defaults can
  rewrite lockfile URLs. Check the lockfile before committing and never expose a
  private token in the file.
- Do not cache or commit secrets, credentials, `.env` files, or branch-specific
  outputs without confirming their intended ownership and freshness.

## 5. Reduce build frequency without hiding changes

Use `AMPLIFY_DIFF_DEPLOY=true` and, where needed, `AMPLIFY_DIFF_DEPLOY_ROOT` when the
configured root accurately represents the hosted frontend. Confirm that a backend
change, shared package change, generated asset, preview branch, and manual release
still trigger the correct work. `[skip-cd]` and disabled auto-build are operational
controls, not performance fixes; document who or what starts the required release.

## 6. Validate without burning a build

After changing the buildspec or workspace layout:

```bash
# Adapt paths to the repository; these are local checks, not a universal command set.
python3 -c 'import yaml; yaml.safe_load(open("amplify.yml"))'
bash -n /tmp/amplify-backend-guard.sh
npx tsc --noEmit -p amplify/tsconfig.json
npm run build --workspace <frontend-workspace>
```

If a loader smoke test reaches the expected missing Amplify context but does not report
`Cannot find module` for a backend resource, the module boundary is probably intact.
Also simulate at least these guard outcomes:

| Scenario | Required result |
|---|---|
| Backend source changed | Full backend deploy |
| Frontend-only, valid cached outputs | No backend deploy; build frontend |
| Frontend-only, outputs missing/stale | Generate/refresh outputs; never silently use stale config |
| Missing baseline, missing commit, or diff error | Full backend deploy |
| Manual release or shallow clone | Conservative full deploy unless the live baseline is verifiable |

Measure the next warm and cold jobs and compare the phase table. A change is complete
only when the speedup and the preserved deployment contract are both demonstrated.
