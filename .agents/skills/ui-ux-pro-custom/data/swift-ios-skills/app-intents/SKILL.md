---
name: app-intents
description: "Implement App Intents, AppEntity queries, App Shortcuts, Spotlight actions, and widget/control intents. Use when exposing app actions to system surfaces, rather than designing the app's ordinary navigation."
---

# App Intents

Expose an existing app capability through the system surface the user needs.
Check the deployment target, installed SDK, and intent target membership first;
iOS 26 examples are conditional, not a reason to raise the app's minimum OS.

## Choose the surface

| Need | Starting point |
|---|---|
| Siri or Shortcuts action | `AppIntent`, `AppShortcutsProvider` |
| Configurable widget | `WidgetConfigurationIntent` |
| Interactive widget action | Intent-backed `Button` or `Toggle` |
| Control Center control | Supported control configuration and intent |
| Spotlight entities/actions | `IndexedEntity` and indexing support |
| Snippets or Visual Intelligence | SDK-supported snippet/value-query APIs |

Use lightweight entity adapters with stable IDs and display representations.
Choose a query matching ID lookup, text search, finite enumeration, or singleton
resolution. Missing/deleted IDs should resolve safely; suggestions should reflect
current accessible data rather than stale persistence objects.

## Correctness constraints

- Give actions descriptive titles and parameter summaries. Distinguish required
  input from defaults and optional values; verify both previews and execution.
- Provide entity/type display representations. For fixed options, use an
  `AppEnum` representation accepted by the current SDK, normally String-backed.
- Include `\(.applicationName)` in App Shortcut invocation phrases. Keep phrases
  within supported interpolation rules and test their actual discovery.
- `perform()` must respect authentication, authorization, cancellation, and the
  app's current data state. System invocation does not confer extra permission.
  Await I/O without blocking; declare the isolation required for UI/persistence
  access and keep values crossing domains Sendable.
- Share intent/entity definitions with the necessary extensions. A working
  in-app action does not prove the system can discover or execute its intent.
- Update suggested parameters and Spotlight entries when the underlying data
  changes. Re-resolve persisted entity IDs before acting on them.
- Check schema macro availability and names in the project's SDK. Do not copy
  deprecated entity/enum macros or newer indexing attributes into older targets.

## Validation and completion

Build the app and affected extensions with actual concurrency settings. Invoke
the changed action from its intended system surface and check relevant missing
entity, denied-access, and cancellation paths. Confirm title/parameter display
and discovery after data changes. Previews alone do not establish execution.

Stop when the requested surface discovers and performs the action with correct
permissions and results. Do not expose unrelated actions or add every system
surface to complete a single intent.

## Conditional recipes

- [Intent and parameters](references/implementation-guide.md#appintent-protocol),
  [entities](references/implementation-guide.md#appentity),
  [query variants](references/implementation-guide.md#entityquery-4-variants),
  [enums](references/implementation-guide.md#appenum), and
  [shortcut phrases](references/implementation-guide.md#appshortcutsprovider).
- [Siri](references/implementation-guide.md#siri-integration),
  [widget intents](references/implementation-guide.md#interactive-widget-intents),
  and [newer system surfaces](references/implementation-guide.md#ios-26-additions).
- [Advanced parameter/query and schema recipes](references/appintents-advanced.md)
  when those features are required.

Source terms: [notice](../UPSTREAM-NOTICE.md), [license](../UPSTREAM-LICENSE).
