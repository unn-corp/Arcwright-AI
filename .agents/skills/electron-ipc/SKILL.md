---
name: electron-ipc
description: >
  Design safe inter-process communication in Electron: expose a narrow, typed API from
  preload via contextBridge, choose invoke/handle (two-way) vs send/on (one-way), never
  leak raw ipcRenderer, and validate the sender of every main-process handler.
  USE FOR: building or reviewing the preload bridge, adding an ipcMain handler, deciding
  between invoke/handle and send/on, exposing main-process capability to the renderer,
  passing data between processes.
  DO NOT USE FOR: BrowserWindow webPreferences hardening or CSP (see electron-security),
  or non-IPC app architecture.
---

# Electron IPC

The renderer is untrusted; the main process is trusted. IPC is the gate between them, and
the preload script defines exactly how wide that gate opens. The goal: expose the
**smallest possible set of named, validated operations** — never a generic message pipe,
never `ipcRenderer` itself.

This assumes `contextIsolation: true` (the default and required posture — see
`electron-security`). With it on, you cannot just assign to `window`; you must use
`contextBridge`.

## When to Use This Skill

- Writing a `preload.js` that exposes capability to the page
- Adding a new `ipcMain.handle` / `ipcMain.on` handler
- Reviewing IPC surface for over-exposure or missing validation
- Deciding the communication pattern for a renderer→main request
- Sending main→renderer push events

## Choose the Right Pattern

| Pattern | Direction | Returns a value? | Use for |
|---------|-----------|------------------|---------|
| `ipcRenderer.invoke` / `ipcMain.handle` | renderer → main | Yes (Promise) | Requests that need a result: read file, query DB, run a dialog |
| `ipcRenderer.send` / `ipcMain.on` | renderer → main | No | Fire-and-forget signals: log, telemetry, "window ready" |
| `webContents.send` / `ipcRenderer.on` | main → renderer | No | Push events: progress, menu actions, update-available |

Prefer `invoke`/`handle` for anything request/response. Don't fake it with a `send` plus
a reply event — that's what `invoke` is for.

## Expose a Narrow Typed API (preload)

```js
// preload.js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  // Two-way request/response
  readConfig: () => ipcRenderer.invoke('config:read'),
  saveNote: (note) => ipcRenderer.invoke('note:save', note),

  // One-way signal
  reportReady: () => ipcRenderer.send('window:ready'),

  // Main → renderer subscription. Wrap the listener so the page never
  // receives the IpcRendererEvent (which exposes the sender).
  onProgress: (callback) => {
    const handler = (_event, percent) => callback(percent)
    ipcRenderer.on('job:progress', handler)
    return () => ipcRenderer.removeListener('job:progress', handler) // unsubscribe
  },
})
```

```js
// ❌ NEVER expose ipcRenderer or any send/on directly — this hands the page
// the ability to message ANY channel and to read the event/sender object.
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer,                                  // total break of the boundary
  send: (channel, data) => ipcRenderer.send(channel, data), // arbitrary channel — also bad
  on: (channel, fn) => ipcRenderer.on(channel, fn),
})
```

Rules:
- ✅ Expose **named functions** bound to **fixed channel strings**.
- ❌ **NEVER** let the renderer choose the channel name.
- ❌ **NEVER** forward the raw `IpcRendererEvent` to a renderer callback — strip it.
- ✅ Return an **unsubscribe function** from any `on` wrapper to prevent leaks.

## Renderer Usage

```js
// renderer.js — only sees the curated `window.api`
const cfg = await window.api.readConfig()
await window.api.saveNote({ title: 'Hi', body: 'There' })

const stop = window.api.onProgress((pct) => updateBar(pct))
// later: stop()
```

## Handle and Validate in Main

Every handler must validate its arguments **and** the sender. A handler is a trust
boundary; treat its inputs as hostile.

```js
// main.js
const { ipcMain } = require('electron')

const ALLOWED = new Set(['file:///app/index.html'])

function isTrustedSender(event) {
  // event.senderFrame can be null if the frame was destroyed
  const url = event.senderFrame?.url
  return url != null && ALLOWED.has(new URL(url).href)
}

ipcMain.handle('note:save', async (event, note) => {
  if (!isTrustedSender(event)) throw new Error('Untrusted sender')

  // Validate shape — never trust the renderer's payload
  if (typeof note !== 'object' || note === null) throw new Error('Bad payload')
  const title = String(note.title ?? '').slice(0, 200)
  const body = String(note.body ?? '').slice(0, 100_000)

  return await db.saveNote({ title, body })
})

ipcMain.on('window:ready', (event) => {
  if (!isTrustedSender(event)) return
  // ... no return value for `.on`
})
```

- ✅ Check `event.senderFrame` (its `url`/`origin`) before acting — IPC can originate
  from any frame, including a subframe that loaded remote content.
- ✅ Validate type, shape, and bounds of every argument.
- ❌ **NEVER** pass a renderer string straight into `fs`, `shell.openExternal`, SQL, or
  `child_process` without validation.
