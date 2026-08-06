# Vendored MCP server-dev skills (build-mcp-*)

The `build-mcp-server`, `build-mcp-app`, and `build-mcpb` skill directories in
this folder are **vendored unmodified** from Anthropic's official Claude plugins
marketplace:

- Source: https://github.com/anthropics/claude-plugins-official/tree/main/plugins/mcp-server-dev
- Docs: https://modelcontextprotocol.io/docs/2026-07-28/develop/build-with-agent-skills
- License: Apache-2.0 — Copyright (c) Anthropic (see `VENDORED-MCP.LICENSE`)

Skill content (SKILL.md + references/) is otherwise unmodified so it stays
in sync with the upstream Agent Skills / MCP connector guidance. These ship
**default-on** with the Arcwright package (not opt-in): they are small (~172 KB)
and useful whenever anyone builds an MCP server.

| Vendored dir | Upstream skill | Purpose |
|---|---|---|
| `build-mcp-server` | mcp-server-dev / build-mcp-server | Entry point: discovery, deployment model, tool design, routes to specialized skills |
| `build-mcp-app` | mcp-server-dev / build-mcp-app | Interactive UI widgets (forms, pickers, dashboards) rendered inline in chat |
| `build-mcpb` | mcp-server-dev / build-mcpb | Package a local stdio server + runtime as an installable `.mcpb` bundle |

For the Claude Code plugin form (optional, Claude-only):

```
/plugin marketplace add anthropics/claude-plugins-official
/plugin install mcp-server-dev
```

To refresh this vendored set, re-copy from the upstream plugin skills tree and
re-run `node build/build.js`:

```bash
git clone --depth 1 --filter=blob:none --sparse \
  https://github.com/anthropics/claude-plugins-official.git /tmp/claude-plugins
git -C /tmp/claude-plugins sparse-checkout set plugins/mcp-server-dev
for s in build-mcp-server build-mcp-app build-mcpb; do
  rm -rf .agents/skills/$s
  cp -a /tmp/claude-plugins/plugins/mcp-server-dev/skills/$s .agents/skills/$s
done
cp -a /tmp/claude-plugins/plugins/mcp-server-dev/LICENSE .agents/skills/VENDORED-MCP.LICENSE
node build/build.js
```
