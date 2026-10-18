# Workflow routing examples

Read only the alternative relevant to a real routing choice. `../SKILL.md` governs
authorization, provider/model selection and whether to recommend or execute.
Historical track scores and universal Sonnet/Opus defaults are retired.

## Runtime options

| User task | Useful approach | Important boundary |
| --- | --- | --- |
| Add a settings toggle | Current agent, existing tests as needed | No compulsory dev/QA team for a tiny edit |
| Implement SSO across API and UI | Sequential design/contracts, then independent implementation lanes if authorized | Shared contracts before dependent edits; no competing writers |
| Migrate hundreds of components | Bounded discovery, mechanical migration batches, focused verification | Record coverage and unresolved cases rather than claiming exhaustive search |
| Find deprecated calls | Targeted `rg`, inspect matching contexts, then change only if requested | Discovery itself does not require a subagent |
| Make a project pass its required checks | Work iteratively using actual failures and focused reruns | Create a persistent goal only on an explicit goal request |
| Review a security boundary | Relevant security skill; independent review if requested/useful and authorized | A review does not deploy, mutate production or require a premium model |
| Watch independent agent lanes | Supported native/Herdr visibility | User opt-in; panes do not own or spawn the child tasks |

For a recommendation-only request, respond with the approach, a supported action
and why. For already-requested implementation, continue within existing permission
rather than asking the user to send the same request as a special trigger phrase.

## Host-specific alternatives

- **Native agents:** use the actual native tools when they support the chosen model.
  Scoped prompts should identify inputs, owned files, expected result and evidence.
  Reuse a native child only where the host supports it and there is unresolved work.
- **Arcwright Code/T3:** discover the live provider/model catalog. Use child-task
  delegation for explicit T3 work, cross-provider/chosen-model work unsupported by
  native tools, and worktree isolation. Track `taskId`; a new review round gets a new
  delegation with previous findings, responses and remaining objections.
- **`ultracode`:** where exposed by the host, a staged dynamic workflow can organize
  broad work without keeping every intermediate result in the root context. It is
  not required merely because twelve or more files change. Check local host docs
  before citing syntax; do not promise this runtime on another harness.
- **`/goal`:** where supported, use only for an explicit autonomous-goal request,
  with a demonstrable end state and the user's constraints. The evaluator's actual
  tool access is host-specific; do not assume it runs commands or infers external
  state that the agent has never observed.
- **Scheduling:** a recurring task is persistent work, separate from an iterative
  implementation. Use the host scheduler only when requested; a CLI `/loop` or
  `/schedule` from another host is not a portable fallback.
- **Herdr:** load the installed Herdr guide after an explicit watch/pane request,
  verify its runtime and preserve native task ownership. Do not create panes for
  ordinary work or use pane text as task-state synchronization.

## Bounded execution

Prefer one coherent change and the smallest evidence that can falsify it. Preserve
required checks, avoid duplicate active tasks and keep unresolved risk visible.
Budget exhaustion, elapsed time or an empty search never substitutes for approval.
Do not invent model usage, test counts or provider capabilities. If the requested
runtime is unavailable, say what is missing and use an authorized supported path
when it meets the same request; do not substitute top-level conversations for
subagents or silently commission persistent work.
