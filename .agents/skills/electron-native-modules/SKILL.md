---
name: electron-native-modules
description: "Add or debug native Node addons in Electron, including ABI mismatches, rebuilds, and platform/architecture targets. Excludes pure JavaScript dependencies."
---

# Electron Native Node Modules

Native modules are compiled C/C++ addons (`.node` files) — e.g. `better-sqlite3`,
`sharp`, `serialport`. They are compiled against a specific **ABI**, and **Electron's ABI
is not the same as the system Node.js's ABI** (Electron bundles its own Node, usually a
different version). Install a native module with plain `npm install` and it builds for your
system Node — then Electron refuses to load it.

## When to Use This Skill

- Adding a native dependency to an Electron app
- Hitting `NODE_MODULE_VERSION` / "compiled against a different Node.js version" errors
- Setting up `@electron/rebuild`
- Choosing between N-API and a node-gyp/NAN module
- Producing native builds for multiple OSes and CPU architectures

## Why It Breaks: The ABI Mismatch

```
Error: The module '....node' was compiled against a different Node.js version
using NODE_MODULE_VERSION 115. This version of Node.js requires
NODE_MODULE_VERSION 125.
```

Every Node/Electron release line has a `NODE_MODULE_VERSION` (ABI version). A `.node` built
for system Node's ABI won't load in Electron's runtime, and vice versa. The fix is to
**rebuild the native module against Electron's headers/ABI.**

## Prefer N-API Modules

**N-API (Node-API)** is an ABI-stable C interface. A module built against N-API works
across Node *and* Electron versions **without recompiling**, because it targets a stable
API surface rather than V8/Node internals.

- ✅ Prefer dependencies that ship **N-API prebuilds** (via `prebuild-install` /
  `prebuildify` / `node-addon-api`). They often "just work" in Electron with no rebuild.
- ⚠️ Older modules use **NAN** (bound to V8 internals) and *must* be rebuilt per ABI.
- When authoring a native module, target N-API (`node-addon-api`) for portability.

Check a module's `binding.gyp` / docs: if it advertises N-API / prebuilds, you may not
need the rebuild step at all.

## Rebuild with `@electron/rebuild`

For modules that don't ship a matching prebuild, rebuild against the installed Electron's
ABI. This is the canonical tool.

```bash
npm install --save-dev @electron/rebuild

# After every `npm install` that adds/updates a native module:
npx electron-rebuild
```

It detects the Electron version in the project and recompiles every native dependency in
`node_modules` against Electron's headers. Wire it into your workflow:

```jsonc
// package.json
{
  "scripts": {
    "postinstall": "electron-rebuild"   // or run via your packager's hooks
  }
}
```

**Electron Forge** runs the rebuild automatically during `make`/`package` (via its rebuild
plugin). **electron-builder** runs `@electron/rebuild` automatically before packaging too —
so you mainly need manual `electron-rebuild` for the *dev* run cycle.

```bash
# Target a specific Electron version / arch explicitly when needed
npx electron-rebuild --version 30.0.0 --arch arm64
```

- ❌ **NEVER** assume a `npm install`'d native module works in Electron without a rebuild
  or an N-API prebuild — test that it actually loads under Electron, not under `node`.
- ✅ Re-run the rebuild whenever you **upgrade Electron** (the ABI may change).

## Toolchain Prerequisites

Compiling needs a C/C++ toolchain that `node-gyp` can find:

| OS | Needs |
|----|-------|
| Windows | Visual Studio Build Tools (C++ workload) + Python 3 |
| macOS | Xcode Command Line Tools (`xcode-select --install`) |
| Linux | `build-essential` (gcc/g++/make) + Python 3 |

If `node-gyp` errors, it's almost always a missing/old compiler or Python — fix that first.

## Per-Platform & Per-Arch Builds

A `.node` is platform- **and** architecture-specific. A macOS x64 build won't run on
Apple Silicon (arm64); a Linux build won't run on Windows.

- ✅ **Build each target on (or for) its own platform/arch.** Cross-compiling native code
  is painful — prefer building Windows artifacts on Windows, macOS on macOS, etc. (CI
  matrix runners are the standard approach).
- ✅ For macOS universal binaries, build both `x64` and `arm64` and have the packager
  lipo/merge them (`@electron/universal`, wired through Forge/electron-builder).
- ✅ Use `electron-rebuild --arch <arch>` to target the architecture you're packaging for,
  especially when building arm64 artifacts on an x64 machine (and vice versa).
- ❌ **NEVER** ship a single native build and expect it to run on every OS/arch.

## Debugging Checklist

1. Read the error — `NODE_MODULE_VERSION` mismatch ⇒ rebuild against Electron.
2. Confirm the module actually has a native component (`.node` in its tree / a
   `binding.gyp`). Pure-JS modules never need this.
3. Verify the toolchain (compiler + Python) is installed and found by `node-gyp`.
4. Run `npx electron-rebuild`; confirm it reports rebuilding *your* module.
5. Confirm the arch matches what you're packaging (`--arch`).
6. After upgrading Electron, rebuild again.

## Validation Checklist

- [ ] Native deps either ship N-API prebuilds or are rebuilt with `@electron/rebuild`
- [ ] `electron-rebuild` runs in the dev install flow; packager handles it at build time
- [ ] Module verified to load under **Electron**, not just `node`
- [ ] Build toolchain (C/C++ + Python) present on each build host
- [ ] Separate builds produced per OS and per CPU arch
- [ ] Rebuild re-run after any Electron version upgrade
