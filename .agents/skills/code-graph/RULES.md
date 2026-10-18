# Code Graph — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Graph lives at `_arcwright-output/graph/` — three files: `symbols.json`, `imports.json`, `meta.json`.
- Build uses rg/grep only. No AST parsers. Best-effort is good enough for blast-radius queries.
- Staleness: check `meta.json` file_hashes vs `git diff --name-only HEAD`. Rebuild only stale files.
- Full rebuild triggers: missing graph, version mismatch, >20% files stale, or `--force`.
- External package imports → recorded as `external:<pkg>`, NOT part of blast radius.
- Blast radius BFS capped at depth 4 by default. Always report depth per file.
- Test files included in graph but flagged as lower-risk in blast radius output.
- MCP server is a documented TODO only — do NOT build it here.
- Never load whole source files to answer a graph query; read JSON files instead.
- Incremental update: remove stale file's entries from both JSON files, then append fresh.

## Trigger
Use an existing graph or build one for substantial transitive-impact queries.
Use direct searches for small caller/import lookups; ordinary review does not
require indexing or reviewer agents. Label incomplete and stale results.
