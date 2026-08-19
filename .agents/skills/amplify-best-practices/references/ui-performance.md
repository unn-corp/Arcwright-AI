# Amplify UI and runtime performance

Use this reference for a frontend review or when a faster Amplify build still leaves a
slow application. Optimize the critical user journey, not a synthetic score in
isolation.

## Measurement contract

Set a small budget per critical route and measure a production build on representative
mobile and desktop conditions:

- field data at the 75th percentile for LCP, INP, and CLS;
- lab data for LCP/CLS and a responsiveness proxy such as total blocking time;
- JavaScript and CSS transfer/parse/execute cost, request waterfalls, image/font cost,
  and backend/API timing; and
- Lambda initialization, duration, error, throttling, and downstream latency when a
  request crosses an Amplify Function.

Keep a before/after trace for the same route and device profile. Do not call a UI
optimization successful because the bundle is smaller if LCP, interaction latency,
errors, or accessibility regressed.

## Amplify client and data path

- Load `amplify_outputs.json` once from the application entrypoint at the earliest safe
  point. Do not configure Amplify during every render or fetch backend outputs from the
  browser on each route.
- Use the narrowest supported client/category imports and verify the result in the
  bundle report. Keep the root `Amplify.configure(outputs)` call where the framework
  expects it, then import individual capabilities from their documented modules.
- Start independent requests in parallel, avoid serial auth → data → related-data
  waterfalls when the dependencies are not real, and render a useful shell while
  non-critical data loads.
- Design Data access around bounded queries, indexes/access patterns, selection sets
  where supported, pagination, and an explicit freshness policy. A client-side filter
  over an unbounded list is not a performance strategy.
- Cache only public or user-scoped data with a key and invalidation policy that match
  its authorization and freshness requirements. Never place personalized data behind a
  shared CDN cache.
- Treat realtime subscriptions, optimistic updates, retries, and offline queues as
  concurrency features. Bound reconnection work and verify that duplicate events or
  retries do not create extra writes or UI churn.

## Initial JavaScript and rendering

- Split by route and by interaction boundary. Lazy-load editors, charts, admin tools,
  modals, and other features that are not needed for the first viewport.
- Avoid barrel imports when they force the bundler to load and transform unrelated
  modules. Prefer direct imports and confirm tree-shaking with a bundle analyzer.
- Keep above-the-fold HTML/CSS and the LCP resource discoverable. Defer analytics,
  chat, maps, rich editors, and other non-critical third-party code until the user or
  browser needs them.
- Choose static generation, SSR, or hybrid rendering per route based on data
  freshness, personalization, TTFB, cacheability, and operational cost. Do not make
  the whole app client-rendered solely to avoid thinking about the split.
- For React, preserve pure rendering and local state first. Use `memo`, `useMemo`, and
  `useCallback` only after profiling identifies expensive repeated work. Use lazy
  components with a `Suspense` boundary and transitions/deferred values for expensive
  non-urgent updates; do not hide slow data fetching behind an infinite spinner.

## Assets and Amplify Hosting cache

- Resize/compress images to their rendered dimensions, use modern formats where the
  browser matrix permits, reserve layout space, and preload only the actual LCP asset.
  Use Amplify image optimization when the framework/deployment contract supports it,
  and set its TTL deliberately.
- Self-host or subset fonts, preload only critical fonts, use `font-display`, and
  avoid a font request waterfall that delays the LCP text.
- Let hashed static assets use long-lived immutable caching. Keep HTML, manifests,
  mutable API responses, and personalized/SSR responses revalidated or uncached as
  appropriate. Amplify/CloudFront respects `Cache-Control`, but a custom header can
  override framework behavior, so review precedence before changing it.
- When deploying a new version, ensure stale HTML cannot reference deleted dynamic
  chunks. A no-cache/revalidation policy for HTML plus content-hashed assets is safer
  than applying a year-long TTL to every path.

## Amplify Functions in the critical path

Amplify Functions are Lambda functions. Keep the handler small and the package
focused:

- initialize SDK clients and safe reusable connections outside the handler;
- import only required services/modules, lazy-load rare branches, and avoid shipping
  build/test tooling in the function bundle;
- set memory and timeout from a measured latency/cost target; more memory can buy CPU,
  but validate downstream rate limits and spend;
- run safe independent I/O concurrently, bound payloads, and return only what the UI
  needs; and
- use idempotency keys/conditions for retried writes and log correlation IDs without
  logging tokens or private data.

If the path is data-model-bound, load `dynamodb-best-practices`; if it is primarily
React or responsive layout work, load the matching frontend skill as well.

## UI review questions

1. What is the LCP element on the critical route, and what blocks it?
2. Which JavaScript is needed before the first interaction, and which can be deferred?
3. Are requests parallel where possible, bounded, paginated, and authorized at the
   backend rather than filtered after download?
4. Which data is safe to cache, for how long, and under what key/invalidation rule?
5. Are loading, error, empty, offline, retry, and stale states stable and accessible?
6. What production trace proves the change improved LCP/INP/CLS or user task time?
