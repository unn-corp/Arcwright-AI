# MCP Standards — Your Project

> Loaded by all Arcwright agents at activation. Defines available MCP servers, their capabilities, RAG storage conventions, and graceful degradation rules.

---

## Availability

Configure MCP servers appropriate to your project. The examples below show a typical setup with a project MCP server and a deployment server.

| Server | Claude Code | Notes |
|--------|-------------|-------|
| `project-mcp` | HTTP — `localhost:5050/mcp` | Project-specific tools (feedback, roadmap, DB introspection) |
| `dokploy` | stdio or HTTP | Deployment management (optional) |

### Graceful Degradation Rule

**NEVER block a workflow because an MCP tool is unavailable.** If a tool call fails or a server is offline:
1. Continue the workflow without it
2. Note the skipped step inline (e.g. "⚠️ RAG store skipped — project MCP not connected")
3. Only surface the gap to the user if it materially affects the output quality

---

## Project MCP (`mcp__<project>__*`)

Replace `<project>` with your project's MCP server name. Typical tools:

### Feedback

| Use Case | Tool |
|----------|------|
| List/filter bugs or feature requests | `list_feedback(status, priority, category, search, limit)` |
| Full details on a specific item | `get_feedback(feedback_id)` |
| Text search across title/description | `search_feedback(query, limit)` |
| Mark work started | `update_feedback_status(feedback_id, "in_progress")` |
| Mark work complete | `update_feedback_status(feedback_id, "fixed")` |
| Post progress comment | `add_feedback_comment(feedback_id, content)` |

**Status flow:** `open → in_progress → fixed → closed`

### Roadmap

| Use Case | Tool |
|----------|------|
| Load full roadmap | `get_roadmap()` |
| Get card details | (query roadmap, filter by card ID or name) |
| Create new roadmap card | `create_roadmap_card(column_id, title, description)` |
| Update card | `update_roadmap_card(card_id, ...)` |

### Database Introspection (read-only)

| Use Case | Tool |
|----------|------|
| List all tables | `list_tables(db)` |
| Inspect table schema | `describe_table(table_name, db)` |
| Run read-only SQL | `query_database(sql, limit, db)` |

### RAG Tools

| Use Case | Tool |
|----------|------|
| Semantic search | `rag_query(query, collection)` |
| **Unified store** (auto-routes to Qdrant or MongoDB) | `rag_store(data, intent, collection, title, source)` |
| Store project file (always Qdrant) | `rag_store_file("/app/path/to/file", collection)` |
| Remove by source | `rag_delete_source(source, collection)` |

**`rag_store` intent field drives LLM routing:**

| Intent hint | Routes to | Use for |
|-------------|-----------|---------|
| `"search for this later"` | Qdrant (vector) | Prose, docs, notes, explanations |
| `"find by meaning"` | Qdrant (vector) | Natural language content |
| `"exact record, fetch by source"` | MongoDB | Structured records, configs, session state |
| `"session state"` or `"agent memory"` | MongoDB | Agent memory, workflow position |
| `"structured data"` | MongoDB | JSON objects, key-value records |
| *(empty / string data)* | Qdrant (fast path, no LLM) | Default for plain text |

---

## RAG Storage Strategy

All agents must follow these conventions when storing artifacts.

### Collections

| Collection | Type | Contents |
|------------|------|----------|
| `project_docs` | Vector + MongoDB | All `docs/` files, project context — semantic search + canonical source |
| `planning_artifacts` | Vector | PRDs, briefs, UX designs, architecture docs, epics, stories, quick specs |
| `planning_records` | MongoDB | Same, structured: `{feature, track, type, status, date, path}` |
| `implementation_artifacts` | Vector | Code review reports, adversarial review findings, dev notes |
| `impl_records` | MongoDB | Same, structured: `{feature, story, reviewer, pass_fail, date}` |
| `test_artifacts` | Vector | QA reports, test descriptions, coverage notes |
| `test_results` | MongoDB | Structured: `{test_name, file, pass_fail, feature, date}` |
| `agent_sessions` | MongoDB | Master orchestrator session state, branch, workflow position |
| `triage_history` | MongoDB | S/M/L decisions + reasoning per session |

### When to Store

| Event | Action |
|-------|--------|
| Any `docs/` file updated | Delete old entry by source → re-store to `project_docs` (vector + MongoDB) |
| PRD / brief / spec created | Store to `planning_artifacts` (vector) + `planning_records` (MongoDB) |
| Architecture doc created | Store to `planning_artifacts` (vector) + `planning_records` (MongoDB) |
| Dev story / code review completed | Store to `implementation_artifacts` (vector) + `impl_records` (MongoDB) |
| QA / test report created | Store to `test_artifacts` (vector) + `test_results` (MongoDB) |
| Session starts (master orchestrator) | Upsert `agent_sessions` with current branch + workflow state |

### File Path Note

When using `rag_store_file`, paths must be container paths:
- ✅ `/app/docs/features/some-doc.md`
- ❌ `C:\Users\...\docs\features\some-doc.md`

For files outside the container, use `Read` tool then `rag_store`.

### Update Pattern

```
# Updating an existing document in vector storage:
rag_delete_source(source="docs/reference/api.md", collection="project_docs")
rag_store_file("/app/docs/reference/api.md", collection="project_docs")

# MongoDB upsert: store with same source key to overwrite
```
