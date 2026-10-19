# Completion signals

Use the host's actual return value, task status, or completion event. Async work
requires a recorded task ID and a supported wait/status path. Sequential and
parallel tasks follow the same ownership and verification rules.

Retired pane heartbeat strings, completion marker files, and cross-pane signal
protocols are not task lifecycle APIs. Do not revive them or add polling files.
A requested pane is a viewing surface; the delegation host remains the source
of task status. Use bounded status checks only when native events/waits cannot
resolve the current state.
