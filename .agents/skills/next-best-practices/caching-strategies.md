# Caching Strategies

Next.js layers several caches on top of `fetch`. Picking the right `cache`/`next` option per call is what determines whether a page is static, ISR, or fully dynamic.

## Data Cache Options

```tsx
// No cache - always fresh, makes the request dynamic
fetch(url, { cache: 'no-store' })

// Cache forever - static, only refetched on redeploy
fetch(url, { cache: 'force-cache' })

// ISR - serve cached response, revalidate in the background after 60s
fetch(url, { next: { revalidate: 60 } })

// Tag-based - cached indefinitely until explicitly invalidated by tag
fetch(url, { next: { tags: ['products'] } })
```

| Option | Behavior | Use When |
|--------|----------|----------|
| `cache: 'no-store'` | Never cached, fetched every request | Data must always be current (auth checks, live prices) |
| `cache: 'force-cache'` | Cached indefinitely | Content that only changes on redeploy |
| `next: { revalidate: N }` | Time-based ISR | Data can be N seconds stale (product listings, blog indexes) |
| `next: { tags: [...] }` | Cached until invalidated by tag | Data changes on specific mutations, not on a timer |

`revalidate` and `tags` can be combined: a time-based ceiling plus the ability to invalidate early when a mutation happens.

## Invalidating Tag- and Path-Based Caches

Call these from a Server Action or Route Handler after a write, never from a Server Component render:

```tsx
'use server'
import { revalidateTag, revalidatePath } from 'next/cache'

export async function updateProduct(id: string, data: ProductData) {
  await db.product.update({ where: { id }, data })
  revalidateTag('products')     // invalidates every fetch tagged 'products'
  revalidatePath('/products')   // invalidates the cached render of this route
}
```

- `revalidateTag` targets data cache entries by tag, use it when many fetches across different routes share the same tag (e.g. `'products'` used on both a listing page and a search API)
- `revalidatePath` targets a specific route's rendered output, use it when only one route's cache needs to reflect the change

## Choosing Per Route vs Per Fetch

Route-level cache behavior (`export const revalidate = 60` or `export const dynamic = 'force-dynamic'` in a `page.tsx`/`layout.tsx`) sets a ceiling for the whole route. Per-`fetch` options can be more granular than the route default but can't exceed it, a route-level `force-dynamic` makes every fetch on that route effectively dynamic regardless of its own `cache` option.

Default to the narrowest scope that solves the problem: prefer per-fetch `next: { revalidate }` or `tags` over route-level `dynamic`/`revalidate` exports, so unrelated data on the same route can still be cached independently.
