<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## UI and runtime performance

- Configure Amplify exactly once at the application entrypoint and keep auth state in
  one source of truth. Do not call `configure` or start competing refresh/listener
  loops from every component.
- Make the auth bootstrap a small state machine (`loading`, `authenticated`,
  `unauthenticated`, `error`) and render an intentional shell/skeleton. Avoid a
  blank screen, redirect loop, duplicate API call, or layout shift while the session
  is being resolved.
- Deduplicate concurrent `fetchAuthSession`/refresh operations. Cache only what is
  safe, bound retries, and distinguish expired-session recovery from a real 403 or
  network outage. Do not block public UI on an unnecessary profile/tenant waterfall;
  load non-critical data after the first usable render.
- Keep auth UI accessible and responsive: preserve focus through MFA/errors,
  announce validation, support keyboard/mobile flows, show progress and recovery,
  and avoid making a CAPTCHA, social-provider script, or large auth bundle block the
  whole application shell.
- Measure the production path: callback-to-first-render, p75 LCP/INP/CLS, JS
  transferred/parsed, auth API latency, trigger duration, refresh frequency, and
  error/retry rates. Optimize verified bottlenecks, not token lifetime or security
  controls by guesswork.
- Ensure public caching never serves authenticated or tenant-specific HTML/API
  responses to another user. Keep token-bearing requests out of cache keys/logs and
  coordinate cookie, CDN, API, and origin authorization semantics with the
  CloudFront/Amplify skills.
