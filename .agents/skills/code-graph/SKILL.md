---
name: code-graph
description: Token-efficient code intelligence layer — build/maintain a local symbol graph (symbols → files → dependents) under _arcwright-output/graph/ as JSON, query blast radius of a change, stale-file detection via git. Use before any review or refactor to know "who imports X" and "what does changing Y affect" without loading whole files.
allowed-tools: Read, Grep, Glob, Bash, Write
---

# Code Graph Skill

Build and query a lightweight local symbol → dependency graph so reviewers can assess blast radius without loading whole files.

---

## 1. Graph Schema

Stored at `_arcwright-output/graph/` as JSON. Three files:

### `symbols.json`
```jsonc
{
  "version": 1,
  "built_at": "ISO8601",
  "root": "/absolute/project/root",
  "symbols": {
    "<symbol_key>": {
      "name": "AuthService",           // bare name
      "kind": "class|function|const|type|interface|default",
      "file": "src/auth/service.ts",   // project-relative
      "line": 14,                      // declaration line
      "exported": true
    }
  }
}
```

Symbol key = `"<file>:<name>"`, e.g. `"src/auth/service.ts:AuthService"`.

### `imports.json`
```jsonc
{
  "version": 1,
  "built_at": "ISO8601",
  "edges": [
    {
      "from": "src/routes/user.ts",    // importer (project-relative)
      "to": "src/auth/service.ts",     // imported file (resolved, project-relative)
      "symbols": ["AuthService", "verifyToken"]  // names imported; [] = side-effect or wildcard
    }
  ]
}
```

### `meta.json`
```jsonc
{
  "version": 1,
  "built_at": "ISO8601",
  "root": "/absolute/project/root",
  "languages": ["ts", "js", "py"],
  "file_hashes": {
    "src/auth/service.ts": "sha1hex"   // used for staleness detection
  },
  "stats": {
    "files_indexed": 142,
    "symbols_found": 891,
    "edges_found": 340
  }
}
```

---

## 2. Build Step

### 2.1 Detect languages

```bash
# What's in this repo?
find . -not -path '*/node_modules/*' -not -path '*/.git/*' \
  \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.mjs' -o -name '*.py' \) \
  | head -5
```

### 2.2 Collect files to index

```bash
# All indexable files (exclude node_modules, dist, .git, __pycache__, coverage)
rg --files \
  --type ts --type js --type py \
  --glob '!node_modules/**' --glob '!dist/**' --glob '!build/**' \
  --glob '!coverage/**' --glob '!*.min.js'
```

### 2.3 Extract symbols — language patterns

**TypeScript / JavaScript** (best-effort grep, not an AST):

```bash
# Exported declarations
rg --line-number \
  'export\s+(default\s+)?(class|function|const|let|var|type|interface|enum)\s+(\w+)' \
  --type ts --type js \
  --glob '!node_modules/**' \
  -o --replace '$1:$2:$3'
```

Named captures not supported in all rg versions; use: `-o` + post-process or:

```bash
rg -n \
  'export (default )?(class|function|const|let|var|type|interface|enum) (\w+)' \
  src/ --type ts
# Output: path:line:matched_line — parse with awk/sed
```

**Python:**

```bash
# Classes and top-level functions
rg -n '^\s*(class|def|async def)\s+(\w+)' --type py src/
# Constants (ALL_CAPS at module level)
rg -n '^([A-Z][A-Z0-9_]+)\s*=' --type py src/
```

### 2.4 Extract imports — language patterns

**TypeScript / JavaScript:**

```bash
# Named imports: import { A, B } from './path'
rg -n "^import\s*\{([^}]+)\}\s*from\s*['\"]([^'\"]+)['\"]" --type ts --type js src/

# Default + namespace imports
rg -n "^import\s+(\w+)\s+from\s*['\"]([^'\"]+)['\"]" --type ts --type js src/
rg -n "^import\s*\*\s*as\s+\w+\s+from\s*['\"]([^'\"]+)['\"]" --type ts --type js src/

# Re-exports
rg -n "^export\s*\{[^}]+\}\s*from\s*['\"]([^'\"]+)['\"]" --type ts --type js src/
```

**Python:**

```bash
# from X import Y
rg -n "^from\s+([\w.]+)\s+import\s+(.+)$" --type py src/

# import X
rg -n "^import\s+([\w.,\s]+)$" --type py src/
```

### 2.5 Resolve import paths

For relative imports (`./foo`, `../bar/baz`):
- Join the importer's directory + import path + try `.ts`, `.tsx`, `.js`, `/index.ts`, `/index.js`
- For path aliases (`@/`, `~/`): read `tsconfig.json` `paths` field to resolve

For absolute/package imports: record as `external:<package>` — not part of blast radius.