- ✅ Throw inside `handle` to reject — the renderer's `await` rejects cleanly.

## Typing the Bridge (TypeScript)

Declare the exposed surface so renderer code is type-checked.

```ts
// global.d.ts
export interface Api {
  readConfig(): Promise<Config>
  saveNote(note: { title: string; body: string }): Promise<{ id: string }>
  reportReady(): void
  onProgress(cb: (percent: number) => void): () => void
}
declare global {
  interface Window { api: Api }
}
```

## MessagePorts — Direct, High-Throughput Channels

`invoke`/`handle` routes every call through the main process. That's the right default,
but for **high-frequency or high-volume** traffic — or to wire two renderers (or a
renderer and a Web Worker) directly together — main becomes a needless relay. Electron
exposes the web [Channel Messaging API](https://developer.mozilla.org/docs/Web/API/Channel_Messaging_API):
a `MessagePort` pair where the two ends talk **directly**, off the main-process critical
path once the connection is set up.

Use `MessageChannelMain` in the main process to create the pair, then hand one port to a
renderer. `MessagePortMain` is the main-process counterpart to the renderer's DOM
`MessagePort`.

**Reach for a MessagePort when:**
- A channel is hot (streaming progress, telemetry, a data feed) and `invoke` overhead or
  main-process scheduling shows up in profiles.
- Two renderers — or a renderer and a worker — need to exchange data without main
  marshalling every message.
- You want to bound a capability to exactly one window by handing it a single port, rather
  than exposing a globally-listenable `ipcMain` channel.

Keep `invoke`/`handle` for ordinary request/response — ports cost setup and lifecycle
management; don't reach for them unless the traffic pattern justifies it.

### Main → renderer: hand over one end

Ports cannot be sent over `contextBridge`, but they **can** be transferred over IPC via
the `transfer` list of `webContents.postMessage`. Create the pair in main, keep `port1`,
ship `port2` to the renderer:

```js
// main.js
const { MessageChannelMain } = require('electron')

const { port1, port2 } = new MessageChannelMain()

// Keep port1 in main; transfer port2 to the renderer (3rd arg = transfer list).
win.webContents.postMessage('port:give', null, [port2])

// Talk on the main-process end. MessagePortMain must be started explicitly.
port1.postMessage({ hello: 'renderer' })
port1.on('message', (event) => {
  console.log('from renderer:', event.data)
})
port1.start()   // required before 'message' events flow
```

```js
// preload.js — receive the transferred port and expose it narrowly
const { contextBridge, ipcRenderer } = require('electron')

ipcRenderer.on('port:give', (event) => {
  // The transferred MessagePort arrives on event.ports
  const [port] = event.ports
  // Hand the page a curated wrapper, not the raw IPC surface
  contextBridge.exposeInMainWorld('feed', {
    onMessage: (cb) => { port.onmessage = (e) => cb(e.data) },
    send: (data) => port.postMessage(data),
    start: () => port.start(),
  })
})
```

```js
// renderer.js — direct channel to main, no invoke round-trips
window.feed.onMessage((data) => render(data))
window.feed.start()
window.feed.send({ ack: true })
```

### Renderer ↔ renderer / renderer ↔ worker

Create the pair in main and transfer **one port to each** renderer; from then on the two
pages message each other directly. Or create a `MessageChannel` **inside one renderer**
(standard web API) and `postMessage` a port to a `Worker` for an off-thread channel that
never touches Electron IPC at all.

### Lifecycle and rules

- ✅ A `MessagePortMain` does not deliver `message` events until you call `.start()` (or
  assign `.onmessage`, which auto-starts). Forgetting `start()` is the #1 "ports silently
  do nothing" bug.
- ✅ Transfer ports via the **third argument** of `webContents.postMessage` /
  `ipcRenderer.postMessage`, not by serializing them — ports are `Transferable`, not
  cloneable.
- ✅ `close()` a port when done; a window that's destroyed drops its end. Handle the peer
  going away.
- ❌ **NEVER** expose a raw transferred `MessagePort` to the page — wrap it the same way
  you wrap `ipcRenderer` listeners (strip events, curate methods, fixed semantics).
- ✅ Treat data arriving on a port as untrusted and validate it, exactly as you would an
  `ipcMain` payload.

## Validation Checklist

- [ ] Preload exposes named functions on fixed channels — not `ipcRenderer`
- [ ] Renderer cannot supply arbitrary channel names
- [ ] `on` wrappers strip the event object and return an unsubscribe function
- [ ] Every `handle`/`on` validates `event.senderFrame`
- [ ] Every payload is type/shape/bounds checked before use
- [ ] Two-way calls use `invoke`/`handle`; fire-and-forget uses `send`/`on`
- [ ] No renderer input reaches `fs`, `shell`, `child_process`, or SQL unsanitized
- [ ] MessagePorts used only for hot/high-volume or direct renderer↔renderer/worker traffic; transferred via the `postMessage` transfer list, `.start()`ed, wrapped (never exposed raw), and their payloads validated
