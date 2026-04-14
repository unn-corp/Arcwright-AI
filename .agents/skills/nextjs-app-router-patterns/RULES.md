# Next.js App Router Patterns — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Default to Server Components; only add `'use client'` when interactivity, hooks, or browser APIs are required
- Fetch data inside the component that needs it — do not prop-drill data from parent server components
- Wrap slow or independent data sources in `<Suspense>` with a fallback to enable streaming
- Use `loading.tsx` or `<Suspense>` for every data-fetching route — never leave loading states unhandled
- `params` and `searchParams` are now Promises in Next.js 14+ — always `await` them
- Use Server Actions (`"use server"`) for mutations; call `revalidateTag` or `revalidatePath` after writes
- Tag fetch calls with `{ next: { tags: [...] } }` to enable targeted cache invalidation
- For pagination, use cursor-based patterns — never `OFFSET` on large datasets
- Use parallel routes (`@slot`) for independent loading states in the same layout
- Use intercepting routes (`(.)`) for modal overlays that also work as full pages on direct navigation
- `generateMetadata` must `await params` just like the page component
- Use `generateStaticParams` to pre-render dynamic routes at build time

## Red Flags (stop and apply skill)
- `useState` or `useEffect` in a file without `'use client'`
- Fetching data in a Client Component instead of a Server Component
- Missing `<Suspense>` around a slow async server component
- Using `params.id` without `await` in Next.js 14+
- `OFFSET`-based pagination on a table that may grow large
