# Lambda performance and concurrency

## Measure first

Use a representative warm/cold load test and compare `Init Duration`, handler
duration, p50/p95/p99, memory use, error/throttle rate, concurrency, downstream
latency, and cost per successful operation. A shorter average can hide a worse tail,
more retries, or a saturated database.

## Initialization

Put SDK clients, immutable configuration, parsers, and safe connection pools outside
the handler so reused execution environments can amortize setup. Keep static
initialization small: bundle only required modules, tree-shake, remove unused
extensions/layers, and avoid network calls during import unless their failure contract
is explicit. Do not put request, tenant, token, or event data in global variables.

## Capacity

Model concurrent executions against the downstream connection/API budget. Reserved
concurrency protects a function and caps its impact; event-source maximum concurrency
and batch controls add backpressure. Provisioned concurrency improves cold-start
latency for measured steady/interactive traffic but adds cost. Memory changes CPU and
network capacity, so tune it with a cost/latency curve. A VPC can be required for a
private dependency, but its subnet, NAT, DNS, endpoint, and database path must be
measured.

## Queue and stream workers

Use partial batch response where supported, preserve ordering where required, and
separate poison records. SQS visibility must exceed the function's worst-case retry
window and downstream operation; monitor oldest-message age and DLQ. For streams,
monitor iterator age, checkpointing, shard/partition parallelism, and duplicate
processing. Do not turn `Promise.all` into unbounded downstream concurrency.

Official references:

- [Lambda best practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Execution environment lifecycle](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtime-environment.html)
- [Concurrency](https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html)
- [Event source mappings](https://docs.aws.amazon.com/lambda/latest/dg/invocation-eventsourcemapping.html)
