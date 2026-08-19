# Amplify review checklist

Keep the review read-only. Mark absent evidence as unknown instead of assuming the
default Amplify behavior.

## Scope and topology

- [ ] Gen 1 or Gen 2 identified; legacy CLI and `ampx` commands are not mixed without
      an explicit migration boundary.
- [ ] Amplify Hosting, custom CI, or both identified.
- [ ] Framework, package manager, Node/CLI versions, monorepo app root, and branch/app
      mapping recorded.
- [ ] Static, SSR, ISR, hybrid, preview, and manual-release behavior recorded.
- [ ] Preserved contract lists auth, output freshness, deploy triggers, cache/privacy,
      function latency, and UI budgets.

## Build and deployment

- [ ] Job logs show phase timings for clone, cache restore/extract, install, backend
      deploy, frontend build, artifact, and cache create/upload.
- [ ] Cache paths are repository-relative and limited to files reused by the phase.
- [ ] File counts and cache invalidation behavior are measured; backend-only packages
      are not restored into a frontend-only build without a reason.
- [ ] Backend deploy gating compares against the known live backend commit and fails
      toward deploying when state, commit reachability, or diff is uncertain.
- [ ] Manual release, shallow clone, rollback, concurrent build, and failed deploy
      behavior are understood.
- [ ] `amplify_outputs.json` is generated/validated for the correct app and branch;
      stale or cross-environment outputs cannot silently pass.
- [ ] Install strategy, registry, lockfile, Node version, and live package updates are
      deterministic and reproducible.
- [ ] Monorepo `appRoot`, workspace dependencies, package boundaries, and shared code
      are validated from the same paths Amplify uses.
- [ ] `AMPLIFY_DIFF_DEPLOY`/root and auto-build frequency match the actual deploy unit.

## Backend/runtime

- [ ] Functions have measured init/duration/error/throttle baselines.
- [ ] SDK clients/connections are reused safely; request-specific state is not global.
- [ ] Bundles contain only needed production dependencies; rare paths can lazy-load.
- [ ] Timeouts, memory, concurrency, retries, downstream limits, and idempotency are
      explicit and tested.
- [ ] Data reads are bounded, paginated, authorized, and shaped for the caller.
- [ ] Secrets and environment values are not hard-coded or exposed to the browser.
- [ ] IAM is least privilege and branch/environment separation is preserved.

## UI/runtime path

- [ ] Production bundle and request waterfall are measured.
- [ ] LCP/INP/CLS targets and the critical route are explicit.
- [ ] Initial JS, images, fonts, and critical CSS are bounded; non-critical features
      split or defer.
- [ ] Amplify is configured once; data requests avoid unnecessary waterfalls and
      unbounded downloads.
- [ ] CDN/cache headers match asset mutability, SSR/personalization, authorization,
      and invalidation needs.
- [ ] Loading/error/empty/offline/retry states preserve responsiveness and accessibility.

## Validation and report

- [ ] Buildspec YAML and inline shell parse successfully.
- [ ] Backend loader/typecheck/tests and frontend build pass in scoped environments.
- [ ] Deploy-guard branches are simulated without spending an Amplify job.
- [ ] A follow-up warm/cold job and UI/runtime measurement are scheduled or attached.

Report:

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
