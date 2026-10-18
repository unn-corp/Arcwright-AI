# Durable project context

Use `AGENTS.md` for shared durable rules unless the user explicitly chose another
convention. Required host files import it; respect host precedence and existing
personal content. Use `agent-instructions` for an authorized migration rather than
creating a second source of truth. Ordinary context discovery does not authorize
a memory write.

Persist facts useful across tasks: verified setup/test/build commands, stable
architecture pointers, conventions, and recurring non-obvious gotchas. A command
belongs here only after inspecting its actual script or configuration. Record a
version-sensitive constraint with its applicable version, not a timeless claim.

Update existing generated sections such as `Setup & commands`, `Architecture`,
and `Gotchas / project context` in place. Preserve hand-authored overview,
conventions, security policy, commit/PR rules, and content outside owned markers.
Do not impose a new whole-file template or delete user material to meet a length
quota. Keep descriptions concise and link to detailed project docs.

Before writing, compare the proposed facts with current sections. Skip unchanged
writes, replace obsolete entries, and avoid duplicating text imported from
another instruction file. If ownership of a consequential instruction is
unclear, propose a specific change instead of silently rewriting it.

Temporary progress, research logs, review findings, and task state stay in their
chosen task artifacts or the Arcwright run area. Tracker synchronization remains
an explicitly requested action. A durable context update never adds AI/model
attribution or reveals credentials.
