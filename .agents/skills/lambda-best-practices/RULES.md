# Lambda quick rules

- Identify account/Region/environment, handler/runtime/architecture, trigger delivery semantics, memory/timeout, concurrency, downstream limits, IAM, tenant boundary, R&D separation, and UI latency before changing code.
- Keep handlers stateless and focused; durable state belongs in durable services. Initialize reusable SDK clients/connections outside the handler, but never treat global memory or `/tmp` as a correctness store.
- Measure `Init Duration`, p50/p95/p99, memory, cold-start share, concurrency/throttles, queue/iterator age, retries/DLQ, and downstream saturation before tuning memory, package, VPC, or provisioned concurrency.
- Validate events and make retriable side effects idempotent with a durable key/conditional write. Event source mappings and async paths can duplicate work; timeout does not prove no side effect happened.
- Bound timeouts, retries, backoff/jitter, batch size, visibility, concurrency, and downstream calls. Use partial batch response and poison-record/DLQ recovery where supported.
- Use least-privilege roles, resource-scoped invoke policies, managed secrets, redacted logs, and server-side tenant/membership authorization. Public URLs and client-selected resource ARNs are high risk.
- Use reserved concurrency/backpressure to protect dependencies and provisioned concurrency only for measured latency needs; test database/API quotas and noisy neighbors.
- Deploy immutable versions behind aliases with canary/rollback; inspect generated IaC for event-source enablement, permission widening, secret/VPC drift, and cross-environment references.
- For UI/API paths, avoid serial/N+1 invokes and represent asynchronous work as accepted/pending/failed with useful recovery; measure p75/p95/p99 and Web Vitals.
- R&D uses separate accounts/resources/roles/secrets/events and synthetic or approved masked data; never replay production events or copy credentials.
- Reviews are read-only. Never invoke production functions, replay events, redrive DLQs, publish versions, shift aliases, or mutate IAM/concurrency without explicit authorization.
