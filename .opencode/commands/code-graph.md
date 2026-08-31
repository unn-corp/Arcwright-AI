---
description: Build/query a local symbol dependency graph to assess blast radius of changes without loading whole files. Stores JSON graph under _arcwright-output/graph/. Supports build, query, who-imports, deps, and orphan detection.
handoffs:
  - pr-review-panel (feed blast radius into reviewer lenses before fan-out)
---

# /code-graph — Code Intelligence Graph

Build and query a lightweight local symbol graph for fast blast-radius analysis.

## Instructions

1. Load `.agents/skills/code-graph/SKILL.md` for schema and build protocol.
2. Parse `$ARGUMENTS` to determine operation (default: `build` if graph absent, `query` otherwise).
3. Follow Section 2 (Build Step) to index or incrementally refresh the graph.
4. Follow Section 4 (Query Patterns) to answer the requested query.
5. Output in the format defined in Section 5.

## Arguments

`$ARGUMENTS`:
- `build` — build or refresh graph
- `query <file>` — blast radius for a file (BFS importers)
- `query <file> <symbol>` — usages of a specific symbol
- `who-imports <file>` — direct importers only (depth 1)
- `deps <file>` — what the file depends on
- `orphans` — exported symbols with no known importers
- `--force` — full rebuild ignoring staleness
- `--depth N` — transitive depth cap (default 4)
- `--threshold N` — only list files imported by ≥N others

## Common usage with /pr-review

Run `code-graph query <changed-file>` first to understand blast radius,
then pass the result as context when running `/pr-review`.
