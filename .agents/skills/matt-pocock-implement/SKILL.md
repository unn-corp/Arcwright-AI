---
name: matt-pocock-implement
description: "Implement a piece of work based on a spec or set of tickets."

---

Read [Arcwright integration](../matt-pocock/INTEGRATION.md) once per task; reuse it if already loaded.

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

Call the Skill tool with "matt-pocock-tdd" where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, call the Skill tool with "matt-pocock-code-review" to review the work.

Commit your work to the current branch.
