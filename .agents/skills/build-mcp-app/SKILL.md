---
name: build-mcp-app
description: Build interactive MCP UI resources and widgets, such as forms, pickers, and dashboards, after choosing the server deployment model.
version: 0.1.0
---

# MCP apps

Use this for interactive UI resources in an MCP host. For a server without widgets,
use `build-mcp-server`; for a local packaged server use `build-mcpb` as appropriate.
Confirm the target host, SDK/package versions, server transport, deployment model,
and the widget's real user action before scaffolding.

1. Choose a remote MCP app or a local packaged app from the deployment requirements.
   Read only that architecture guide and the host-specific constraints below.
2. Use a widget for sustained interactive content; use host elicitation for the
   simple input/confirmation case it supports. Do not invent unsupported host APIs.
3. Follow the tool/resource attachment and `App` runtime guides for the installed
   SDK. Keep server validation and authorization at the tool boundary; browser
   state is not authority. Preserve origin, sandbox, CSP, and secret boundaries.
4. Scaffold the smallest real widget and server resource. Read the picker example
   only when it matches the task; adapt its dependencies rather than installing
   every example package.
5. Verify tool invocation, resource loading, initialization, user interaction,
   error/empty/loading states, and the actual round trip to the server. Prefer native
   Arcwright Code/T3 Code preview tools where supported; distinguish browser-only
   rendering from a real MCP-host integration check.
6. Report the result, observed checks, and host/deployment limitations. Do not publish,
   deploy, provision, or add AI attribution merely because a widget was created.

Use current official SDK and host documentation for changed APIs. Keep detailed
schemas, scaffolds, and troubleshooting out of context until their topic is needed.

## Conditional detail

Load only the guide for the current decision, then any specific reference it names.
Do not preload all guides or repeat their examples in the output.

| Topic | Guide |
| --- | --- |
| Build an MCP App (Interactive UI Widgets) | [guide-00-build-an-mcp-app-interactive-ui-widgets.md](guide-00-build-an-mcp-app-interactive-ui-widgets.md) |
| the model host specifics | [guide-01-claude-host-specifics.md](guide-01-claude-host-specifics.md) |
| When a widget beats plain text | [guide-02-when-a-widget-beats-plain-text.md](guide-02-when-a-widget-beats-plain-text.md) |
| Widgets vs Elicitation — route correctly | [guide-03-widgets-vs-elicitation-route-correctly.md](guide-03-widgets-vs-elicitation-route-correctly.md) |
| Architecture: two deployment shapes | [guide-04-architecture-two-deployment-shapes.md](guide-04-architecture-two-deployment-shapes.md) |
| How widgets attach to tools | [guide-05-how-widgets-attach-to-tools.md](guide-05-how-widgets-attach-to-tools.md) |
| Widget runtime — the `App` class | [guide-06-widget-runtime-the-app-class.md](guide-06-widget-runtime-the-app-class.md) |
| Scaffold: minimal picker widget | [guide-07-scaffold-minimal-picker-widget.md](guide-07-scaffold-minimal-picker-widget.md) |
| Design notes that save you a rewrite | [guide-08-design-notes-that-save-you-a-rewrite.md](guide-08-design-notes-that-save-you-a-rewrite.md) |
| Testing | [guide-09-testing.md](guide-09-testing.md) |
| Reference files | [guide-10-reference-files.md](guide-10-reference-files.md) |
