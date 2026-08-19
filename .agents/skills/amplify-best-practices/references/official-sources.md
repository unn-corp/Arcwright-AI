# Amplify best-practices sources

Use these primary sources to verify behavior that may change. Read the relevant page
for the framework and generation in scope instead of treating this list as a static
manual.

## AWS Amplify and Hosting

- [Amplify build specification reference](https://docs.aws.amazon.com/amplify/latest/userguide/yml-specification-syntax.html)
  — relative cache paths, phases, app roots, artifacts, and buildspec shape.
- [Editing the Amplify build settings](https://docs.aws.amazon.com/amplify/latest/userguide/edit-build-settings.html)
  — `envCache`, diff-based frontend deploys, `[skip-cd]`, and auto-build controls.
- [Troubleshooting Amplify caching](https://docs.aws.amazon.com/amplify/latest/userguide/troubleshooting-caching.html)
  — reducing cache size and excluding paths with `!`.
- [Managing Amplify Hosting cache configuration](https://docs.aws.amazon.com/amplify/latest/userguide/caching.html)
  — CloudFront-managed behavior, cache precedence, and static/compute defaults.
- [Cache-Control performance guidance](https://docs.aws.amazon.com/amplify/latest/userguide/Using-headers-to-control-cache-duration.html)
  — `max-age`, `s-maxage`, and custom header trade-offs.
- [Amplify Gen 2 custom pipelines](https://docs.amplify.aws/react/deploy-and-host/fullstack-branching/custom-pipelines/)
  — `pipeline-deploy` versus `generate outputs` in a custom CI topology.
- [Amplify Gen 2 monorepos](https://docs.amplify.aws/react/deploy-and-host/fullstack-branching/monorepos/)
  — shared backend workspaces and separate frontend/backend deployments.
- [Amplify outputs](https://docs.amplify.aws/react/reference/amplify_outputs/)
  — what `amplify_outputs.json` represents and how it is generated.
- [Amplify Gen 2 Functions setup](https://docs.amplify.aws/react/build-a-backend/functions/set-up-function/)
  — function resource/handler boundaries.
- [Amplify Gen 2 Function configuration](https://docs.amplify.aws/react/build-a-backend/functions/configure-functions/)
  — runtime, timeout, memory, and storage configuration.

## AWS runtime guidance

- [AWS Lambda best practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
  — execution-environment reuse, clients outside handlers, idempotency, and scaling.
- [Lambda execution environment and initialization](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html)
  — cold starts, static initialization, package size, and lazy loading.

## Frontend performance guidance

- [Web Vitals](https://web.dev/articles/vitals) — LCP, INP, CLS, p75 targets, and field
  versus lab measurement.
- [React `lazy`](https://react.dev/reference/react/lazy),
  [`memo`](https://react.dev/reference/react/memo), and
  [`useTransition`](https://react.dev/reference/react/useTransition) — defer code and
  non-urgent work; profile before memoizing.
- [Vite performance](https://vite.dev/guide/performance) and
  [production builds](https://vite.dev/guide/build) — import graphs, barrel files,
  profiling, and chunking.
