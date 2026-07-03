'use strict';
/**
 * herdrSetup.js — detect-only Herdr integration for Arcwright.
 *
 * Arcwright does NOT install the herdr binary (herdr owns its own update and
 * channel machinery). This module: detects herdr, installs the Claude Code
 * integration, installs the default plugin set (best-effort, per-plugin), and
 * writes a managed keybindings block into ~/.config/herdr/config.toml.
 *
 * Not wired into the installer CLI yet (Phase 2/3). Exported for reuse + tests.
 */

const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { upsertManagedBlock } = require('./managed-md');

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
    toml: [
      '[[keys.command]]',
      'key = "prefix+f"',
      'type = "shell"',
      'command = "herdr plugin action invoke open-file-viewer --plugin herdr-file-viewer"',
    ],
  },
  {
    id: 'url.fzf-picker',
    toml: [
      '[[keys.command]]',
      'key = "alt+u"',
      'type = "plugin_action"',
      'command = "url.fzf-picker.pick-url"',
    ],
  },
];

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
 * Build the managed keybindings TOML block for the plugins that are installed.
 * Returns null when none of the keybinding-bearing plugins are present, so the
 * caller can skip writing an empty block.
 */
function buildKeybindingsBlock(installedIds) {
  const blocks = KEYBINDINGS.filter((k) => installedIds.has(k.id)).map((k) =>
    k.toml.join('\n')
  );
  if (blocks.length === 0) return null;
  return (
    '# Arcwright default plugin keybindings. Safe to edit; this block is rewritten\n' +
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
 * @param {boolean} [deps.quiet] suppress console output
 * @returns {Promise<{status:string, version?:string, installed:string[], skipped:string[]}>}
 */
async function setupHerdr(deps = {}) {
  const run = deps.run || defaultRun;
  const chalk = deps.chalk || plainChalk();
  const log = deps.quiet ? () => {} : (s) => console.log(s);
  const configPath =
    deps.configPath || path.join(os.homedir(), '.config', 'herdr', 'config.toml');

  const { installed, version } = detectHerdr(run);
  if (!installed) {
    log(chalk.yellow('  ⚠  herdr not found on PATH.'));
    log(chalk.dim('     Install it from https://herdr.dev, then re-run to configure plugins.'));
    return { status: 'not-installed', installed: [], skipped: [] };
  }

  log(chalk.green(`  ✓  herdr ${version || ''} detected`));

  // Claude Code integration (agent-state hooks). Best-effort.
  try {
    run('herdr integration install claude');
    log(chalk.dim('     installed Claude Code integration'));
  } catch {
    log(chalk.yellow('     could not install Claude integration (continuing)'));
  }

  // Default plugins — install any not already present.
  let present = new Set();
  try {
    present = parsePluginIds(run('herdr plugin list --json'));
  } catch {
    /* server may be down; install attempts below still work for github plugins */
  }

  const installedNow = [];
  const skipped = [];
  for (const plugin of DEFAULT_PLUGINS) {
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

  // Managed keybindings block for whatever ended up installed.
  const block = buildKeybindingsBlock(present);
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
  DEFAULT_PLUGINS,
  KEYS_START,
  KEYS_END,
};
