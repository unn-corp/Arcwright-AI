<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

# Build an MCP App (Interactive UI Widgets)

An MCP app is a standard MCP server that **also serves UI resources** — interactive components rendered inline in the chat surface. Build once, runs in any host that implements the apps surface.

The UI layer is **additive**. Under the hood it's still tools, resources, and the same wire protocol. If you haven't built a plain MCP server before, the `build-mcp-server` skill covers the base layer. This skill adds widgets on top.

> **Conditional Claude target:** Add the server as a custom connector in claude.ai (via a Cloudflare tunnel for local dev) — this exercises the real iframe sandbox and `hostContext`. See https://claude.com/docs/connectors/building/testing.
