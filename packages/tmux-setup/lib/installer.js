'use strict';
/**
 * @arcwright/tmux-setup — lib/installer.js
 * Standalone tmux setup for AI agent workflows.
 * Installs ~/.tmux.conf, scripts, TPM, and shell aliases.
 * Requires tmux 3.4+ (pane-title-changed is a window-level hook in 3.4).
 */

const fs = require('fs-extra');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'src');

async function setupTmux(projectRoot, chalk) {
  const readline = require('readline');
  const os = require('os');
  const { execSync } = require('child_process');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(res => rl.question(q, res));

  console.log('\n' + chalk.bold.cyan('━━━ tmux Setup for AI Agent Workflows ━━━'));
  console.log(chalk.dim('  Installs a full tmux config optimized for Claude Code + multi-agent pipelines.'));
  console.log(chalk.dim('  Includes: Catppuccin theme · status bar · pane title sync · clipboard · agent orchestration scripts\n'));

  // Check tmux version if already installed
  try {
    const verLine = execSync('tmux -V 2>/dev/null', { stdio: 'pipe' }).toString().trim();
    const match = verLine.match(/tmux (\d+)\.(\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major < 3 || (major === 3 && minor < 4)) {
        console.log(chalk.yellow(`  ⚠  tmux ${match[1]}.${match[2]} detected — this config requires tmux 3.4+`));
        console.log(chalk.dim('     pane-title-changed hook requires set-hook -wg (3.4 feature)'));
        console.log(chalk.dim('     Upgrade: sudo apt-get install -y tmux  (or build from source for latest)\n'));
      } else {
        console.log(chalk.green(`  ✓  tmux ${match[1]}.${match[2]} — version OK\n`));
      }
    }
  } catch { /* tmux not installed yet — skip check */ }

  // ── Step 1: Prerequisites ──────────────────────────────────────────────────
  console.log(chalk.bold('Step 1 — Prerequisites'));
  console.log('');

  console.log(chalk.bold.red('  ⛔ Must be done manually (require WSL install or sudo):'));
  console.log(chalk.dim('     These cannot be automated. Complete them before continuing.\n'));
  console.log('  ' + chalk.white('① Install WSL2 + Ubuntu') + chalk.dim(' — run in PowerShell (Admin):'));
  console.log('    ' + chalk.cyan('wsl --install'));
  console.log('  ' + chalk.white('② Update packages') + chalk.dim(' — run in Ubuntu terminal:'));
  console.log('    ' + chalk.cyan('sudo apt-get update && sudo apt-get upgrade -y'));
  console.log('  ' + chalk.white('③ Install tmux 3.4+') + chalk.dim(' — run in Ubuntu terminal:'));
  console.log('    ' + chalk.cyan('sudo apt-get install -y tmux'));
  console.log('  ' + chalk.white('④ Install clipboard + image tools') + chalk.dim(' — run in Ubuntu terminal:'));
  console.log('    ' + chalk.cyan('sudo apt-get install -y wl-clipboard imagemagick wslu'));
  console.log('  ' + chalk.white('⑤ Docker Desktop WSL integration') + chalk.dim(' — GUI only:'));
  console.log('    ' + chalk.dim('Docker Desktop → Settings → Resources → WSL Integration → toggle Ubuntu → Apply & Restart'));

  console.log('');
  console.log(chalk.bold.yellow('  ✦ Can be done manually OR by an AI with relaxed permissions:'));
  console.log(chalk.dim('     These are safe to automate — no sudo or system-level access needed.\n'));
  console.log('  ' + chalk.white('⑥ NVM + Node') + chalk.dim(' (required for Node-based MCP servers):'));
  console.log('    ' + chalk.cyan('curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash'));
  console.log('    ' + chalk.cyan('source ~/.bashrc && nvm install --lts'));
  console.log('  ' + chalk.white('⑦ TPM (tmux Plugin Manager):'));
  console.log('    ' + chalk.cyan('git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm'));
  console.log('    ' + chalk.dim('    Then inside tmux: press Ctrl+B I to install plugins'));
  console.log('  ' + chalk.white('⑧ fzf') + chalk.dim(' (required for Actions popup menu):'));
  console.log('    ' + chalk.cyan('mkdir -p ~/.local/bin && curl -Lo /tmp/fzf.tar.gz https://github.com/junegunn/fzf/releases/download/v0.54.3/fzf-0.54.3-linux_amd64.tar.gz && tar -xzf /tmp/fzf.tar.gz -C ~/.local/bin'));
  console.log('  ' + chalk.white('⑨ Nerd Fonts') + chalk.dim(' (required for Powerline status bar separators):'));
  console.log('    ' + chalk.dim('    Download JetBrainsMono NFM from https://www.nerdfonts.com/'));
  console.log('    ' + chalk.dim('    Install JetBrainsMonoNerdFontMono-Regular.ttf to Windows (double-click → Install for all users)'));
  console.log('    ' + chalk.white('    Cursor/VS Code:') + ' ' + chalk.cyan('"terminal.integrated.fontFamily": "JetBrainsMono NFM"'));
  console.log('    ' + chalk.white('    Windows Terminal:') + ' ' + chalk.cyan('"font": { "face": "JetBrainsMono NFM", "builtinGlyphs": false }'));
  console.log('  ' + chalk.white('⑩ GitHub CLI (gh)') + chalk.dim(' (required for PR creation and GitHub operations):'));
  console.log('    ' + chalk.cyan('curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg'));
  console.log('    ' + chalk.cyan('echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list'));
  console.log('    ' + chalk.cyan('sudo apt update && sudo apt install gh -y'));
  console.log('    ' + chalk.dim('    Then authenticate: gh auth login'));

  console.log('\n' + chalk.dim('  Complete the manual steps above, then press Enter to continue with config file installation.'));
  await ask(chalk.yellow('  Press Enter to continue → '));

  // ── Paths ───────────────────────────────────────────────────────────────────
  const homeDir    = os.homedir();
  const tmuxBin    = path.join(homeDir, '.config', 'tmux', 'bin');
  const tmuxConf   = path.join(homeDir, '.tmux.conf');
  const colorsConf = path.join(homeDir, '.config', 'tmux', 'colors.conf');
  const xclipPath  = path.join(homeDir, '.local', 'bin', 'xclip');
  const xdgOpenPath = path.join(homeDir, '.local', 'bin', 'xdg-open');
  const tpmPath    = path.join(homeDir, '.tmux', 'plugins', 'tpm');

  const tmuxSrc = path.join(SRC_DIR, 'tmux');
  if (!await fs.pathExists(tmuxSrc)) {
    console.log(chalk.red('\n  ✗  tmux source files not found in package. Try reinstalling: npx @arcwright/tmux-setup@latest'));
    rl.close();
    return;
  }

  await fs.ensureDir(tmuxBin);
  await fs.ensureDir(path.join(homeDir, '.local', 'bin'));
  await fs.ensureDir(path.join(homeDir, '.tmux', 'plugins'));

  // ── Step 2: Shell aliases ──────────────────────────────────────────────────
  console.log('\n' + chalk.bold('Step 2 — Shell aliases'));
  const bashrc = path.join(homeDir, '.bashrc');
  const resolvedRoot = path.resolve(projectRoot || process.cwd());
  const tmuxAlias = `alias tmux-ai='tmux new-session -c ${resolvedRoot}'`;
  const tmuxClaudeAlias = `alias tmux-claude='tmux new-session -c ${resolvedRoot} "claude --dangerously-skip-permissions"'`;

  let bashrcContent = '';
  if (await fs.pathExists(bashrc)) bashrcContent = await fs.readFile(bashrc, 'utf8');

  const aliasBlock = `\n# Arcwright tmux shortcuts\n${tmuxAlias}\n${tmuxClaudeAlias}\n`;
  if (!bashrcContent.includes('tmux-claude')) {
    const addAliases = await ask(chalk.yellow(`  Add 'tmux-ai' and 'tmux-claude' aliases to ~/.bashrc? (Y/n): `));
    if (!addAliases.toLowerCase().startsWith('n')) {
      await fs.appendFile(bashrc, aliasBlock, 'utf8');
      console.log(chalk.green('  ✓ Aliases added to ~/.bashrc'));
      console.log(chalk.dim('  Run: source ~/.bashrc'));
    }
  } else {
    console.log(chalk.dim('  ○ Aliases already in ~/.bashrc'));
  }

  // xdg-open → wslview symlink
  if (!await fs.pathExists(xdgOpenPath)) {
    try {
      await fs.ensureSymlink('/usr/bin/wslview', xdgOpenPath);
      console.log(chalk.green(`  ✓ ${xdgOpenPath} → /usr/bin/wslview`));
    } catch {
      console.log(chalk.dim(`  ○ Could not create xdg-open symlink (run: ln -sf /usr/bin/wslview ~/.local/bin/xdg-open)`));
    }
  } else {
    console.log(chalk.dim(`  ○ ${xdgOpenPath} already exists`));
  }

  // ── Step 3: TPM check ─────────────────────────────────────────────────────
  console.log('\n' + chalk.bold('Step 3 — TPM check'));
  if (await fs.pathExists(tpmPath)) {
    console.log(chalk.green('  ✓ TPM already installed at ~/.tmux/plugins/tpm'));
  } else {
    console.log(chalk.yellow('  ⚠  TPM not found — install it before starting tmux:'));
    console.log('  ' + chalk.cyan('git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm'));
    console.log(chalk.dim('  Then inside tmux press Ctrl+B I to install plugins.'));
  }

  // ── Step 4: Write config files (last) ─────────────────────────────────────
  console.log('\n' + chalk.bold('Step 4 — Writing config files'));
  console.log(chalk.dim('  Installing tmux.conf, scripts, and support files...\n'));

  const FILE_MAP = [
    ['tmux.conf',              tmuxConf],
    ['colors.conf',            colorsConf],
    ['dispatch.sh',            path.join(tmuxBin, 'dispatch.sh')],
    ['actions_popup.py',       path.join(tmuxBin, 'actions_popup.py')],
    ['actions_popup.sh',       path.join(tmuxBin, 'actions_popup.sh')],
    ['title_sync.sh',          path.join(tmuxBin, 'title_sync.sh')],
    ['float_term.sh',          path.join(tmuxBin, 'float_term.sh')],
    ['float_init.sh',          path.join(tmuxBin, 'float_init.sh')],
    ['open_clip.sh',           path.join(tmuxBin, 'open_clip.sh')],
    ['paste_image_wrapper.sh', path.join(tmuxBin, 'paste_image_wrapper.sh')],
    ['paste_clipboard.sh',     path.join(tmuxBin, 'paste_clipboard.sh')],
    ['cpu_usage.sh',           path.join(tmuxBin, 'cpu_usage.sh')],
    ['ram_usage.sh',           path.join(tmuxBin, 'ram_usage.sh')],
    ['claude_usage.sh',        path.join(tmuxBin, 'claude_usage.sh')],
    ['watch-sync.sh',          path.join(tmuxBin, 'watch-sync.sh')],
    ['xclip',                  xclipPath],
  ];

  for (const [srcName, dest] of FILE_MAP) {
    const src = path.join(tmuxSrc, srcName);
    if (!await fs.pathExists(src)) continue;

    const exists = await fs.pathExists(dest);
    if (exists) {
      const overwrite = await ask(chalk.dim(`  ${dest} already exists. Overwrite? (y/N): `));
      if (!overwrite.toLowerCase().startsWith('y')) {
        console.log(chalk.dim(`  ○ Skipped ${path.basename(dest)}`));
        continue;
      }
    }

    await fs.copy(src, dest, { overwrite: true });
    if (dest.endsWith('.sh') || dest.endsWith('.py') || dest === xclipPath) {
      try { await fs.chmod(dest, 0o755); } catch {}
    }
    console.log(chalk.green(`  ✓ ${dest}`));
  }

  // Copy reference doc alongside project if a root was given
  const tmuxSetupSrc = path.join(tmuxSrc, 'tmux-setup.md');
  if (await fs.pathExists(tmuxSetupSrc) && projectRoot) {
    const refDocDest = path.join(resolvedRoot, 'docs', 'dev', 'tmux', 'README.md');
    await fs.ensureDir(path.dirname(refDocDest));
    await fs.copy(tmuxSetupSrc, refDocDest, { overwrite: true });
    console.log(chalk.green(`  ✓ ${refDocDest} (reference doc)`));
  }

  // Write / merge global ~/.claude/CLAUDE.md with tmux-aware agent spawning rules
  await writeGlobalClaudeMd(chalk);

  console.log('\n' + chalk.bold.green('✓ tmux setup complete!'));
  console.log(chalk.dim('  Start tmux and press Ctrl+B I to finish TPM plugin install.'));
  console.log('');

  rl.close();
}

