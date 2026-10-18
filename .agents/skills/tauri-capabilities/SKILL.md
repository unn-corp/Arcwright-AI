---
name: tauri-capabilities
description: "Configure or review Tauri capability scopes and plugin permissions for the intended windows and commands."
---

# Tauri v2 Permissions & Capabilities

This is the flagship security change in Tauri v2. Instead of a single global `allowlist`, v2 uses a fine-grained Access Control List (ACL): **permissions** describe what an API can do, **capabilities** grant sets of permissions to specific windows, and **scopes** constrain those permissions to specific resources. Distilled from https://v2.tauri.app/security/, /security/permissions/, /security/capabilities/, and /security/scope/.

## When to Use This Skill

- A frontend call to a plugin (fs, dialog, shell, http…) fails with "forbidden"/"not allowed" or does nothing
- Granting a window the ability to use a specific command or plugin API
- Restricting filesystem/shell/network access to specific paths/programs/URLs
- Migrating a v1 `allowlist` to v2

## The Three Concepts

| Concept | What it is | Where it lives |
|---------|-----------|----------------|
| **Permission** | A named grant for a specific action (e.g. `fs:allow-read-text-file`). Permissions can be grouped into **sets**; `*:default` is the conventional sensible default set. | Defined by core/plugins (`.toml` in the plugin); referenced by identifier |
| **Capability** | A JSON file that grants a list of permissions to one or more windows by label | `src-tauri/capabilities/*.json` |
| **Scope** | Allow/deny resource constraints attached to a permission (paths, URLs, programs) | Inside the capability or the permission definition |

Capability files in `src-tauri/capabilities/` are **auto-discovered** at build time and enforced by the runtime **authority**.

## Anatomy of a Capability File

```json
// src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capability for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "opener:default",
    "fs:allow-read-text-file",
    "dialog:default"
  ]
}
```

- `identifier` — unique name for this capability
- `windows` — which window labels it applies to (glob like `"main-*"` allowed)
- `permissions` — the permission identifiers granted

Permission identifiers are `<prefix>:<name>`. The `core:` prefix covers built-in functionality (`core:default`, `core:window:allow-create`, `core:event:default`, …); plugin prefixes match the plugin (`fs:`, `dialog:`, `shell:`, `http:`, `opener:`).

## The #1 Footgun: Missing Capability = Silent Failure

If a window's capability does not include the permission for a command/API, the call is **denied** — often with no obvious error, or a rejected promise the frontend ignores.

> ❌ **DON'T** call a plugin API and assume it works:
> ```js
> import { readTextFile } from '@tauri-apps/plugin-fs';
> await readTextFile('config.toml'); // rejects: fs.read_text_file not allowed
> ```
> if `capabilities/*.json` doesn't grant an `fs:` read permission for this window.
>
> ✅ **DO** add the matching permission to the capability:
> ```json
> "permissions": ["fs:allow-read-text-file", { "identifier": "fs:scope", "allow": [{ "path": "$APPCONFIG/*" }] }]
> ```

When a Tauri call mysteriously fails, **check the capability file first**.

## Scopes — Constraining a Permission

Scopes restrict *which resources* a permission applies to. Many permissions are scoped objects with `allow` / `deny` (deny always wins).

Filesystem scope using path variables (`$APPCONFIG`, `$APPDATA`, `$HOME`, `$RESOURCE`, …):

```json
{
  "identifier": "fs:scope",
  "allow": [{ "path": "$APPDATA/**" }],
  "deny": [{ "path": "$APPDATA/secrets/**" }]
}
```

Shell scope — only allow specific programs/args:

```json
{
  "identifier": "shell:allow-execute",
  "allow": [
    { "name": "ls", "cmd": "ls", "args": ["-la"] }
  ]
}
```

HTTP scope — only allow specific URLs:

```json
{ "identifier": "http:default", "allow": [{ "url": "https://api.example.com/*" }] }
```

## Platform-Specific Capabilities

Restrict a capability to platforms with `platforms`:

```json
{
  "identifier": "mobile-only",
  "platforms": ["iOS", "android"],
  "windows": ["main"],
  "permissions": ["barcode-scanner:allow-scan"]
}
```

## Defining Your Own Permissions (plugin authors)

A command you write is gated too. Plugins define permissions in `permissions/*.toml`; for an app's own commands, the scaffold's `core:default` and an explicit grant cover them. To expose a custom command broadly, reference it via the generated permission for your command set in the capability.

## v1 Allowlist → v2 Capabilities

| v1 | v2 |
|----|----|
| `tauri.conf.json` `allowlist.fs.readFile: true` | `fs:allow-read-text-file` permission in a capability |
| `allowlist.fs.scope: ["$APPDATA/*"]` | `fs:scope` object with `allow` paths in the capability |
| `allowlist.shell.scope` | `shell:` scoped permission |
| Global, all-windows | Per-window via `windows` array — least privilege |
| One block | Multiple capability files, auto-discovered |

`tauri migrate` generates an initial capability from the old allowlist, but review it: the v1 allowlist was global, whereas v2 lets (and encourages) you to grant the minimum per window.

## Inspecting What's Available

The build generates permission schemas under `src-tauri/gen/schemas/`. Each plugin's README lists its permission identifiers (`<plugin>:default`, `<plugin>:allow-<command>`, `<plugin>:deny-<command>`). Run `tauri permission ls` / `tauri permission add` via the CLI to explore and add permissions.

## Validation Checklist

- [ ] A capability file in `src-tauri/capabilities/` targets every window that needs access
- [ ] Each plugin API used by the frontend has its `<plugin>:` permission granted
- [ ] Filesystem/shell/http access is scoped (allow lists), not wide open
- [ ] `deny` entries override `allow` where sensitive paths must be excluded
- [ ] Capabilities are scoped per-window (least privilege), not blanket-granted
