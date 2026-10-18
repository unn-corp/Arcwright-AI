# MCP app verification

Test against the actual target client and installed protocol/SDK versions. Inspect
its supported transport, UI extension, auth, CSP, and host-context behavior rather
than assuming another client's setup instructions apply.

1. Exercise initialization/capability negotiation, tools/list, a real tools/call,
   the UI resource read, and the widget's connection and server round trip through
   a compatible SDK client or Inspector. Use the negotiated protocol version.
2. Verify loading, empty/error states, state updates, user interaction, and visible
   results in the intended host. A model-free JSON-RPC check proves protocol paths;
   it does not by itself prove the host's iframe or widget lifecycle.
3. For quick layout iteration, an owned browser-only preview or mock host bridge is
   useful. Prefer native preview tools under host policy, and label this evidence
   separately from real MCP-host integration. Do not expose secrets through a mock.
4. Check text fallback with a client lacking the UI extension. Diagnose CSP and
   origin failures through the actual iframe/host logs. Use the host's documented
   resource reload behavior; do not force every client to quit/relaunch.
5. Report the source, versions, clients actually checked, and integration limits.
   Register connectors, start tunnels/services, or deploy only when authorized.

For Claude as a selected target, consult current official
[connector testing guidance](https://claude.com/docs/connectors/building/testing).
A local bridge such as mcp-remote is conditional on that client's current transport
support, not a universal prerequisite. See [sandbox guidance](references/iframe-sandbox.md)
for the chosen host's restrictions.
