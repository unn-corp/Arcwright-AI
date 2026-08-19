---
name: amplify-best-practices
description: Use when planning, implementing, deploying, debugging, or reviewing AWS Amplify Gen 2/Hosting applications, ampx commands, amplify.yml, amplify_outputs.json, Amplify Functions/Data/Auth/Storage, or a frontend whose build and runtime depend on Amplify. Especially relevant when reducing CI/CD time, Lambda latency, cache overhead, or UI load and interaction cost.
---

# Amplify best practices

Treat Amplify as a delivery system with three coupled performance surfaces:

1. the Amplify build and deployment pipeline;
2. the backend runtime, especially Amplify Functions backed by Lambda; and
3. the browser UI and asset-delivery path.

Optimize the surface that the evidence identifies. Do not trade a faster build for a
stale backend, a broken branch contract, insecure caching, or a slower user experience.

## Operating contract

- Detect the generation and hosting model first. Record Gen 1 vs Gen 2, Amplify
  Hosting vs a custom CI pipeline, framework, package manager, monorepo layout,
  branch/app mapping, and whether the app is static, SSR, or hybrid.
- Start from evidence. For deployment work, inspect Amplify job logs and phase
  timings before changing `amplify.yml`, cache paths, dependency layout, or deploy
  frequency. For UI work, measure a production build and the field/lab metrics that
  represent the user journey.
- Keep facts, assumptions, findings, and recommendations separate. A number from the
  supplied build-time playbook is a useful case study, not a universal Amplify limit.
- Preserve behavior, branch/environment isolation, auth boundaries, output-file
  freshness, cache correctness, and rollback paths unless the user explicitly accepts
  a behavior change.
- Reviews are read-only by default. Do not run `ampx pipeline-deploy`, change an AWS
  resource, publish a build, alter a webhook, or mutate SSM/envCache state during a
  review unless the user explicitly authorizes that exact mutation.
- Never put secrets, tokens, webhook URLs, or raw user/data payloads into hook output,
  logs, build artifacts, or committed configuration.

## Choose the mode

### Planning

Inventory the repository and deployment contract, then create a baseline and an ordered
plan. Prioritize the largest measured phase first. The plan must identify the likely
blast radius of each optimization, how to validate it locally, how to measure the next
Amplify job, and how to roll it back.

### Implementation

Make the smallest evidence-backed change. Keep backend-deploy decisions fail-open:
unknown baseline, missing commit, unavailable state, or a diff error must deploy the
backend rather than silently skip a required change. Validate both backend and frontend
paths after changing dependency scope, cache contents, or build commands.

### Review

Read [references/review-checklist.md](references/review-checklist.md) and report
severity, evidence, user/build impact, smallest safe improvement, trade-offs,
validation, rollback, unchanged behavior, and open questions. Do not convert a review
finding into an edit without saying so.

## First-pass inventory

Search for and inspect, as applicable:

- `amplify/backend.ts`, `amplify/tsconfig.json`, `amplify/**/resource.ts`, function
  handlers, `defineBackend`, `defineFunction`, `defineData`, `defineAuth`, and
  `defineStorage`;
- `amplify.yml`/`amplify.yaml`, `customHeaders.yaml`, framework build configuration,
  `amplify_outputs.json`, package manifests, lockfiles, workspace declarations, and
  `.npmrc`;
- `ampx sandbox`, `ampx pipeline-deploy`, `ampx generate outputs`, `npm install` or
  `npm ci`, cache declarations, diff-deploy variables, and any backend-deploy guard;
- frontend entrypoints, route boundaries, data-loading code, images/fonts, bundle
  reports, SSR/SSG/ISR settings, and Web Vitals or Lighthouse instrumentation; and
- the Amplify service role, environment variables, branch settings, deployment logs,
  alarms, and known downstream consumers when they are in scope.

If a deployed fact cannot be inspected, mark it unknown. Do not infer it from a clean
CloudFormation diff or from the presence of an Amplify file alone.

## Build and deployment priorities

Use the detailed procedure in
[references/deployment-performance.md](references/deployment-performance.md).
The default ordering is:

1. Measure cache restore/extract, install, backend deploy, frontend build, and cache
   create/upload separately. Cache work can be hidden between clone and backend log
   markers.
2. Avoid a no-op backend CloudFormation deploy on frontend-only changes, but compare
   against the commit whose backend is actually deployed—not only `HEAD~1`. Persist a
   per-branch baseline with a mechanism appropriate to the deployment topology, such
   as Amplify `envCache`; use SSM only when its cross-build/account role and IAM are
   intentional. Unknown state always falls back to deploy.
3. Optimize cache file count and scope, not just cache megabytes. Cache paths are
   repository-relative. Exclude generated or backend-only trees from frontend caches;
   remove an already-restored backend dependency tree before a scoped frontend install.
   Do not add an npm tarball cache unless measurements show it helps the chosen install
   strategy.
4. Let frontend-only builds obtain a valid `amplify_outputs.json` with
   `ampx generate outputs` or a verified artifact. Never use a full backend deploy just
   to produce client configuration. Treat cached outputs as branch/environment data,
   not as an unvalidated immutable file.
