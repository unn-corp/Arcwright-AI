# amplify-best-practices — Quick Rules

> Load full `SKILL.md` for planning, implementation, or review.

- Trigger for Amplify Gen 1/Gen 2, Amplify Hosting, `ampx`, `amplify.yml`,
  `amplify_outputs.json`, Amplify Functions/Data/Auth/Storage, or Amplify-dependent UI.
- Detect generation, hosting/pipeline topology, framework, package manager, monorepo
  root, branch/app mapping, and static/SSR/hybrid mode before recommending changes.
- Measure the real job first. Separate cache restore/create, install, backend deploy,
  frontend build, artifact, and upload time.
- Skip a no-op backend deploy only with a live-backend commit baseline and a fail-open
  guard. Never rely solely on `HEAD~1`; never skip when state or the diff is uncertain.
- Optimize cache file count and scope. Cache paths are repository-relative; do not cache
  backend-only dependency trees in frontend-only builds without evidence.
- Generate or validate `amplify_outputs.json` without a full backend deploy. Protect
  branch/environment freshness and do not treat a stale output as harmless.
- Prefer deterministic installs and exact runtime inputs; document any `npm ci` exception
  caused by Amplify bundled dependencies instead of applying it blindly.
- Keep `amplify/` loader boundaries intact; prove workspace refactors with local `ampx`,
  backend typecheck/tests, and the frontend build.
- For Functions, reuse clients outside handlers, minimize/lazy-load dependencies, bound
  work, parallelize safe independent I/O, and make retries idempotent.
- For UI, measure p75 LCP/INP/CLS, shrink initial JS, avoid waterfalls, optimize images/
  fonts/critical CSS, and use cache headers that match content freshness and privacy.
- Reviews are read-only and evidence-backed. Report severity, trade-offs, validation,
  rollback, unchanged behavior, and unknowns.
