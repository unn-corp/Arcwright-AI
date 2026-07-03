# Client Components

Patterns for the `'use client'` boundary itself. For the underlying directive rules (what requires `'use client'`, how it differs from `'use server'`), see [directives.md](./directives.md). For invalid boundary-crossing patterns, see [rsc-boundaries.md](./rsc-boundaries.md).

## Interactive Component Calling a Server Action

A Client Component that triggers a mutation should use `useTransition` to track pending state and surface errors, rather than a raw `async` `onClick` handler with no loading feedback.

```tsx
// components/products/AddToCartButton.tsx
'use client'

import { useState, useTransition } from 'react'
import { addToCart } from '@/app/actions/cart'

export function AddToCartButton({ productId }: { productId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleClick = () => {
    setError(null)
    startTransition(async () => {
      const result = await addToCart(productId)
      if (result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div>
      <button onClick={handleClick} disabled={isPending} className="btn-primary">
        {isPending ? 'Adding...' : 'Add to Cart'}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  )
}
```

Why `useTransition` over a plain `async` handler:
- `isPending` gives you a loading state without a separate `useState` toggle you have to remember to reset in a `finally` block
- The transition keeps the UI responsive; React can interrupt it for higher-priority updates
- Calling a Server Action (`addToCart`) from inside `startTransition` is the supported pattern for non-form-triggered mutations (button clicks, drag handlers), where `<form action={...}>` doesn't apply

## Keep the Client Boundary as Low as Possible

Only the interactive leaf needs `'use client'`. Don't push the directive up to a page or layout just because one child needs interactivity.

```tsx
// Bad: entire page becomes a Client Component
'use client'
export default function ProductPage({ product }) {
  return (
    <div>
      <ProductHeader product={product} />
      <AddToCartButton productId={product.id} />
    </div>
  )
}

// Good: only the interactive leaf is a Client Component
// page.tsx stays a Server Component
export default async function ProductPage({ params }) {
  const { id } = await params
  const product = await getProduct(id)
  return (
    <div>
      <ProductHeader product={product} />
      <AddToCartButton productId={product.id} />
    </div>
  )
}
```

Pushing `'use client'` up unnecessarily pulls the whole subtree into the client bundle and loses server-side data fetching for every sibling of the component that actually needed interactivity.