5. Use Amplify's supported diff-deploy controls when their root matches the app. Batch
   or skip builds for changes that do not affect the deployed app, and confirm that
   previews, manual releases, and multi-app monorepos still build when they should.
6. Pin the runtime and dependency inputs used by CI. Prefer `npm ci` when the lockfile
   and dependency tree support it; if an Amplify bundled-dependency limitation makes it
   fail, document the measured exception and use the narrowest deterministic install
   that succeeds. Pin the public registry when private-registry URLs can leak into the
   lockfile.
7. Keep the `amplify/` loader boundary intact. A dependency-only workspace can be
   useful, but move it only after import analysis and local `ampx`/frontend validation;
   do not add an unrelated `package.json` inside `amplify/` merely to scope installs.

Do not spend the first optimization cycle on git-history size or bundler micro-tuning
when cache handling or an unconditional backend deploy dominates the measured job.

## Backend runtime priorities

Amplify Functions are Lambda functions. For each latency-sensitive function:

- keep SDK clients, connection pools, and immutable configuration outside the handler
  so warm environments can reuse them, while keeping request/user state per invocation;
- import only what the function needs, keep the deployment bundle small, lazy-load
  cold paths, and split unrelated work into focused functions when initialization is
  the bottleneck;
- set timeout, memory, runtime, concurrency, retry, and idempotency behavior from
  workload evidence; increasing memory can reduce duration but must be tested against
  cost and downstream capacity;
- avoid serial network calls when independent calls can be safely parallelized, bound
  payloads and pagination, and avoid application-wide scans or unbounded list results;
- make retries and event handling idempotent, instrument cold-start/init and handler
  duration separately, and verify downstream throttling/error behavior; and
- keep environment-specific values in configuration/secrets rather than source, with
  least-privilege permissions.

For DynamoDB access patterns, use the `dynamodb-best-practices` skill as well. Do not
turn a generic Amplify recommendation into a DynamoDB schema decision without an
access-pattern review.

## UI and asset-delivery priorities

Read [references/ui-performance.md](references/ui-performance.md) for framework-aware
checks. Always prioritize the critical user journey:

- measure Core Web Vitals at the 75th percentile—LCP for loading, INP for interaction,
  and CLS for stability—using both a production lab run and field data when available;
- configure Amplify once, as early as the application entrypoint requires, and avoid
  repeated client initialization or backend-output fetches during render;
- keep the initial route small with route/component code splitting, dynamic imports for
  deferred features, direct imports when barrel files pull in unused modules, and
  verified bundle-size budgets; do not add `memo`/memoization everywhere without a
  measured rerender problem;
- parallelize independent data requests, avoid request waterfalls, use bounded and
  paginated reads, provide stable loading/error/empty states, and cache only data whose
  freshness and authorization semantics permit it;
- optimize the actual LCP element, images, fonts, and above-the-fold CSS. Reserve
  image optimization and long-lived CDN caching for content that is immutable or has a
  deliberate invalidation strategy;
- choose static, SSR, or hybrid rendering per route. Cache public immutable assets
  aggressively, keep HTML/dynamic/personalized responses revalidated, and never cache
  user-specific responses in a shared cache; and
- for React, prefer local state and pure rendering, profile before memoizing, lazy-load
  non-critical routes, and use transitions/deferred work for expensive non-urgent
  updates. Coordinate with `react-expert` and
  `frontend-responsive-design-standards` when those skills apply.

## Validation gate

Before calling an optimization complete, run the checks that fit the repository:

- parse `amplify.yml` and validate every inline shell block with `bash -n`;
- verify lockfile/registry hygiene and that the intended scoped install really omits
  backend-only dependencies;
- run the frontend build from the same working directory and install scope Amplify
  will use; run backend typecheck/tests and an `ampx` loader check without confusing
  an expected missing Amplify context with a module-resolution failure;
- test backend-changed, frontend-only with valid outputs, frontend-only without
  outputs, missing-baseline, manual-release, and shallow-clone branches of any deploy
  guard; and
- compare the next warm and cold Amplify jobs, bundle output, Web Vitals, Lambda
  duration/init/error metrics, and rollback behavior. A faster local build alone is not
  proof of a faster Amplify deployment.

## Review output

Use this compact shape:

```text
Scope / generation / hosting model / preserved behavior:
Evidence and unknowns:
Build-phase and runtime baseline:
Findings:
  [severity] evidence → impact → smallest safe improvement → trade-off
Plan or rollout:
Validation / measurement / rollback:
Unchanged by design:
Open questions:
```

## References

- [Deployment performance](references/deployment-performance.md) — read for build
  measurement, cache/deploy gates, monorepos, and validation examples.
- [UI performance](references/ui-performance.md) — read for Web Vitals, asset/CDN,
  framework, Amplify client, data, and Lambda/UI boundaries.
- [Review checklist](references/review-checklist.md) — read for a codebase audit.
- [Official sources](references/official-sources.md) — use when a current AWS or
  framework behavior, limit, or default matters.
