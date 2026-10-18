---
name: build-mcp-server
description: "Build an MCP server or API integration; choose HTTP, local stdio, or MCPB deployment and route to the appropriate implementation guidance."
version: 0.1.0
---

# Build an MCP server

Design for the user's actual MCP clients and deployment constraints. Start with
MCP protocol/SDK guidance and the installed versions, then load only the target
host's additional requirements. Do not fetch a full host documentation export or
assume a directory submission, cloud deployment, or package install is requested.

## Choose from the existing brief

Resolve missing facts from the repository first: upstream integration, intended
clients, local versus remote access, action surface, authentication, and whether
interactive UI or mid-call input is needed. Ask only for decisions that change the
implementation; do not repeat answered questions.

| Need | Approach |
| --- | --- |
| Shared cloud API integration | Remote Streamable HTTP when it fits hosting/auth requirements |
| Local files, processes, hardware, or OS access | Local stdio, optionally packaged as MCPB for a host that supports it |
| Rich in-chat forms, pickers, or dashboards | `build-mcp-app`, after checking the target client's extension support |
| Simple mid-tool input | Elicitation only when the client advertises the required capability; provide a supported fallback |
| Small action surface | Explicit tools with focused schemas and descriptions |
| Large API surface | Search/discovery plus validated execution, or a small hybrid tool set |

Local stdio works through clients that support process transports; it is not
limited to one provider's plugin system. MCPB support, UI extensions, authorization,
resources, prompts, and server-initiated features vary by client and protocol
version. Inspect negotiated capabilities instead of inferring support from a
brand or historical minimum version.

## Implement the smallest supported integration

1. Honor the existing language/stack and supported SDK. Use the
   [official server guide](https://modelcontextprotocol.io/docs/develop/build-server)
   and version-matched SDK documentation for changed APIs. Treat the bundled
   [versions ledger](references/versions.md) as a reminder to verify dated claims.
2. Define observable tool contracts, validation, authorization, read/write effects,
   and useful errors. Search/execute designs still need operation-specific input
   validation; a generic execution endpoint cannot bypass authorization.
3. Choose auth from the selected transport, upstream service, and client support.
   Apply [auth guidance](references/auth.md) only where relevant. Keep secrets out
   of prompts, logs, responses, source, and browser state.
4. Use [remote scaffolding](references/remote-http-scaffold.md) for a compatible
   remote stack, or the chosen SDK's stdio scaffold for local use. Load
   [Cloudflare deployment](references/deploy-cloudflare-workers.md) only when that
   deployment is selected and authorized. For widgets/packages, pass the brief to
   the matching installed skill without restarting discovery.
5. Verify initialization, actual tool calls, inputs/errors, permissions, and the
   affected client capabilities. Test against the intended host(s); an Inspector
   or browser-only result is not a complete host integration test. Use focused
   checks and existing fixtures rather than adding a broad new harness.
6. Report observed behavior, supported clients/versions, and untested limits.
   Publish, deploy, register connectors, or submit to a directory only when the
   user authorizes those actions. Host-specific directory rules apply only to the
   chosen distribution channel, not to every MCP server.

Keep installed bundles read-only and temporary work in the project's Arcwright
run or host evidence storage. Source implementation belongs in the requested
project paths. Preserve source/license notices; omit AI attribution.

## Conditional implementation detail

- [Tool schemas and descriptions](references/tool-design.md)
- [Resources and prompts](references/resources-and-prompts.md)
- [Elicitation and fallback](references/elicitation.md)
- [Server capabilities](references/server-capabilities.md)
- [the model connector integration](references/claude-connector.md), only when that is the target host or directory
