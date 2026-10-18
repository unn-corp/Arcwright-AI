# Step Functions quick rules

- Scope account/Region/environment, version/type, start/idempotency, ASL data/task contracts, deadlines, downstream capacity, IAM/tenant boundary and completion UX.
- Choose Standard/Express from current guarantees and integration/recovery needs. Distinguish synchronous/asynchronous Express; no workflow type substitutes for business-effect idempotency.
- Prefer direct integrations for simple calls. Bound state data; pass large artifacts through authorized, encrypted/versioned references.
- Use typed errors, bounded transient retries, explicit deadlines, permanent-failure handling and compensation/reconciliation. Timeout does not prove effects stopped.
- Bound Map/Parallel work from real downstream/per-tenant capacity; configure failure thresholds and recovery.
- Protect callback tokens as expiring bearer secrets bound to task/execution/tenant; authenticate callbacks and handle duplicates/late responses.
- Authorize at start and sensitive task/data boundaries; state fields are not permission. Keep R&D resources/tokens/data separate and logs redacted.
- Start acceptance is pending, not complete. Use bounded authorized status and recovery UX.
- Validate affected ASL/contracts/IaC, select focused synthetic cases, preserve required gates and state unrun checks.
- Reviews do not authorize production starts/stops/replay/redrive or definition/IAM/log mutations.
