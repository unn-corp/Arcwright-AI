---
name: tauri-frontend-setup
description: >
  Wire a JavaScript or Rust frontend framework to a Tauri v2 app — the build
  section of tauri.conf.json (devUrl, frontendDist, beforeDevCommand,
  beforeBuildCommand), the static-export / SSG requirement (Tauri is a static
  host with no SSR server), dev-server port/strictPort, and per-framework setup
  for Vite, Next.js, SvelteKit, Nuxt, and Rust (Trunk/Leptos).
  USE FOR: configuring tauri.conf.json build keys, fixing a blank window or
  "could not connect to devUrl" in dev, fixing a production build that 404s or
  shows nothing because the frontend emitted an SSR server instead of static
  files, choosing the right adapter/output mode per framework.
  DO NOT USE FOR: calling Rust from JS (see tauri-commands-ipc), the permission
  model (see tauri-capabilities), or window creation (see tauri-windowing).
---

# Tauri v2 Frontend Setup

Tauri does not bundle a web server — at runtime it acts as a **static file host** for your built frontend. So the golden rule is: in dev, Tauri loads your framework's dev server (`devUrl`); in production, it serves the **static files** your framework emitted (`frontendDist`). Any framework that produces an SSR/Node server instead of static HTML/JS/CSS will not work in the bundle. Distilled from https://v2.tauri.app/start/frontend/ and its per-framework subpages.

## When to Use This Skill

- Setting up `tauri.conf.json`'s `build` section for a new or existing frontend
- A blank window or "failed to connect" in `tauri dev` (wrong `devUrl`/port)
- A production build that shows nothing or 404s (frontend emitted SSR, not static)
- Switching a Next.js/Nuxt/SvelteKit app from SSR to static export for Tauri
- Adding a Rust frontend (Trunk/Leptos) to a Tauri app

## The build Section

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",     // starts the framework dev server
    "devUrl": "http://localhost:1420",     // where Tauri loads the UI in dev
    "beforeBuildCommand": "npm run build", // produces the static output
    "frontendDist": "../dist"              // folder of static files for prod
  }
}
```

- **`devUrl`** — the dev server URL Tauri opens during `tauri dev`. Must match the port the framework actually serves on.
- **`frontendDist`** — path (relative to `tauri.conf.json` in `src-tauri/`) to the directory of built static assets used in `tauri build`. It must contain an `index.html`.
- **`beforeDevCommand` / `beforeBuildCommand`** — run automatically before dev/build; leave empty to manage the frontend yourself.

## The #1 Footgun: SSR Server vs Static Output

Tauri serves files, not a running Node server. `next dev`/`next start`, SvelteKit's `adapter-node`, or Nuxt's default SSR mode all expect a live server — that server is **not** in the bundle, so production renders nothing.

> ❌ **DON'T** point `frontendDist` at an SSR build:
> ```json
> { "build": { "beforeBuildCommand": "next build", "frontendDist": "../.next" } }
> ```
> `.next` is a server build, not static files → blank/404 in the packaged app.
>
> ✅ **DO** configure a static export and point at its output:
> ```json
> { "build": { "beforeBuildCommand": "next build", "frontendDist": "../out" } }
> ```
> with `output: 'export'` set in `next.config.js`.

## Dev-Server Port & strictPort

Tauri must hit a known, stable port. Pin the framework dev server to a fixed port and fail (don't auto-increment) if it's taken, so `devUrl` always matches. For Vite:

```js
// vite.config.js
export default {
  clearScreen: false,
  server: { port: 1420, strictPort: true },
};
```

> ❌ **DON'T** leave auto-port-increment on — if 1420 is busy the server moves to 1421 while `devUrl` still says 1420, and the window stays blank.
> ✅ **DO** set `strictPort: true` (or the framework's equivalent) so a busy port fails loudly instead of drifting.

## Per-Framework Setup

### Vite (recommended baseline)

```json
{ "build": {
  "beforeDevCommand": "npm run dev",
  "devUrl": "http://localhost:1420",
  "beforeBuildCommand": "npm run build",
  "frontendDist": "../dist"
} }
```

`vite build` already emits static files. Pin port 1420 with `strictPort` as above.

### Next.js (static export)

`next.config.js`:

```js
const nextConfig = {
  output: 'export',          // emit static HTML/JS to ./out
  images: { unoptimized: true }, // the Image optimizer needs a server
};
module.exports = nextConfig;
```

```json
{ "build": {
  "beforeDevCommand": "npm run dev",
  "devUrl": "http://localhost:3000",
  "beforeBuildCommand": "npm run build",
  "frontendDist": "../out"
} }
```

Avoid Next features that require a server (Route Handlers, server actions, on-demand ISR) — they don't run in a static export.

### SvelteKit (adapter-static)

Install `@sveltejs/adapter-static` and disable SSR globally:

```js
// svelte.config.js
import adapter from '@sveltejs/adapter-static';
export default { kit: { adapter: adapter() } };
```

```js
// src/routes/+layout.ts
export const prerender = true;
export const ssr = false;
```

```json
{ "build": {
  "beforeDevCommand": "npm run dev",
  "devUrl": "http://localhost:1420",
  "beforeBuildCommand": "npm run build",
  "frontendDist": "../build"
} }
```

### Nuxt

`nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  ssr: false,            // SPA / static mode
  devServer: { port: 3000 },
});
```

```json
{ "build": {
  "beforeDevCommand": "npm run dev",
  "devUrl": "http://localhost:3000",
  "beforeBuildCommand": "npm run generate",
  "frontendDist": "../.output/public"
} }
```

`nuxt generate` produces the static site under `.output/public`.

### Rust frontend (Trunk / Leptos)

`Trunk.toml` — pin the serve port so it matches `devUrl`:

```toml
[serve]
port = 1420
```

```json
{ "build": {
  "beforeDevCommand": "trunk serve",
  "devUrl": "http://localhost:1420",
  "beforeBuildCommand": "trunk build",
  "frontendDist": "../dist"
} }
```

Trunk emits static WASM/JS/HTML to `dist`. For Leptos, use its client-side/CSR setup (not the SSR/Axum server template) when targeting Tauri.

## Validation Checklist

- [ ] `frontendDist` points at a directory of **static** files containing `index.html` (not an SSR/server build dir)
- [ ] `devUrl` port matches the framework dev server's actual port
- [ ] Dev server uses a fixed port with strict/no-auto-increment behavior
- [ ] Next.js sets `output: 'export'`; Nuxt sets `ssr: false` (+ `nuxt generate`); SvelteKit uses `adapter-static` + `prerender`/`ssr:false`
- [ ] No server-only features (server routes/actions, SSR-only data) are relied on at runtime
- [ ] `tauri build` produces a packaged app that renders the same as `tauri dev`