/**
 * Write / merge ~/.claude/CLAUDE.md with tmux-aware agent spawning section.
 * This file is loaded by Claude Code for every project automatically.
 */
async function writeGlobalClaudeMd(chalk) {
  const os = require('os');
  const globalClaudeDir = path.join(os.homedir(), '.claude');
  const globalClaudePath = path.join(globalClaudeDir, 'CLAUDE.md');
  const TMUX_MARKER = '## Agent Spawning (tmux-aware)';

  const tmuxSection = [
    '',
    '## Agent Spawning (tmux-aware)',
    '',
    'When spawning sub-agents, check whether tmux is active (`$TMUX` environment variable is set).',
    '',
    '| Situation | Method |',
    '|-----------|--------|',
    '| Task is fully autonomous — no user input or monitoring needed | **In-process** (Agent tool) |',
    '| Task benefits from user observation, may need clarification, or user said "spawn" / "open agent" | **Split pane** — new tmux pane running `claude` |',
    '',
    '**How to open a split-pane agent when tmux is active:**',
    '```bash',
    '# Vertical split (side by side) — preferred for longer tasks',
    'tmux split-window -h -c "#{pane_current_path}" "claude --dangerously-skip-permissions \'<task>\'"',
    '# Horizontal split (top/bottom) — preferred for monitoring',
    'tmux split-window -v -c "#{pane_current_path}" "claude --dangerously-skip-permissions \'<task>\'"',
    '```',
    '',
    '**Pane close sequence (mandatory):**',
    '```bash',
    '# 1. Send /exit first — lets Claude finish and save state',
    'tmux send-keys -t <pane_id> "/exit" Enter',
    '# 2. Then kill the pane',
    'tmux kill-pane -t <pane_id>',
    '```',
    '',
    '**Multi-pane layout:** Before first split, decide master position (left/right/top/bottom).',
    'Panes 2–4 stack opposite master. Panes 5+ surround on perpendicular axis.',
    '',
    '**Agent orchestration:** Coordinate agents via session files at',
    '`.agents/orchestration/session-YYYYMMDD-HHMMSS-XXXX.md`.',
    'Never route by reading pane titles — use the session file Active Agents table.',
    'Always append `Enter` to every `tmux send-keys` call.',
    '',
  ].join('\n');

  await fs.ensureDir(globalClaudeDir);

  // Migrate: strip old markerless tmux section left by pre-1.0.19 installers
  await migrateOldClaudeMd(globalClaudePath);

  const START = '<!-- arcwright-tmux-start -->';
  const END   = '<!-- arcwright-tmux-end -->';
  const block = `${START}\n${tmuxSection}\n${END}`;

  const result = await upsertManagedBlock(globalClaudePath, START, END, tmuxSection);
  if (result === 'updated') {
    console.log(chalk.green('  ✓ ~/.claude/CLAUDE.md (global) updated (old tmux block replaced)'));
  } else if (result === 'appended') {
    console.log(chalk.green('  ✓ ~/.claude/CLAUDE.md (global) updated with tmux agent rules'));
  } else {
    console.log(chalk.green('  ✓ ~/.claude/CLAUDE.md (global) created with tmux agent rules'));
  }
}

