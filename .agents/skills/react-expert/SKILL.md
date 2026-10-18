---
name: react-expert
description: TRIGGER when writing or reviewing React code — authoritative API research from source. Verifies usage examples, caveats, and patterns against React test files and source, not LLM training data.
---

# React API research

Verify uncertain React behavior against the project's actual version and primary
sources. Use the installed package, current official docs, focused tests/source,
and relevant design history. State when evidence differs between versions or
between Flow and TypeScript definitions. Do not confuse training recall with
observed behavior, and do not require exhaustive research for a routine fact.

1. Resolve the task, React version, and the behavior that needs evidence. Reuse
   existing project context. Read only relevant package files, docs, source, tests,
   or issue/PR discussions; primary-source web access is appropriate.
2. Reuse an accessible matching source checkout when present. If a source clone is
   needed and within scope, put it under the active project's owned
   `_arcwright/_memory/skill-runs/react-expert-<run>/react/` directory. Record its
   revision. Do not pull into a user-owned checkout or create `.claude/react`.
   A current official source link can answer a small question without a clone.
3. Inspect the smallest useful lenses: examples/tests, implementation and warnings,
   types, or history/design rationale. Search narrowly and preserve source paths,
   versions, and links. Do routine lookups directly. Delegate only substantial
   independent research when authorized, using `subagent-protocol`, actual host
   tools/limits, inherited model selection, and small capability briefs.
4. Distinguish public API behavior from internal implementation details. Give the
   requested explanation or code change with relevant evidence and material limits.
   New examples should satisfy the actual public contract, not copy private tests
   blindly. For regression work, use `test-quality` and the project's existing setup.
5. Write a research artifact only when requested or needed for durable handoff.
   Use the owned Arcwright run or host evidence storage; permanent requested docs
   stay in the selected project destination. Keep installed bundles read-only.

For a substantial investigation, consult the conditional
[research lenses](references/research-lenses.md) rather than preloading every
prompt or launching a fixed six-agent team. No provider-specific tool, model,
credential, or output directory is required.

Adapted from [React's research skill](https://github.com/reactjs/react.dev/blob/046f17d04295ba047bb5739026b4ac3110f17028/.claude/skills/react-expert/SKILL.md), with Arcwright invocation and output conventions. See [upstream documentation license](LICENSE-DOCS.md).
