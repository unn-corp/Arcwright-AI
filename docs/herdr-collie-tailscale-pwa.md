# Collie: phone PWA for Herdr agents over Tailscale

Collie is a Herdr plugin that puts a phone web app in front of your Herdr agent
herd. You open a URL on your phone, see which agent is blocked, and reply with
your phone keyboard, over a Tailscale tailnet. This guide covers installation,
Tailscale Serve, and the security posture. Resolve service paths and account
identities from the host you are configuring.

Upstream: https://github.com/AltanS/collie · Herdr: https://herdr.dev

## Read this first: what Collie is

**Collie is remote shell access to your machine, by design.** One bridge call
types arbitrary keystrokes into a live terminal pane, so anyone who can reach the
URL can read every pane (source, secrets, env, agent output) and run any command
as your user. There is no sandbox and no command allow-list. Treat the URL like a
root login.

Two sharp edges:

- It acts as **you**, with your full privileges (`~/.ssh`, `git push --force`,
  `rm -rf`, `sudo`).
- Access is **device-level, not person-level**. Tailscale proves the device, not
  who is holding it. An unlocked or stolen phone, or anyone else on your tailnet,
  is an open shell.

The defenses that make it acceptable: loopback-only bind, `tailscale serve` as the
sole ingress (terminates TLS, injects the identity header), an optional
`COLLIE_TRUSTED_USER` gate, a same-origin gate, and a strict CSP. Set the trusted
user, keep it tailnet-only, and never `tailscale funnel` it.

## Prerequisites

| Tool | Why |
|------|-----|
| Bun (https://bun.sh) | Runs the bridge and builds the web UI. The only hard dependency. |
| Herdr >= 0.7.0 | The herd Collie mirrors; its CLI registers the plugin. |
| Tailscale | Sole ingress via `tailscale serve`. Your phone and host must be on the same tailnet. |
| git | Clone and update. |
| Node.js (soft) | Only to print the URL from `tailscale status`. |
| systemd --user (soft) | Supervises the bridge service; falls back to `nohup` without it. |

If Bun is installed under `~/.bun/bin`, include that directory in the service
PATH. Services running under `systemd --user` may not inherit your shell PATH;
inspect the installed units before applying the troubleshooting example below.

## Install

Run on the host, not your phone.

```bash
# 1. Install the plugin (Herdr clones + builds the PWA at install time)
herdr plugin install AltanS/collie --yes

# 2. Set the identity gate BEFORE starting, so only your tailnet login can drive agents
CFG="$(herdr plugin config-dir herdr.collie)"
printf 'COLLIE_TRUSTED_USER=%s\n' "you@example.com" > "$CFG/.env"
# Find your value with: tailscale whois <your-tailnet-ip> → User.Name

# 3. Start the bridge (systemd --user service "collie", or nohup fallback)
herdr plugin action invoke start --plugin herdr.collie
```

If the plugin build fails with `bun not found on PATH`, the Herdr server does not
see Bun. Fix the server unit's PATH (see Troubleshooting) and re-run the start
action. If `bun install` fails with a 401 against a private CodeArtifact
registry, force the public registry for the install:
`NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ herdr plugin action invoke start --plugin herdr.collie`.

## Enable Tailscale Serve

Serve is what exposes the loopback bridge to your tailnet over HTTPS. It has two
parts: a one-time per-tailnet enablement (admin console), then the per-host mapping.

1. **Enable Serve on the tailnet** (once, admin action). If Serve is not enabled,
   `tailscale serve` prints:
   `Serve is not enabled on your tailnet. To enable, visit: https://login.tailscale.com/f/serve?node=<node-id>`
   Open that URL and enable it. This is an admin-console toggle; the CLI cannot do it.

2. **Map the bridge** (the port Collie listens on is 8787 by default):

   ```bash
   tailscale serve --bg 8787
   tailscale serve status
   ```

   Expected:

   ```
   https://<host>.<tailnet>.ts.net (tailnet only)
   |-- / proxy http://127.0.0.1:8787
   ```

Collie's `start` action tries to run `tailscale serve` for you; if Serve was not
yet enabled on the tailnet, run `tailscale serve --bg 8787` again after enabling.

> **Never `tailscale funnel` Collie.** Funnel exposes it to the public internet.
> `serve` keeps it tailnet-only. There is no scenario where funneling Collie is
> correct.

## Open it on your phone

With your phone on the same tailnet, open the `https://<host>.<tailnet>.ts.net/`
URL from `tailscale serve status`, then **Add to Home Screen** to install the PWA.
Tailscale manages the TLS cert for the MagicDNS name, so nothing to obtain or renew.

The reply box is a plain text field, so your phone's own voice dictation works in
it for free.

## Web Push (optional)

Off unless you opt in. Push needs HTTPS, which the default `tailscale serve`
already provides.

```bash
cd "$(herdr plugin config-dir herdr.collie)"
bun add web-push
bunx web-push generate-vapid-keys
# set COLLIE_VAPID_PUBLIC / _PRIVATE / _SUBJECT in .env, then restart the service
bash scripts/collie-ctl.sh push-test        # verify without waiting for an agent to block
```

Collie pushes when an agent goes **blocked** or **done**; tapping the notification
opens Collie at that agent.

## Configuration reference

`.env` in `$(herdr plugin config-dir herdr.collie)`:

| Key | Default | Meaning |
|-----|---------|---------|
| `COLLIE_PORT` | 8787 | Loopback port the bridge listens on. `tailscale serve` proxies to it. |
| `COLLIE_HOST` | 127.0.0.1 | Bind host. Keep it loopback. |
| `COLLIE_TRUSTED_USER` | unset | If set, requests must carry a matching `Tailscale-User-Login` header. Set this. |
| `COLLIE_SERVE_MODE` | https | `http` only for Headscale / `.internal` domains. |
| `COLLIE_ALLOWED_ORIGINS` | unset | Set when behind a custom hostname / reverse proxy (Collie is same-origin only). |

## Teardown

```bash
herdr plugin action invoke uninstall --plugin herdr.collie   # stops + disables the service, removes the serve mapping
# or, to remove only the tailnet exposure but keep the bridge:
tailscale serve --https=443 off
```

## Troubleshooting

- **`bun not found on PATH` on start** — the `systemd --user` Herdr server does not
  inherit your shell PATH. Add Bun to the Herdr server unit and reload:
  `Environment=PATH=%h/.local/bin:%h/.bun/bin:/usr/bin:/bin` in
  `~/.config/systemd/user/herdr-server.service`, then
  `systemctl --user daemon-reload && systemctl --user restart herdr-server`.
- **Page loads but stays empty (`403 cross-origin`)** — you are reaching it via a
  hostname other than the MagicDNS name. Set `COLLIE_ALLOWED_ORIGINS` to that exact
  origin.
- **`Serve is not enabled on your tailnet`** — enable Serve at the admin URL the CLI
  prints, then re-run `tailscale serve --bg 8787`.
- **Bridge health check** — `curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8787/`
  should print `200`. Service state: `systemctl --user status collie`.
