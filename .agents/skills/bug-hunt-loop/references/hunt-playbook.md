# Hunt Playbook — techniques per lens and ecosystem

Use what the project already has installed. Adding a dev-only test dependency (e.g. a property-testing library) is acceptable when it materially strengthens a repro; note it in the commit. Wrap every long-running command in `timeout`.

## Universal attacks

| Attack | How |
| --- | --- |
| Repeat to expose flakes | Run the target test 50–500× (`for i in $(seq 200); do … || echo FAIL $i; done`), count failures |
| Shuffle order | Randomize test order to expose shared state / order dependence |
| Concurrency stress | N workers (≥ CPU count, try 2×) hammering the same object/endpoint/row for M iterations; assert invariants after (counts, uniqueness, balances) |
| Fault injection | Make the Nth call to I/O / DB / network / clock throw or hang; check rollback, cleanup, and no half-written state |
| Cancellation | Abort/cancel mid-operation (AbortController, context cancel, task.cancel, drop future); check locks released, state consistent |
| Boundary sweep | 0, 1, max, max+1, negative, empty, null/None/undefined, NaN, huge, unicode/emoji/RTL, whitespace-only, duplicate keys |
| Property testing | State invariants (round-trip, idempotency, ordering, conservation) and let the generator find counterexamples |
| Resource growth | Run an operation 10k× and watch handles/listeners/goroutines/memory; growth ⇒ leak |
| Time | Freeze/advance clocks, run across DST transitions and month/year ends, set TZ=Pacific/Apia / Asia/Kolkata, skew clocks between components |
| Slow dependencies | Add latency to I/O to widen race windows (do this in the test harness, never as the fix) |

## JavaScript / TypeScript (Node, Bun, Deno, browser)
- Vitest: `vitest run --sequence.shuffle --repeats 50 <file>`; `--pool=threads` vs `forks` to shake out global state. Jest: `--runInBand` vs parallel, `--randomize`.
- Property: `fast-check` (`fc.assert(fc.asyncProperty(...))`, `fc.scheduler()` for async interleavings — excellent for race repros).
- Races: `Promise.all` of the same mutation N times; missing `await`s (`@typescript-eslint/no-floating-promises`); shared module-level state across requests; event-listener leaks (`process.on('warning')` for MaxListeners).
- Typecheck strictly (`tsc --noEmit`) — `any`-laundered nulls are bug sources.
- Leaks: `node --expose-gc` + `process.memoryUsage()`, `--detect-open-handles` (Jest), `why-is-node-running`.

## Python
- `pytest -p randomly` (pytest-randomly), `pytest --count=200` (pytest-repeat), `pytest -x -n auto` (xdist) to surface shared state.
- Property: `hypothesis` (`@given`, `stateful.RuleBasedStateMachine` for state-transition bugs).
- Async races: `asyncio.gather` of the same coroutine N×; `PYTHONASYNCIODEBUG=1` / `asyncio.run(..., debug=True)` for unawaited coroutines and slow callbacks.
- Threads: `concurrent.futures.ThreadPoolExecutor` stress; `sys.setswitchinterval(1e-6)` to force frequent switches and widen race windows.
- `python -X dev -W error` to surface ResourceWarnings (unclosed files/sockets).

## Go
- `go test -race -count=100 ./pkg/...`, `-shuffle=on`, `-cpu=1,2,8`.
- `go test -fuzz=FuzzX -fuzztime=60s` for parsers/decoders.
- `goleak.VerifyNone(t)` for goroutine leaks; `GOTRACEBACK=all` on hangs; `-timeout` to catch deadlocks.

## Rust
- `cargo test` with `RUST_TEST_THREADS` variations; `cargo nextest run --retries 0` repeated.
- `loom` for lock-free / atomic code models; `cargo +nightly miri test` for UB; `RUSTFLAGS=-Zsanitizer=thread` (TSAN) / `address`.
- `proptest` / `quickcheck`; `cargo fuzz` for parsers.
- Tokio: `#[tokio::test(flavor = "multi_thread", worker_threads = 8)]` stress, `tokio::time::pause()` for timing, `tokio-console` for stuck tasks.

## JVM (Java / Kotlin)
- `jcstress` for memory-model races; JUnit `@RepeatedTest(500)` + `ExecutorService` stress.
- `jqwik` property tests; Kotlin coroutines: `runTest` + `StandardTestDispatcher` to control interleavings.
- Thread dumps (`jstack`) on hangs; `-XX:+HeapDumpOnOutOfMemoryError` for leaks.

## C / C++
- `-fsanitize=thread`, `-fsanitize=address,undefined`; `valgrind --tool=helgrind` / `drd`.
- libFuzzer / AFL++ on parsing entry points.

## Databases & persistence
- Two transactions racing the same row (lost update, write skew): run both under the default isolation level the app actually uses.
- Unique constraints vs. app-level "check then insert".
- Partial failure mid-batch: is the batch transactional? Is retry idempotent?
- Migrations: nullable assumptions, default values, large-table locks (log as Needs human).

## Web / API surfaces
- Concurrent identical requests (double-submit, double-charge, duplicate create) — idempotency keys honored?
- Pagination edges (last page, empty page, cursor after delete), sort stability.
- Auth: same request as another tenant/user; missing ownership checks on IDs (report generically if repo is public).
- Malformed JSON, wrong content-type, oversized bodies, slow-loris-style partial bodies (locally only).

## Frontend
- Rapid repeated clicks / submits; navigation during in-flight requests (stale response overwriting newer state); unmount before promise resolves (setState after unmount, leaked subscriptions).
- React: effects missing cleanup, stale closures, race between fetch responses (`AbortController` or request-id guards).
- Drive real interactions with Playwright for repros when unit tests can't reach the bug.

## Distinguishing a real race from a flaky test
1. Reproduce at a measurable rate under stress.
2. Explain the interleaving concretely (thread A at line X, thread B at line Y).
3. The fix must remove that interleaving (lock, atomic op, transaction, single-writer, idempotency key, compare-and-swap) — not hide it.
4. Post-fix: same stress at ≥ the failing iteration count → 0 failures, race detector clean.
