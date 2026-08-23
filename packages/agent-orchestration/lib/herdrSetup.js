'use strict';
/**
 * herdrSetup.js — detect-only Herdr integration for Arcwright.
 *
 * Arcwright does NOT install the herdr binary (herdr owns its own update and
 * channel machinery). This module: detects herdr, installs the Claude Code
 * integration and writes a managed keybindings block into
 * ~/.config/herdr/config.toml. Third-party plugins require explicit opt-in.
 *
 * It runs during Claude/Codex installation and through `arcwright herdr`.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { upsertManagedBlock } = require('./managed-md');
const {
  installHerdrAssets,
  listClaudeProfileDirs,
  upsertTomlSetting,
  SHELL_START,
  SHELL_END,
} = require('./herdrAssets');

// TOML comment markers delimiting the Arcwright-managed keybindings block.
const KEYS_START = '# >>> arcwright-herdr-keys >>>';
const KEYS_END = '# <<< arcwright-herdr-keys <<<';

// Default plugins installed when herdr is detected. Best-effort: a plugin whose
// build tool is missing (e.g. Go for fzf-url) is skipped with a note, not fatal.
const DEFAULT_PLUGINS = [
  { repo: 'persiyanov/herdr-reviewr', id: 'persiyanov.reviewr' },
  { repo: 'smarzban/herdr-file-viewer', id: 'herdr-file-viewer' },
  { repo: 'JanTvrdik/herdr-command-palette', id: 'jt.command-palette' },
  { repo: 'lmilojevicc/herdr-tab-rename', id: 'herdr-tab-rename' },
  { repo: 'x0d7x/herdr-fzf-url', id: 'url.fzf-picker', needsBuild: 'go' },
];

// Keybindings, keyed by the plugin id they depend on. Only bindings whose plugin
// is actually installed are written, so a reload never fails on a missing action.
const KEYBINDINGS = [
  {
    id: 'jt.command-palette',
    key: 'prefix+p',
    toml: [
      '[[keys.command]]',
      'key = "prefix+p"',
      'type = "plugin_action"',
      'command = "jt.command-palette.open"',
      'description = "Command palette"',
    ],
  },
  {
    id: 'herdr-file-viewer',
    key: 'prefix+f',
    toml: [
      '[[keys.command]]',
      'key = "prefix+f"',
      'type = "shell"',
      'command = "herdr plugin action invoke open-file-viewer --plugin herdr-file-viewer"',
    ],
  },
  {
    id: 'url.fzf-picker',
    key: 'alt+u',
    toml: [
      '[[keys.command]]',
      'key = "alt+u"',
      'type = "plugin_action"',
      'command = "url.fzf-picker.pick-url"',
    ],
  },
];

// Keys already declared OUTSIDE the Arcwright-managed block in config.toml.
// Writing a second [[keys.command]] for one of these makes herdr's reload go
// `partial` (it keeps the first, disables ours) and spams duplicate-key warnings
// forever, so the managed block must skip any key the user already bound by hand.
function existingKeysOutsideBlock(configPath) {
  let text;
  try {
    text = fs.readFileSync(configPath, 'utf8');
  } catch {
    return new Set();
  }
  // Drop the managed region so our own prior block never counts as "existing".
  const start = text.indexOf(KEYS_START);
  const end = text.indexOf(KEYS_END);
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(0, start) + text.slice(end + KEYS_END.length);
  }
  const keys = new Set();
  for (const m of text.matchAll(/^\s*key\s*=\s*"([^"]+)"/gm)) keys.add(m[1]);
  return keys;
}

/** Return { installed, version } for the herdr CLI. */
function detectHerdr(run = defaultRun) {
  try {
    const out = run('herdr --version').trim();
    const m = out.match(/(\d+\.\d+\.\d+)/);
    return { installed: true, version: m ? m[1] : null };
  } catch {
    return { installed: false, version: null };
  }
}

/** Parse the set of installed plugin ids from `herdr plugin list --json`. */
function parsePluginIds(jsonOutput) {
  try {
    const data = JSON.parse(jsonOutput);
    const list = Array.isArray(data) ? data : data.plugins || data.result?.plugins || [];
    return new Set(
      list
        .map((p) => p.plugin_id || p.id || p.pluginId)
        .filter(Boolean)
    );
  } catch {
    return new Set();
  }
}

/**
 * Build the managed keybindings TOML block for installed plugins and clipboard.
 * Returns null only when neither contributes a binding.
 */
function buildKeybindingsBlock(installedIds, options = {}) {
  const clipboard = options.clipboard !== false;
  const homeDir = options.homeDir || os.homedir();
  const existingKeys = options.existingKeys || new Set();
  const blocks = KEYBINDINGS.filter(
    (k) => installedIds.has(k.id) && !existingKeys.has(k.key)
  ).map((k) => k.toml.join('\n'));
  if (clipboard && !existingKeys.has('ctrl+v')) {
    blocks.push([
      '[[keys.command]]',
      'key = "ctrl+v"',
      'type = "shell"',
      // Absolute path — herdr does NOT expand $HOME/env vars in command strings,
      // so a "$HOME/..." command silently no-ops when it becomes the live binding.
      `command = "${path.join(homeDir, '.local', 'bin', 'herdr-clipboard-paste')}"`,
      'description = "Paste clipboard text or image"',
    ].join('\n'));
  }
  if (blocks.length === 0) return null;
  return (
    '# Arcwright default keybindings. Safe to edit; this block is rewritten\n' +
    '# on update. Delete the markers above and below to opt out of management.\n' +
    blocks.join('\n\n')
  );
}

function defaultRun(cmd) {
  return execSync(cmd, { stdio: 'pipe', timeout: 600000 }).toString();
}

