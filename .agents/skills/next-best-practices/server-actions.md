# Server Actions

Server Action mutation patterns beyond the basics. For the core decision (Server Action vs Route Handler vs Server Component fetch) and the simple create/delete example, see [data-patterns.md](./data-patterns.md).

## Auth Check, Try/Catch, and Cache Invalidation Together

A realistic mutation reads session state, guards against unauthenticated calls, wraps the write in `try/catch` to return a serializable error instead of throwing, and invalidates the right cache tag on success.

```tsx
// app/actions/cart.ts
'use server'

import { updateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function addToCart(productId: string) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get('session')?.value

  if (!sessionId) {
    redirect('/login')
  }

  try {
    await db.cart.upsert({
      where: { sessionId_productId: { sessionId, productId } },
      update: { quantity: { increment: 1 } },
      create: { sessionId, productId, quantity: 1 },
    })

    updateTag('cart')
    return { success: true }
  } catch (error) {
    return { error: 'Failed to add item to cart' }
  }
}
```

`redirect()` inside a Server Action throws internally (Next.js catches it to perform the redirect), so it must not be wrapped in its own `try/catch` here, it needs to run before the `try` block, or use `unstable_rethrow` if a catch is unavoidable around it (see [error-handling.md](./error-handling.md)).

Returning `{ success: true }` / `{ error: string }` instead of throwing lets the calling Client Component branch on the result without needing an error boundary, pair this with the `useTransition` pattern in [client-components.md](./client-components.md).

## FormData Validation and Redirect-on-Success

For a traditional `<form action={...}>` submission (progressive enhancement, works without JS), read fields off `FormData`, validate, then `redirect()` to a confirmation route on success.

```tsx
// app/actions/checkout.ts
'use server'

import { redirect } from 'next/navigation'

export async function checkout(formData: FormData) {
  const address = formData.get('address') as string
  const payment = formData.get('payment') as string

  if (!address || !payment) {
    return { error: 'Missing required fields' }
  }

  const order = await processOrder({ address, payment })

  redirect(`/orders/${order.id}/confirmation`)
}
```

```tsx
// app/checkout/page.tsx
import { checkout } from '@/app/actions/checkout'

export default function CheckoutPage() {
  return (
    <form action={checkout}>
      <input name="address" required />
      <input name="payment" required />
      <button type="submit">Place Order</button>
    </form>
  )
}
```

This form works even with JavaScript disabled: the browser does a normal POST, Next.js runs the action on the server, and the `redirect()` becomes a normal server-side redirect response.

For older Next.js versions without `updateTag`, use the installed invalidation contract. See [caching-strategies.md](./caching-strategies.md).