/**
 * One-time migration: strip old markerless BMAD/tmux sections from pre-1.0.19 installers.
 */
async function migrateOldClaudeMd(filePath) {
  if (!await fs.pathExists(filePath)) return;
  const content = await fs.readFile(filePath, 'utf8');
  if (content.includes('<!-- arcwright-tmux-start -->')) return;

  const OLD_MARKER = '## Agent Spawning (tmux-aware)';
  const idx = content.indexOf(OLD_MARKER);
  if (idx === -1) return;

  const rest = content.slice(idx + OLD_MARKER.length);
  const nextHeading = rest.search(/\n## /);
  const end = nextHeading === -1 ? content.length : idx + OLD_MARKER.length + nextHeading;
  const cleaned = (content.slice(0, idx) + content.slice(end)).trimStart();
  await fs.writeFile(filePath, cleaned, 'utf8');
}

/**
 * Upsert a managed block in a file using start/end markers.
 * - File missing: create with block
 * - Markers absent: append block
 * - Markers present: replace content between them (removes stale content)
 */
async function upsertManagedBlock(filePath, startMarker, endMarker, content) {
  await fs.ensureDir(path.dirname(filePath));
  const block = `${startMarker}\n${content}\n${endMarker}`;
  if (await fs.pathExists(filePath)) {
    const existing = await fs.readFile(filePath, 'utf8');
    const startIdx = existing.indexOf(startMarker);
    const endIdx   = existing.indexOf(endMarker);
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const updated = existing.slice(0, startIdx) + block + existing.slice(endIdx + endMarker.length);
      await fs.writeFile(filePath, updated, 'utf8');
      return 'updated';
    }
    await fs.writeFile(filePath, existing.trimEnd() + '\n\n' + block + '\n', 'utf8');
    return 'appended';
  }
  await fs.writeFile(filePath, block + '\n', 'utf8');
  return 'created';
}

module.exports = { setupTmux };
