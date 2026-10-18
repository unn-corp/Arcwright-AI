# Concurrency and ownership

Use the host's actual concurrency limit, counting the coordinator and already
running work when that host counts them. Queue independent work into waves when
capacity is exhausted. Do not invent a fixed global fan-out limit.

Parallel tasks need independent inputs and disjoint ownership. Sequence a consumer
after its producer's output is verified. Shared-checkout writers own separate
paths; lockfiles, dependency installs, generated outputs, and builds may conflict
even when source files differ. Give read-only reviewers a stable source identity.

One coordinator writes a shared ledger. Children return findings or use separate
artifact paths; append-only text is not sufficient protection against concurrent
writes. Reconcile every task result before declaring a stage complete.

For separate checkouts, use the host's supported isolation mechanism. Arcwright
Code `delegate_task` worktrees start from the parent local commit, without copying
uncommitted edits. Plan dependency commits or accessible patch evidence explicitly.