/**
 * Detect herdr and configure it for Arcwright. Best-effort throughout: a failed
 * step logs and continues rather than aborting the install.
 *
 * @param {object} [deps]
 * @param {(cmd:string)=>string} [deps.run] exec shim (mocked in tests)
 * @param {object} [deps.chalk] chalk instance (optional; plain when absent)
 * @param {string} [deps.configPath] override config.toml path (tests)
 * @param {string} [deps.homeDir] override home directory (tests)
 * @param {boolean} [deps.quiet] suppress console output
 * @returns {Promise<{status:string, version?:string, installed:string[], skipped:string[]}>}
 */
async function setupHerdr(deps = {}) {
  const run = deps.run || defaultRun;
  const chalk = deps.chalk || plainChalk();
  const log = deps.quiet ? () => {} : (s) => console.log(s);
  const configPath =
    deps.configPath || path.join(os.homedir(), '.config', 'herdr', 'config.toml');
  const homeDir = deps.homeDir || os.homedir();
  const installPlugins = deps.installPlugins === true;

  const { installed, version } = detectHerdr(run);
  if (!installed) {
    log(chalk.yellow('  ⚠  herdr not found on PATH.'));
    log(chalk.dim('     Install it from https://herdr.dev, then re-run to configure plugins.'));
    return { status: 'not-installed', installed: [], skipped: [] };
  }

  log(chalk.green(`  ✓  herdr ${version || ''} detected`));

  // Agent-state integrations used for native conversation restore on Herdr
  // server restart (`[session] resume_agents_on_restore = true`). Best-effort:
  // agents that aren't installed on this machine skip cleanly.
  for (const agent of ['claude', 'codex', 'hermes', 'opencode', 'grok']) {
    try {
      run(`herdr integration install ${agent}`);
      log(chalk.dim(`     installed ${agent} integration`));
    } catch {
      log(chalk.yellow(`     could not install ${agent} integration (continuing)`));
    }
  }

  try {
    await installHerdrAssets(homeDir);
    await upsertTomlSetting(configPath, 'session', 'resume_agents_on_restore', 'true');
    await upsertTomlSetting(configPath, 'terminal', 'new_cwd', '"follow"');
    await upsertTomlSetting(configPath, 'ui', 'agent_panel_sort', '"spaces"');
    // Top-of-space CPU/RAM/GPU monitor strip. Only takes effect on a herdr
    // build that ships the feature (the Arcwright herdr fork); harmless otherwise.
    await upsertTomlSetting(configPath, 'ui', 'system_monitor', 'true');
    log(chalk.dim('     installed clipboard, restore, and agent-launch standards'));
  } catch {
    log(chalk.yellow('     could not install Herdr standard assets (continuing)'));
  }

  // Third-party plugins are never installed during a normal setup. Their source
  // code runs with the user's environment, so callers must opt in explicitly.
  let present = new Set();
  try {
    present = parsePluginIds(run('herdr plugin list --json'));
  } catch {
    /* server may be down; install attempts below still work for github plugins */
  }

  const installedNow = [];
  const skipped = [];
  if (!installPlugins) {
    log(chalk.dim('     third-party plugins not installed (run `arcwright herdr --install-plugins` to opt in)'));
  }
  for (const plugin of installPlugins ? DEFAULT_PLUGINS : []) {
    if (present.has(plugin.id)) {
      skipped.push(plugin.id);
      continue;
    }
    try {
      run(`herdr plugin install ${plugin.repo} --yes`);
      installedNow.push(plugin.id);
      present.add(plugin.id);
      log(chalk.dim(`     installed ${plugin.repo}`));
    } catch {
      const hint = plugin.needsBuild ? ` (needs ${plugin.needsBuild} to build)` : '';
      skipped.push(plugin.id);
      log(chalk.yellow(`     skipped ${plugin.repo}${hint}`));
    }
  }

  let clipboard = false;
  try {
    clipboard = Boolean(run('command -v wl-paste').trim());
  } catch {
    /* MIME-aware clipboard standard currently targets Linux/Wayland. */
  }
  if (clipboard) {
    try {
      await upsertTomlSetting(configPath, 'keys', 'remote_image_paste', '""');
    } catch {
      log(chalk.yellow('     could not disable Herdr image-only Ctrl+V binding'));
    }
  }

  // Managed keybindings block for whatever ended up installed. Skip any key the
  // user already bound outside the managed block so reloads stay `applied` (no
  // duplicate-key `partial` warnings), and write the clipboard command with an
  // absolute path (herdr does not expand $HOME).
  const block = buildKeybindingsBlock(present, {
    clipboard,
    homeDir,
    existingKeys: existingKeysOutsideBlock(configPath),
  });
  if (block) {
    try {
      const result = await upsertManagedBlock(configPath, KEYS_START, KEYS_END, block);
      log(chalk.dim(`     keybindings ${result} in config.toml`));
      try {
        run('herdr server reload-config');
      } catch {
        /* server not running; config applies on next launch */
      }
    } catch {
      log(chalk.yellow('     could not write keybindings to config.toml'));
    }
  }

  return {
    status: 'configured',
    version,
    installed: installedNow,
    skipped,
  };
}

// Minimal chalk stand-in so the module works without a chalk instance passed in.
function plainChalk() {
  const id = (s) => s;
  return { green: id, yellow: id, dim: id, cyan: id, bold: Object.assign(id, { cyan: id }) };
}

module.exports = {
  setupHerdr,
  detectHerdr,
  parsePluginIds,
  buildKeybindingsBlock,
  upsertTomlSetting,
  installHerdrAssets,
  listClaudeProfileDirs,
  DEFAULT_PLUGINS,
  KEYS_START,
  KEYS_END,
  SHELL_START,
  SHELL_END,
};
