# Generated cases and counterexamples

Use a property when the contract promises a relationship across many inputs and
that relationship replaces a substantial example matrix. Ordinary examples are
often enough for a small branch or one regression. Reuse an installed property
library; a new dependency or production refactor needs a concrete payoff.

## Choose a discriminating property

State the promised relationship and a plausible broken implementation it rejects.
Derive the oracle independently from the contract, a small independent model, or
trusted examples. Copying the production algorithm gives false reassurance.

| Relationship | Useful additional check |
| --- | --- |
| Encode then decode preserves supported values | Known protocol examples catch matching bugs in both halves. |
| Normalization is idempotent | Known changed outputs reject a constant or identity implementation. |
| Sorting orders values | Preserving values and multiplicities rejects an always-empty result. |
| A sequence of state changes matches a simple model | Compare public results and state; keep the model simpler than the implementation. |

No property class is universally strongest. Combine only checks that distinguish
different failures, and retain a few concrete domain regressions.

## Generate useful inputs

Construct valid structured inputs directly instead of discarding most random
values through filters. Include relevant boundaries and meaningful action
sequences. Check that cases reach the intended behavior; empty/no-op states,
exhausted filters, and skipped predicates are not useful exploration.

Use composable generators with shrinking. Set a bounded case/time budget from
the risk and local runner policy; this guide imposes no minimum count. Increase
it only for a demonstrated gap. Keep clocks, randomness, and asynchronous
schedules controllable when they affect the contract.

## Keep the failure reproducible

Shrink a failure to a minimal concrete input or command sequence. Save that
counterexample as a permanent regression, plus the tool version and available
seed/replay path for diagnosis. A seed alone may stop reproducing after generator
or tool changes. Do not restrict all future exploration to one permanent seed.

For fast-check, consult the installed version's [replay parameters](https://fast-check.dev/docs/api/interfaces/Parameters/).
For Hypothesis, retain durable explicit inputs with [the documented replay approach](https://hypothesis.readthedocs.io/en/latest/tutorial/replaying-failures.html);
its example database and version-specific reproduction blobs are not a substitute
for the permanent regression. Keep temporary databases and replay evidence in
the active Arcwright run or host evidence area.

If an assertion's sensitivity is still uncertain, use one small relevant fault
in an owned isolated fixture/checkout. An equivalent change proves no weakness;
a surviving real fault identifies a missing check. Restore the experiment and
report only executed observations. Do not introduce a mutation campaign or a
score quota for routine work.
