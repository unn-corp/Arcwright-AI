# 18. Error & Exception Handling — Fail Closed (OWASP A10:2025)
**Maps to:** `references/error-handling.md`, `references/business-logic.md`, `references/logging.md`

**Principle:** **Mishandling of Exceptional Conditions** is new in the OWASP Top 10:2025
(A10). When something goes wrong — an exception, timeout, null, partial failure, exhausted
resource — the system must **fail closed**: deny access, roll back, clean up, and neither
leak nor corrupt state. The dangerous default is *fail open*: an error in a security check
that lets the request through.

> Pairs with topic 8 (don't *disclose* error detail) and topic 12 (do *log* the event). This
> topic is about the **control-flow behavior** under failure, not the message or the log line.

**Detect:** `try`/`catch`/`except`/`rescue`, error middleware, the error paths of auth/authz
and payment/transaction code, resource cleanup (`finally`/`defer`/`with`/context managers),
promise rejection / goroutine panic handling.

**Run:**
```bash
# Swallowed exceptions (errors silently dropped)
grep -rniE "except\s*:\s*pass|except [A-Za-z.]+\s*:\s*pass|catch\s*\([^)]*\)\s*\{\s*\}|catch\s*\{\s*\}|rescue\s*=>?\s*nil|_\s*=\s*recover\(\)|catch\s*\(.*\)\s*\{\s*//" --include=*.{py,js,ts,jsx,tsx,rb,go,java} .
# Security checks wrapped in try/catch (potential fail-open — inspect each)
grep -rniE "try|catch|except" --include=*.{js,ts,py,go,java} . | grep -iE "auth|permission|authoriz|verify|valid|can_|is_admin|require" | head -40
# Cleanup / transaction safety on the error path
grep -rniE "finally|defer |\.rollback|with .* as |contextmanager|try-with-resources|ensure\b" --include=*.{js,ts,py,go,java,rb} . | head -30
```

**What good looks like:**
- **Fail closed on security paths.** If an auth/authz/validation check throws, the outcome is
  **deny**, not proceed. Unknown/unexpected states hit a default branch that rejects.
- **No swallowed exceptions.** Errors are handled *and* surfaced (logged per topic 12) — no
  empty `catch {}`, `except: pass`, or `rescue => nil` hiding failures. Catching is narrow
  (specific exception types), not a blanket catch-all that masks bugs.
- **Resource safety under failure.** DB transactions **roll back** on error; connections,
  files, and locks are released in `finally`/`defer`/context managers; no leak on the error path.
- **Partial-failure handling.** External-call failures (timeouts, 5xx) are handled with
  bounded retries/backoff and idempotency — not assumed to succeed. No "happy-path-only" code.
- **Consistent state.** An error mid-operation doesn't leave half-written data, a charged
  card with no order, or a half-granted permission.
- Generic client-facing error + correlation ID (topic 8); full detail server-side only.

**Red flags:**
| Pattern | Severity |
|---------|----------|
| Auth/authz/validation check that **proceeds on exception** (fail-open) | **Critical/High** |
| Empty `catch {}` / `except: pass` / `rescue => nil` swallowing a security or data error | **Medium** (High on a security path) |
| Error handler that returns `200`/success (or a default "allow") on failure | **High** |
| No transaction rollback / resource release on the error path → leak or inconsistent state | **Medium** |
| Unhandled promise rejection / unrecovered panic leaving inconsistent state or crashing | **Medium** |
| Blanket `catch (Exception)` masking distinct failures (incl. security exceptions) | **Low/Medium** |

**Verdict guidance:**
- ✅ **Pass** — security checks fail closed, exceptions handled narrowly and surfaced, error
  paths roll back and release resources, partial failures handled.
- ⚠️ **Weak** — mostly sound but some swallowed non-critical exceptions or missing cleanup
  on a few paths.
- ❌ **Fail** — any fail-open security check, success returned on failure, or swallowed
  exceptions on auth/payment/data-integrity paths.

This is reasoning-heavy — pattern matching finds candidates, but confirming *fail-open*
requires tracing what happens after the `catch`. Report findings as `SCAN-NN` with `file:line`.
