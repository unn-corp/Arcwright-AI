'use strict';
/**
 * @devo-bmad-custom/tmux — lib/installer.js
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

  console.log(chalk.bold('Step 1 — Prerequisites'));
  console.log(chalk.dim('  tmux runs in WSL2 (Ubuntu). You need these before continuing:\n'));
  console.log('  ' + chalk.white('① WSL2 + Ubuntu') + chalk.dim(' — in PowerShell (Admin): ') + chalk.cyan('wsl --install'));
  console.log('  ' + chalk.white('② Update packages') + chalk.dim(' — in Ubuntu: ') + chalk.cyan('sudo apt-get update && sudo apt-get upgrade -y'));
  console.log('  ' + chalk.white('③ Install tmux 3.4+') + chalk.dim(' — ') + chalk.cyan('sudo apt-get install -y tmux'));
  console.log('  ' + chalk.white('④ Clipboard + image tools') + chalk.dim(' — ') + chalk.cyan('sudo apt-get install -y wl-clipboard imagemagick wslu'));
  console.log('  ' + chalk.white('⑤ NVM + Node') + chalk.dim(' (for MCP servers) — ') + chalk.cyan('curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && source ~/.bashrc && nvm install --lts'));
  console.log('  ' + chalk.white('⑥ Docker Desktop WSL integration') + chalk.dim(' — Docker Desktop → Settings → Resources → WSL Integration → toggle Ubuntu → Apply & Restart'));

  console.log('\n' + chalk.dim('  These require sudo/GUI and must be done manually. Press Enter when WSL2 is ready.'));
  await ask(chalk.yellow('  Press Enter to continue → '));

  // ── Paths ───────────────────────────────────────────────────────────────────
  const homeDir   = os.homedir();
  const tmuxBin   = path.join(homeDir, '.config', 'tmux', 'bin');
  const tmuxConf  = path.join(homeDir, '.tmux.conf');
  const colorsConf = path.join(homeDir, '.config', 'tmux', 'colors.conf');
  const xclipPath  = path.join(homeDir, '.local', 'bin', 'xclip');
  const xdgOpenPath = path.join(homeDir, '.local', 'bin', 'xdg-open');
  const tpmPath    = path.join(homeDir, '.tmux', 'plugins', 'tpm');

  const tmuxSrc = path.join(SRC_DIR, 'tmux');
  if (!await fs.pathExists(tmuxSrc)) {
    console.log(chalk.red('\n  ✗  tmux source files not found in package. Try reinstalling: npx @devo-bmad-custom/tmux@latest'));
    rl.close();
    return;
  }

  await fs.ensureDir(tmuxBin);
  await fs.ensureDir(path.join(homeDir, '.local', 'bin'));
  await fs.ensureDir(path.join(homeDir, '.tmux', 'plugins'));

  console.log('\n' + chalk.bold('Step 2 — Writing config files'));

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

  // Copy reference doc to project
  const tmuxSetupSrc = path.join(tmuxSrc, 'tmux-setup.md');
  if (await fs.pathExists(tmuxSetupSrc) && projectRoot) {
    const refDocDest = path.join(projectRoot, 'docs', 'dev', 'tmux', 'README.md');
    await fs.ensureDir(path.dirname(refDocDest));
    await fs.copy(tmuxSetupSrc, refDocDest, { overwrite: true });
    console.log(chalk.green(`  ✓ ${refDocDest} (reference doc)`));
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

  console.log('\n' + chalk.bold('Step 3 — TPM (tmux Plugin Manager)'));
  if (await fs.pathExists(tpmPath)) {
    console.log(chalk.dim('  ✓ TPM already installed at ~/.tmux/plugins/tpm'));
  } else {
    console.log(chalk.dim('  TPM not found. Install it:'));
    console.log('  ' + chalk.cyan('git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm'));
    console.log(chalk.dim('  Then start tmux and press Ctrl+B I to install plugins.'));
  }

  console.log('\n' + chalk.bold('Step 4 — Nerd Fonts (required for status bar icons)'));
  console.log(chalk.dim('  Download JetBrainsMono NFM from https://www.nerdfonts.com/'));
  console.log(chalk.dim('  Install JetBrainsMonoNerdFontMono-Regular.ttf to Windows (double-click → Install for all users)'));
  console.log(chalk.dim('  Set your terminal font:'));
  console.log('  ' + chalk.white('Cursor/VS Code') + ' → ' + chalk.cyan('"terminal.integrated.fontFamily": "JetBrainsMono NFM"'));
  console.log('  ' + chalk.white('Windows Terminal') + ' → ' + chalk.cyan('"font": { "face": "JetBrainsMono NFM", "builtinGlyphs": false }'));

  console.log('\n' + chalk.bold('Step 5 — fzf (Actions menu)'));
  console.log('  ' + chalk.cyan('mkdir -p ~/.local/bin && curl -Lo /tmp/fzf.tar.gz https://github.com/junegunn/fzf/releases/download/v0.54.3/fzf-0.54.3-linux_amd64.tar.gz && tar -xzf /tmp/fzf.tar.gz -C ~/.local/bin'));

  console.log('\n' + chalk.bold('Step 6 — Shell aliases'));
  const bashrc = path.join(homeDir, '.bashrc');
  const resolvedRoot = path.resolve(projectRoot);
  const squidAlias       = `alias squid='tmux new-session -c ${resolvedRoot}'`;
  const squidClaudeAlias = `alias squid-claude='tmux new-session -c ${resolvedRoot} "claude --dangerously-skip-permissions"'`;

  let bashrcContent = '';
  if (await fs.pathExists(bashrc)) bashrcContent = await fs.readFile(bashrc, 'utf8');

  const aliasBlock = `\n# BMAD tmux shortcuts\n${squidAlias}\n${squidClaudeAlias}\n`;
  if (!bashrcContent.includes('squid-claude')) {
    const addAliases = await ask(chalk.yellow(`  Add 'squid' and 'squid-claude' aliases to ~/.bashrc? (Y/n): `));
    if (!addAliases.toLowerCase().startsWith('n')) {
      await fs.appendFile(bashrc, aliasBlock, 'utf8');
      console.log(chalk.green('  ✓ Aliases added to ~/.bashrc'));
      console.log(chalk.dim('  Run: source ~/.bashrc'));
    }
  } else {
    console.log(chalk.dim('  ○ Aliases already in ~/.bashrc'));
  }

  console.log('\n' + chalk.bold.green('✓ tmux setup complete!'));
  console.log(chalk.dim('  Start a session: ') + chalk.cyan('squid'));
  console.log(chalk.dim('  Launch Claude:   ') + chalk.cyan('squid-claude'));
  if (projectRoot) console.log(chalk.dim('  Full docs:       ') + chalk.cyan('docs/dev/tmux/README.md'));
  console.log('');

  rl.close();
}

module.exports = { setupTmux };
