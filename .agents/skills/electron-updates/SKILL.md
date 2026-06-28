---
name: electron-updates
description: >
  Ship automatic updates for Electron apps: the built-in autoUpdater, the
  update-electron-app helper (Squirrel + the free update.electronjs.org service), or
  electron-builder's electron-updater, plus signed/staged update channels.
  USE FOR: adding auto-update to a packaged app, choosing an update mechanism, wiring an
  update feed/server, configuring update channels, handling update lifecycle events.
  DO NOT USE FOR: producing the installers themselves (see electron-packaging) or
  general security config (see electron-security).
---

# Electron Auto-Updates

Auto-update keeps a fielded Electron app current — critical because Electron security
fixes track Chromium. The mechanism you pick depends on how you packaged (`Forge`/Squirrel
vs `electron-builder`). **Updates only work on signed, packaged builds**, and only on
macOS/Windows for the built-in `autoUpdater` (Linux relies on its package managers /
AppImage updaters).

## When to Use This Skill

- Adding automatic updates to a packaged app
- Choosing among `autoUpdater`, `update-electron-app`, and `electron-updater`
- Pointing the app at an update feed or release host
- Setting up stable vs beta channels
- Handling the download/ready/restart lifecycle

## Pick a Mechanism

| Option | Pairs with | Feed / host | Effort |
|--------|-----------|-------------|--------|
| **`update-electron-app`** | Forge / Squirrel | GitHub Releases via free `update.electronjs.org` | Lowest |
| **`autoUpdater` (built-in)** | Forge / Squirrel | Your own Squirrel feed | Medium |
| **`electron-updater`** | electron-builder | GitHub, S3, generic HTTPS | Medium, most flexible |

Don't mix `electron-updater` with the built-in `autoUpdater` — choose one.

## Easiest Path: `update-electron-app`

If you publish to **public GitHub Releases** and packaged with Forge, this is a few lines.
It wraps the built-in `autoUpdater` and the hosted `update.electronjs.org` feed.

```js
// main.js — call once, after the app is packaged & signed
const { updateElectronApp } = require('update-electron-app')

updateElectronApp({
  repo: 'arcwright/my-app',          // owner/repo on GitHub
  updateInterval: '1 hour',          // minimum 5 minutes
  notifyUser: true,                  // shows the built-in restart prompt
})
```

It silently no-ops in development and on unsigned builds. That's expected.

## Built-in `autoUpdater` (manual control)

Use directly when you host your own Squirrel feed or want to drive the UI yourself.

```js
const { autoUpdater, dialog } = require('electron')

autoUpdater.setFeedURL({ url: 'https://updates.example.com/win32/x64' })

autoUpdater.on('error', (err) => console.error('update error', err))
autoUpdater.on('update-available', () => console.log('downloading update...'))

autoUpdater.on('update-downloaded', async (_e, _notes, version) => {
  const { response } = await dialog.showMessageBox({
    type: 'info',
    buttons: ['Restart', 'Later'],
    message: `Version ${version} is ready. Restart to apply?`,
  })
  if (response === 0) autoUpdater.quitAndInstall()
})

// Poll on an interval — don't check more than ~once every few minutes
setInterval(() => autoUpdater.checkForUpdates(), 60 * 60 * 1000)
```

- ✅ Only `quitAndInstall()` after the `update-downloaded` event has fired.
- ✅ Always attach an `error` handler — an unhandled updater error can surface as a dialog.

## electron-builder: `electron-updater`

If you packaged with electron-builder, use its companion package. It reads the
`latest.yml`/`latest-mac.yml` metadata electron-builder publishes alongside artifacts and
verifies them.

```js
const { autoUpdater } = require('electron-updater')

autoUpdater.on('update-downloaded', () => autoUpdater.quitAndInstall())
autoUpdater.checkForUpdatesAndNotify()
```

```jsonc
// package.json — the publish target also becomes the update feed
{
  "build": {
    "publish": [{ "provider": "github", "owner": "arcwright", "repo": "my-app" }]
  }
}
```

## Signed & Staged Channels

- **Signing is the security boundary.** macOS only applies an update whose signature
  matches the installed app's Developer ID; Windows verifies the Authenticode signature.
  An unsigned or mismatched update is rejected. `electron-updater` additionally supports
  publisher-name / SHA verification. ❌ **NEVER** serve updates over plain HTTP.
- **Channels** let beta users opt into pre-releases without affecting stable users. With
  `electron-updater`, set `autoUpdater.channel = 'beta'` (matched against `beta`/`alpha`
  in the published version + `*.yml` channel files). With GitHub + `update-electron-app`,
  pre-release tagged releases feed users who opted into them.
- **Staged rollouts:** electron-builder supports `stagingPercentage` in the publish
  metadata so a release reaches a fraction of users first; widen it as it proves stable.

```js
// electron-updater channel selection
autoUpdater.channel = userPrefs.betaOptIn ? 'beta' : 'latest'
autoUpdater.allowPrerelease = userPrefs.betaOptIn
```

## Validation Checklist

- [ ] One update mechanism chosen (not both autoUpdaters)
- [ ] Update logic guarded to packaged/signed builds (no-ops in dev)
- [ ] Feed/host served over HTTPS
- [ ] App is code-signed (updates won't apply otherwise)
- [ ] `error` event handled; `quitAndInstall` only after `update-downloaded`
- [ ] Channel strategy defined if you ship betas
- [ ] Linux distribution updates handled separately (package manager / AppImage)
