# Suspense Boundaries

Client hooks that cause CSR bailout without Suspense boundaries.

## useSearchParams

Always requires Suspense boundary in static routes. Without it, the entire page becomes client-side rendered.

```tsx
// Bad: Entire page becomes CSR
'use client'

import { useSearchParams } from 'next/navigation'

export default function SearchBar() {
  const searchParams = useSearchParams()
  return <div>Query: {searchParams.get('q')}</div>
}
```

```tsx
// Good: Wrap in Suspense
import { Suspense } from 'react'
import SearchBar from './search-bar'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchBar />
    </Suspense>
  )
}
```

## usePathname

Requires Suspense boundary when route has dynamic parameters.

```tsx
// In dynamic route [slug]
// Bad: No Suspense
'use client'
import { usePathname } from 'next/navigation'

export function Breadcrumb() {
  const pathname = usePathname()
  return <nav>{pathname}</nav>
}
```

```tsx
// Good: Wrap in Suspense
<Suspense fallback={<BreadcrumbSkeleton />}>
  <Breadcrumb />
</Suspense>
```

If you use `generateStaticParams`, Suspense is optional.

## Streaming Pattern (Progressive Rendering)

Beyond the CSR-bailout requirement above, Suspense boundaries are also how you opt individual sections of a page into streaming: content outside a boundary blocks the initial response, content inside streams in as its own data resolves.

```tsx
// app/product/[id]/page.tsx
import { Suspense } from 'react'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // This data loads first (blocking) - needed for the immediate render
  const product = await getProduct(id)

  return (
    <div>
      {/* Immediate render */}
      <ProductHeader product={product} />

      {/* Stream in reviews independently */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews productId={id} />
      </Suspense>

      {/* Stream in recommendations independently */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <Recommendations productId={id} />
      </Suspense>
    </div>
  )
}

// Each streamed section fetches its own data - no shared waterfall
async function Reviews({ productId }: { productId: string }) {
  const reviews = await getReviews(productId) // Slow API
  return <ReviewList reviews={reviews} />
}

async function Recommendations({ productId }: { productId: string }) {
  const products = await getRecommendations(productId) // ML-based, slow
  return <ProductCarousel products={products} />
}
```

Multiple sibling Suspense boundaries resolve independently and out of order: a slow `Recommendations` fetch doesn't hold up `Reviews` from appearing first. Put only the data that's truly required for the first paint above the boundaries; push everything else inside one so it can stream.

## Quick Reference

| Hook | Suspense Required |
|------|-------------------|
| `useSearchParams()` | Yes |
| `usePathname()` | Yes (dynamic routes) |
| `useParams()` | No |
| `useRouter()` | No |
