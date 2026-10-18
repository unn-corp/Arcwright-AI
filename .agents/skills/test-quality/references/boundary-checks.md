# Boundary checks and retry behavior

Use these checks when the changed contract involves an API, CLI, persistence, or
retries. Choose only the applicable failure modes; this is not a case quota.

Exercise the real in-process application boundary when practical, using existing
fixtures. For an API, assert the meaningful response fields and relevant public
effects as well as status. For a CLI, check the exit status, intended output or
error, and promised file/state effects. Read persisted state through its public
reader when available. A passing transport mock does not prove application wiring.

Make a rejected request otherwise valid so the intended validation or permission
rule produces the failure. Check that a rejected write leaves state unchanged
when that is promised. Cover compatibility or partial failure only where the
change affects those contracts. Restore dependency overrides and avoid sharing
mutable application instances between parallel tests.

For changed retry behavior, distinguish a transient failure that recovers,
exhausted attempts, and a permanent error that should not retry. Control time and
the external transport; do not sleep or contact a real side-effecting service.
Call counts are useful when the number of attempts is itself the public contract.
If idempotency is promised, verify retries do not duplicate the observable effect.

The [FastAPI testing guide](https://fastapi.tiangolo.com/tutorial/testing/) and
[dependency override guidance](https://fastapi.tiangolo.com/advanced/testing-dependencies/)
show one runner-specific approach. Use the installed framework and its version;
these patterns do not require introducing FastAPI or a new harness.
