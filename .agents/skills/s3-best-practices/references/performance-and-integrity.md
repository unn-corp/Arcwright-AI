# S3 performance and integrity playbook

## Request path

1. Identify object sizes, read/write/list patterns, latency target, concurrency,
   retry behavior, and whether the operation is user-facing or batch.
2. Reuse SDK clients, bound concurrency, paginate lists, and avoid serial HEAD/GET
   work when the workflow can carry metadata.
3. Use multipart uploads with checksums, resumable part state, bounded parallelism,
   explicit completion, and abort cleanup for large objects.
4. Use `If-None-Match: *` or `If-Match` when multiple writers require a condition;
   handle conflict responses and add application idempotency.
5. Measure request latency, `503 Slow Down`, retries, throughput, KMS requests,
   event lag, and cost before tuning concurrency or storage class.

## Key and list design

Use stable URL-safe logical prefixes for tenant/data class/time or lifecycle
ownership. Use `ListObjectsV2` continuation tokens and bounded pages. A full-bucket
scan belongs in Inventory, a catalog, or a batch workflow, not an HTTP request.

Do not turn historical per-prefix request guidance into an SLO. Benchmark the
workload and scale concurrency gradually with backoff.

## Integrity and consistency prompts

- Is the checksum validated by the SDK/service and retained for the workflow?
- Is a multipart final ETag being incorrectly treated as an MD5?
- Is strong consistency being confused with transactions or conflict resolution?
- Are retries safe for the operation and notification consumer?
- Are partial uploads, cancellation, and duplicate events observable and recoverable?
