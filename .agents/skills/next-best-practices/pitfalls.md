# Pitfalls

Quick do's and don'ts. Each links to the sub-file with the full pattern.

## Do

- **Start with Server Components.** Add `'use client'` only on the interactive leaf that needs it (see [client-components.md](./client-components.md)).
- **Colocate data fetching.** Fetch data in the component that renders it, not in a parent that passes it down through several layers (see [data-patterns.md](./data-patterns.md)).
- **Use Suspense boundaries to enable streaming.** Wrap slow, non-critical sections so they don't block the initial response (see [suspense-boundaries.md](./suspense-boundaries.md)).
- **Reach for parallel routes for independent panels**, not just modals (see [parallel-routes.md](./parallel-routes.md)).
- **Use Server Actions for mutations triggered from your UI**, they get progressive enhancement for free (see [server-actions.md](./server-actions.md)).

## Don't

- **Don't pass non-serializable data across the Server to Client boundary** (functions, `Date`, `Map`/`Set`, class instances). See [rsc-boundaries.md](./rsc-boundaries.md) for the full detection list.
- **Don't use React hooks in Server Components.** No `useState`, `useEffect`, `useTransition`, they only work in Client Components.
- **Don't fetch client-side when a Server Component or Server Action would do.** Reach for client-side `useEffect` fetching only when the data genuinely depends on client-only state (see [data-patterns.md](./data-patterns.md)).
- **Don't over-nest layouts.** Every `layout.tsx` in the chain adds a persistent wrapper around its children, each one is a cost paid on every navigation within it.
- **Don't ignore loading states.** Every route segment (and every parallel-route slot) should have a `loading.tsx` or an explicit Suspense boundary, silent blank-screen waits are a bug, not a default.
