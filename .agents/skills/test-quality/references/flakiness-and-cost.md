# Flakiness and suite cost

## Check what actually ran

Confirm the intended tests were collected and executed against the expected
source/build. A success exit with zero selected cases, all skipped cases, or
stale artifacts does not verify the change. Keep the original failing assertion
and runner summary; distinguish product failures from setup, collection, and
environment problems.

## Diagnose intermittent failures with a small experiment

Reuse the failing case. Capture the input, runner/tool version, seed if relevant,
and failure output. Vary one suspected condition at a time within an explicit
repeat/time budget: order, worker count, shared data, clock, or external service.
A passing rerun without an identified cause leaves the issue unresolved.

Look for unfinished tasks, leaked mocks/timers/environment changes, reused ports
or files, missing cleanup, and fixtures with the wrong lifetime. Reuse expensive
setup while isolating mutable records. Parallelize independent work; serialize
tests that intentionally share mutable artifacts until that sharing is removed.
Do not impose whole-suite serialization to hide an unidentified race.

For async behavior, wait for the observable condition or coordinate with an
explicit barrier/controlled scheduler. Fake a clock only when it tests the actual
contract. Retry assertions that can legitimately converge; do not use sleeps,
longer timeouts, or test retries to conceal a reproducible defect. Preserve the
initial failure when retries recover, and gather traces only where useful.

Do not silently skip, loosen, quarantine, or delete a failing test to obtain green
output. Changes to a required gate need existing authority and an explicit
unresolved-risk record. Use the host's evidence area or local Arcwright run;
an external tracker update is a separate authorized action.

## Reduce cost without losing distinct checks

Measure which files, fixtures, or setup dominate the relevant run before changing
architecture. Prefer a focused file/name filter, reused fixtures, and small
table-driven cases for the same contract. Keep names that identify the failing
input. Check dependency-based selection when changed code can affect unchanged
test files; changed-file filters alone may miss those tests.

Remove or consolidate a test only after identifying the same behavior and
distinguishing assertion in the remaining checks. Slow tests can protect unique
contracts. Do not weaken an expectation to match new output without establishing
that the required behavior changed. Reserve whole-system tests for interactions
that cheaper tests cannot demonstrate, then run repository-required gates.

The [pytest flakiness guide](https://docs.pytest.org/en/stable/explanation/flaky.html)
documents common state, timing, and parallelism causes. Apply runner-specific
tools only when they address the observed problem; no new plugin is a default.
