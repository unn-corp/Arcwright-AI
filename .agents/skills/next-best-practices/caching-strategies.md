# Caching strategies

Read [version-matched-docs.md](./version-matched-docs.md) first. Caching is a freshness decision: check the installed version and whether `cacheComponents` is enabled.

## Fetch and route caches without Cache Components

```tsx
fetch(url, { cache: 'no-store' })                        // request fresh data
fetch(url, { cache: 'force-cache' })                     // opt into caching
fetch(url, { next: { revalidate: 60, tags: ['posts'] } })  // timed and tagged cache
```

Tags identify cached entries; adding `next.tags` alone is not a universal promise that an otherwise uncached request becomes cached. Route defaults, dynamic APIs and installed Next.js behavior also matter. Use explicit cache intent, then verify build/runtime behavior. Route-level `dynamic` and `revalidate` exports apply only in configurations that support them.

## Cache Components

With supported `cacheComponents: true`, use `'use cache'`, `cacheLife` and `cacheTag` for cacheable work. Keep request-bound APIs outside a shared cache scope and pass suitable serializable inputs. Read installed directive docs for private/remote caching and prerender constraints; do not copy route-segment cache exports into this mode.

## Invalidate after a mutation

For current Next.js, choose the intended consistency:

| Need | API |
|---|---|
| Read your own write immediately in a Server Action | `updateTag('posts')` |
| Serve stale data while refreshing | `revalidateTag('posts', 'max')` |
| Immediate expiration from a Route Handler/webhook | `revalidateTag('posts', { expire: 0 })` |
| Invalidate a route's cached render | `revalidatePath('/posts')` |

```tsx
'use server'
import { updateTag, revalidatePath } from 'next/cache'

export async function updateProduct(id: string, data: ProductData) {
  await authorizeProductWrite(id)
  await db.product.update({ where: { id }, data })
  updateTag('products')
  revalidatePath('/products')
}
```

Single-argument `revalidateTag(tag)` is deprecated in current Next.js; older applications may have that contract and may lack `updateTag`. Follow their matching docs rather than introducing unsupported imports. Tags and paths affect different caches; invalidate the narrow scope reflecting the actual write.

Sources: [revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag), [updateTag](https://nextjs.org/docs/app/api-reference/functions/updateTag), [use cache](https://nextjs.org/docs/app/api-reference/directives/use-cache).
