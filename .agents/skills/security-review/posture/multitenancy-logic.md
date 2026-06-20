# 19. Multi-Tenancy Isolation & Business Logic
**Maps to:** `references/authorization.md`, `references/business-logic.md`

**Principle:** two failure classes that automated scanners and even careful reviewers miss
because the code "works" functionally — it's just exploitable:

- **Tenant/data isolation** — in a multi-tenant app, does *every* data access scope to the
  current tenant/owner? The #1 SaaS breach is a query that returns another customer's data.
- **Business-logic flaws** — the operation is implemented correctly but the *rules* can be
  bypassed: race conditions, missing idempotency, price/quantity tampering, workflow skips.

**Detect:** ORM queries, repository/data-access layers, payment/checkout/order code, anything
touching money, inventory, credits, or quotas; multi-step workflows; concurrent updates.

**Run:**
```bash
# Queries that may be missing a tenant/owner scope — inspect each
grep -rniE "\.(find|findOne|findById|get|filter|where|query|select)\(" --include=*.{js,ts,py,go,java} . | grep -viE "tenant|org|owner|user_id|account|company|consignor|where.*=.*(req|ctx|session)" | head -50
# Money / inventory / quantity flows (business-logic hotspots)
grep -rniE "price|amount|total|quantity|qty|balance|credit|refund|discount|coupon|stock|inventory" --include=*.{js,ts,py,go} . | head -40
# Concurrency / idempotency signals
grep -rniE "transaction|SELECT .* FOR UPDATE|lock|idempotenc|mutex|optimistic|version|begin\(\)" --include=*.{js,ts,py,go,sql} . | head -30
```

## Tenant / data isolation
**What good looks like:**
- **Every** read and write is constrained by the tenant/owner key (`WHERE tenant_id = :current`),
  derived **server-side from the session**, never from a client-supplied tenant/id field.
- Isolation is enforced **centrally** — a base query scope, row-level security (Postgres RLS),
  or a repository layer that *cannot* be bypassed — not re-implemented per handler (one miss = leak).
- Cross-tenant references (shared lookups) are explicitly allow-listed; admin/cross-tenant
  access is a separate, audited path.
- Object IDs are non-guessable (UUID) **and** still authorization-checked (defense-in-depth; ties to topic 1 IDOR).

**Red flags:**
| Pattern | Severity |
|---------|----------|
| Query fetches by id with no tenant/owner scope (`findById(req.params.id)`) → cross-tenant read | **Critical/High** |
| Tenant id taken from request body/query/header instead of the session | **Critical** |
| Isolation enforced ad-hoc per route (some routes scoped, siblings not) | **High** |
| Bulk/list/export endpoints not tenant-scoped | **High** |

## Business logic & race conditions
**What good looks like:**
- **Server-side recompute** of price/total/discount from trusted data — never trust client-sent
  amounts; validate quantities are positive and within bounds.
- **Idempotency** on payment/order/credit operations (idempotency key, unique constraint) so a
  retry or double-submit can't double-charge or double-grant.
- **Atomic** money/inventory mutations — DB transaction + row lock (`SELECT … FOR UPDATE`) or an
  atomic decrement — to prevent **TOCTOU** races (two concurrent requests both passing a
  "balance ≥ amount" check). No check-then-act gaps on shared state.
- Multi-step workflows enforce **state/order** server-side (can't skip payment, can't re-use a
  one-time token/coupon, can't replay a completed step).

**Red flags:**
| Pattern | Severity |
|---------|----------|
| Price/total/amount taken from the client request and trusted | **High** |
| Balance/stock checked then mutated without a transaction+lock (race → oversell/overspend) | **High** |
| No idempotency on payment/order creation → double-charge on retry | **High** |
| Coupon/credit/one-time token reusable (no atomic consume) | **Medium/High** |
| Workflow step reachable out of order (skip-payment, replay) | **High** |

**Verdict guidance:**
- ✅ **Pass** — central, server-derived tenant scoping on all access; money/inventory ops are
  atomic and idempotent; amounts recomputed server-side.
- ⚠️ **Weak** — isolation mostly central but a few ad-hoc queries; idempotency on some but not
  all sensitive ops.
- ❌ **Fail** — any unscoped cross-tenant query, client-trusted tenant id, client-trusted price,
  or a race on money/inventory.

Reasoning-heavy — grep surfaces candidates; confirming a leak/race needs tracing the data flow.
Report findings as `SCAN-NN` with `file:line`.
