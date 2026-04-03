---
name: "gsudo"
description: "Windows privilege escalation — run git, PowerShell, and playwright-cli commands with elevated permissions using gsudo"
---

# gsudo Skill

Windows sudo equivalent. Run specific commands elevated without opening a full
Administrator terminal. Use this when a command fails with UAC or permission errors.

---

## Detection

```bash
gsudo --version 2>/dev/null
# exit 0 = available | non-zero = not installed
```

## Environment Check (Windows?)

```bash
# Method 1 — env var (WSL2, Git Bash, MSYS2)
[ "$OS" = "Windows_NT" ] && echo "windows"

# Method 2 — uname
uname -s | grep -qE "MINGW|MSYS|CYGWIN" && echo "windows"

# Method 3 — WSL2
grep -qi microsoft /proc/version 2>/dev/null && echo "wsl2"
```

---

## Install

```bash
# winget (recommended)
winget install gerardog.gsudo

# Scoop
scoop install gsudo
```

---

## When to Use

- Any command that fails with "Access denied" or UAC prompt
- Git credential manager configuration
- PowerShell execution policy changes
- Playwright / Chromium browser install
- Global npm package installs
- Any script that must write to protected Windows paths

---

## Common Commands

```bash
# Git credential manager
gsudo git credential-manager configure

# PowerShell execution policy
gsudo pwsh -Command "Set-ExecutionPolicy RemoteSigned -Scope CurrentUser"

# Playwright browser install
gsudo playwright-cli install chromium
gsudo npx playwright install chromium

# Global npm package
gsudo npm install -g <package>

# Run a PowerShell script
gsudo pwsh -File "./scripts/admin-setup.ps1"
```

---

## Credential Cache

gsudo caches the UAC approval for 5 minutes by default.

```bash
# Change cache mode
gsudo config CacheMode Auto    # cache per process tree (default)
gsudo config CacheMode Explicit  # cache until explicitly cleared
gsudo config CacheMode Disabled  # always prompt
```

---

## Fallback (gsudo not installed)

If gsudo is not available and cannot be installed, tell the user:

> "Please open Windows Terminal as Administrator and run the following command:
> `<command>`"

Do not attempt to silently skip privileged steps — they will fail downstream.
