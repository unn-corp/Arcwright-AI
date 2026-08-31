---
description: Run a command with elevated Windows privileges using gsudo — works from WSL2, Git Bash, or native Windows
---

# /gsudo — Run Command with Elevated Privileges

Load the `gsudo` skill and run a command with elevated Windows permissions. Use this when:

- `git` fails with "permission denied" on files Windows has locked
- PowerShell commands fail with UAC prompts
- `playwright-cli` needs elevated install permissions
- Any shell command hits a Windows permissions wall

## Instructions

### Step 1: Load the gsudo skill

Read `.agents/skills/gsudo/SKILL.md` for full reference on gsudo usage, environment detection, and install instructions.

### Step 2: Detect environment

Verify you're on Windows (WSL2 / Git Bash / MSYS2 / native):

```bash
[ "$OS" = "Windows_NT" ] && echo "windows"
uname -s | grep -qE "MINGW|MSYS|CYGWIN" && echo "windows-shell"
grep -qi microsoft /proc/version 2>/dev/null && echo "wsl2"
```

If none match, stop — gsudo is Windows-only.

### Step 3: Verify gsudo is installed

```bash
gsudo --version 2>/dev/null
```

If exit code is non-zero, install it first:

```bash
# winget (recommended)
winget install gerardog.gsudo

# OR scoop
scoop install gsudo

# OR chocolatey
choco install gsudo
```

### Step 4: Run the elevated command

Prefix the command with `gsudo`:

```bash
gsudo <command>
```

**WSL2 note:** You may need to invoke via `gsudo.exe` and use Windows paths. See the skill file for WSL-specific patterns.

### Step 5: Report outcome

Confirm the command ran successfully, or explain why it failed (UAC denied, not Windows, gsudo not installed).

## Arguments

`$ARGUMENTS` — the command to run elevated. If empty, ask the user what they need to run.