### 2.6 Write graph files

Write `symbols.json`, `imports.json`, `meta.json` to `_arcwright-output/graph/`.

Create `_arcwright-output/graph/` if missing:
```bash
mkdir -p _arcwright-output/graph
```

---

## 3. Staleness Detection (Incremental Rebuild)

```bash
# Files changed since last graph build (git-aware)
git diff --name-only HEAD

# Cross-reference with meta.json file_hashes:
# For each changed file, recompute sha1 and compare.
# Rebuild only stale files' symbols + edges.
```

Full rebuild trigger conditions:
- `meta.json` missing or `version` mismatch
- `_arcwright-output/graph/` absent
- `--force` flag in `$ARGUMENTS`
- >20% of indexed files are stale

Incremental: remove stale file's entries from `symbols.json` (filter by `file` field) and from `imports.json` (filter by `from` field), then re-index only stale files and append.

---

## 4. Query Patterns

All queries read from the JSON files — no re-scan needed.

### Q1: Who imports file X?
```
Find all edges in imports.json where `to` == normalize(X).
Return: list of `from` files + `symbols` pulled.
```

### Q2: Who imports symbol S from file X?
```
Find edges where `to` == X AND `symbols` contains S.
Return: importing files.
```

### Q3: Blast radius of changing file X
```
1. Direct importers: edges where `to` == X  (depth 1)
2. Transitive importers: BFS from each depth-1 file using `to` == that file
3. Cap at depth 4 (configurable via --depth N). Report depth per file.
4. Return: { direct: [...], transitive: { depth2: [...], depth3: [...] } }
```

### Q4: What does file X depend on?
```
Find all edges where `from` == X.
Return: list of `to` files + symbols imported.
```

### Q5: Find all usages of symbol S
```
Scan all edges where `symbols` contains S.
Also grep source files for S as fallback (dynamic usage, string refs).
```

### Q6: Orphaned exports (dead code candidates)
```
Find symbols where exported == true AND
no edge in imports.json has that symbol in `symbols`.
Report as "possibly unused" (may be used via re-export or dynamic import).
```

---

## 5. Output Format

### Build report
```
Code Graph built — 142 files, 891 symbols, 340 edges
Languages: ts, js | Root: src/
Stored: _arcwright-output/graph/
```

### Blast radius report
```
## Blast Radius: src/auth/service.ts

Direct importers (depth 1) — 4 files:
  src/routes/user.ts        imports: AuthService, verifyToken
  src/routes/admin.ts       imports: AuthService
  src/middleware/auth.ts    imports: verifyToken, AuthConfig
  src/tests/auth.test.ts    imports: AuthService (test — lower risk)

Transitive (depth 2) — 7 files:
  src/app.ts                via middleware/auth.ts
  src/server.ts             via routes/user.ts
  ... (3 more)

Transitive (depth 3) — 2 files:
  (capped — 1 more at depth 4+, use --depth 5 to expand)

Risk: HIGH — core auth module; changes propagate to app entry points.
```

---

## 6. Optional MCP Server Path

> **This section is a design note only. No MCP server is built here.**
> The skill uses local JSON files and grep. The MCP path below is for a future
> integration when real-time tool access from Claude is desired.

### MCP Server Design

```
// TODO: implement mcp-code-graph server
// Expose these as MCP tools:
//   code_graph_build({ root, force })        → build/refresh graph
//   code_graph_query({ type, file, symbol })  → run Q1-Q6 queries
//   code_graph_blast_radius({ file, depth })  → blast radius report
//   code_graph_status()                       → meta.json stats + staleness
//
// Server reads _arcwright-output/graph/*.json; no indexing in the server process.
// Use @modelcontextprotocol/sdk (TypeScript) or mcp (Python) — match whichever
// the host project already uses.
// Registration: add to .claude/settings.json mcpServers block:
//   "code-graph": { "command": "node", "args": ["path/to/mcp-server.js"] }
// For Kiro: add to .kiro/agents/<agent>.json mcpServers block similarly.
```

To find existing MCP patterns in this repo:
```bash
grep -r "mcpServers\|mcp-server\|@modelcontextprotocol" \
  --include="*.json" --include="*.md" -l .
```

---

## 7. Arguments

`$ARGUMENTS` accepts:
- `build` — build/refresh graph (default if no graph exists)
- `query <file>` — blast radius for a file
- `query <file> <symbol>` — usages of a specific symbol
- `who-imports <file>` — direct importers only
- `deps <file>` — what file X depends on
- `orphans` — list exported symbols with no known importers
- `--force` — full rebuild even if graph is fresh
- `--depth N` — transitive depth cap (default 4)
- `--threshold N` — only report files imported by ≥N others
