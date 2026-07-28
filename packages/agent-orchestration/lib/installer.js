'use strict';
/**
 * arcwright/lib/installer.js
 * Core installer — copies src/ files into _arcwright/ of the target project,
 * tracks installed files in a manifest, removes orphaned files on update,
 * generates config.yaml, and writes IDE integration files for all supported platforms.
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const yaml = require('yaml');
const { glob } = require('glob');
const os = require('os');
const { execSync } = require('child_process');

const SRC_DIR = path.join(__dirname, '..', 'src');
const { detectPlatform } = require('./platform');
const { upsertManagedBlock, cleanupManagedBlocks } = require('./managed-md');
const { setupHerdr } = require('./herdrSetup');

// ─── WSL audio setup (Claude Code /voice) ────────────────────────────────────

/**
 * On WSL2 + WSLg, Claude Code's /voice mode needs PULSE_SERVER to point at the
 * WSLg PulseAudio socket. Append an idempotent managed block to ~/.bashrc.
 * Safe to call repeatedly: re-running replaces the managed block in place.
 *
 * Returns 'added' | 'updated' | 'noop' | 'skipped' (reason in second value).
 */
async function setupWslAudio(platform, chalk) {
  if (platform !== 'windows-wsl') return ['skipped', 'not WSL'];
  const socket = '/mnt/wslg/PulseServer';
  if (!await fs.pathExists(socket)) return ['skipped', 'no WSLg socket (older WSL or audio disabled)'];

  const bashrc = path.join(os.homedir(), '.bashrc');
  const START = '# ─── Arcwright WSL audio (Claude Code /voice) ───';
  const END   = '# ─── End Arcwright WSL audio ───';
  const block = [
    START,
    '# Auto-added by @arcwright-ai/agent-orchestration. Routes PulseAudio to the',
    '# WSLg socket so Claude Code /voice can access the Windows microphone.',
    'export PULSE_SERVER=unix:/mnt/wslg/PulseServer',
    END,
    '',
  ].join('\n');

  let existing = '';
  if (await fs.pathExists(bashrc)) existing = await fs.readFile(bashrc, 'utf8');

  const startIdx = existing.indexOf(START);
  const endIdx   = existing.indexOf(END);

  let next;
  let result;
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = existing.slice(0, startIdx);
    const after  = existing.slice(endIdx + END.length).replace(/^\n/, '');
    const replaced = before + block + after;
    if (replaced === existing) return ['noop', 'already configured'];
    next = replaced;
    result = 'updated';
  } else {
    next = existing + (existing.endsWith('\n') || existing === '' ? '' : '\n') + '\n' + block;
    result = 'added';
  }

  await fs.writeFile(bashrc, next);
  if (chalk) {
    const verb = result === 'added' ? 'Added' : 'Updated';
    console.log(chalk.green(`  ✓ ${verb} WSL audio config in ~/.bashrc (PULSE_SERVER → ${socket})`));
    console.log(chalk.dim('    Open a new shell or `source ~/.bashrc` to apply.'));
  }
  return [result, null];
}

// ─── Model surface / launcher setup ──────────────────────────────────────────

const TEMPLATES_DIR = path.join(__dirname, 'templates', 'launchers');
const HERMES_INSTALL_URL = 'https://hermes-agent.nousresearch.com/install.sh';
const DEFAULT_OMNIROUTE_MODEL = 'agent-fallback';
const DEFAULT_OMNIROUTE_BASE_URL = 'http://omniroute:20128/v1';

function commandExists(command, run = execSync) {
  try {
    run(`command -v ${command}`, { stdio: 'pipe', shell: '/bin/bash' });
    return true;
  } catch {
    return false;
  }
}

function hermesCommandPath(home, run = execSync) {
  try {
    return run('command -v hermes', { encoding: 'utf8', stdio: 'pipe', shell: '/bin/bash' }).trim();
  } catch {
    const localHermes = path.join(home, '.local', 'bin', 'hermes');
    return fs.existsSync(localHermes) ? localHermes : 'hermes';
  }
}

/**
 * Install Hermes CLI if it is not already present. The official installer is
 * intentionally used rather than reimplementing Hermes' dependency bootstrap.
 */
async function ensureHermesCliInstalled(homes, chalk, run = execSync) {
  if (commandExists('hermes', run) || await fs.pathExists(path.join(homes.linux, '.local', 'bin', 'hermes'))) {
    if (chalk) console.log(chalk.dim('  · hermes CLI already installed'));
    return { installed: false, skipped: false };
  }

  if (chalk) console.log(chalk.dim('  · Installing Hermes CLI via official Nous Research installer...'));
  run(`curl -fsSL ${HERMES_INSTALL_URL} | bash`, {
    stdio: 'inherit',
    shell: '/bin/bash',
    env: { ...process.env, HOME: homes.linux },
    timeout: 1200000,
  });
  if (chalk) console.log(chalk.green('  ✓ hermes CLI installed'));
  return { installed: true, skipped: false };
}

/**
 * Configure Hermes as the primary model surface through OmniRoute. The API key
 * is optional so installs can still lay down Hermes + Arcwright skills and tell
 * the user exactly which env var/flag is missing.
 */
async function setupHermesModelSurface({ homes, chalk, baseUrl, apiKey, model = DEFAULT_OMNIROUTE_MODEL, run = execSync }) {
  const hermesBin = hermesCommandPath(homes.linux, run);
  const resolvedBaseUrl = baseUrl || process.env.ARCWRIGHT_OMNIROUTE_BASE_URL || process.env.OMNIROUTE_BASE_URL || DEFAULT_OMNIROUTE_BASE_URL;
  const resolvedApiKey = apiKey || process.env.ARCWRIGHT_OMNIROUTE_API_KEY || process.env.OMNIROUTE_API_KEY || '';

  const quote = (value) => `'${String(value).replace(/'/g, `'\\''`)}'`;
  run(`${quote(hermesBin)} config set model.provider custom`, { stdio: 'pipe', shell: '/bin/bash', env: { ...process.env, HOME: homes.linux } });
  run(`${quote(hermesBin)} config set model.base_url ${quote(resolvedBaseUrl)}`, { stdio: 'pipe', shell: '/bin/bash', env: { ...process.env, HOME: homes.linux } });
  run(`${quote(hermesBin)} config set model.default ${quote(model)}`, { stdio: 'pipe', shell: '/bin/bash', env: { ...process.env, HOME: homes.linux } });

  if (resolvedApiKey) {
    run(`${quote(hermesBin)} config set model.api_key ${quote(resolvedApiKey)}`, { stdio: 'pipe', shell: '/bin/bash', env: { ...process.env, HOME: homes.linux } });
    if (chalk) console.log(chalk.green(`  ✓ Hermes model surface → OmniRoute (${resolvedBaseUrl}, model=${model})`));
    return { configured: true, missingApiKey: false, baseUrl: resolvedBaseUrl, model };
  }

  if (chalk) {
    console.log(chalk.yellow(`  ⚠ Hermes model surface partially configured (${resolvedBaseUrl}, model=${model})`));
    console.log(chalk.dim('    Set ARCWRIGHT_OMNIROUTE_API_KEY or OMNIROUTE_API_KEY, then rerun with --model-surface.'));
  }
  return { configured: false, missingApiKey: true, baseUrl: resolvedBaseUrl, model };
}

// Per-provider key files installed under ~/.config/<provider>/key.
// GLM and MiniMax use their OWN native Anthropic endpoints (OpenRouter's
// Anthropic shim breaks reasoning models in Claude Code's agentic loop).
// OpenRouter is kept only for non-reasoning models (e.g. qwen3-coder).
const LAUNCHER_PROVIDERS = [
  { dir: 'zai',        placeholder: 'REPLACE-WITH-YOUR-ZAI-KEY',        label: 'Z.ai GLM Coding Plan (https://z.ai)' },
  { dir: 'minimax',    placeholder: 'REPLACE-WITH-YOUR-MINIMAX-KEY',    label: 'MiniMax (https://platform.minimax.io)' },
  { dir: 'openrouter', placeholder: 'sk-or-REPLACE-WITH-YOUR-OPENROUTER-KEY', label: 'OpenRouter (https://openrouter.ai/keys)' },
];

/**
 * Install provider-aware Claude Code model launchers.
 *
 * Linux/macOS:
 *   - Creates ~/.config/{zai,minimax,openrouter}/ + placeholder key files
 *     (chmod 600, only if absent)
 *   - Copies the multi-provider launcher to ~/.config/openrouter/claude-or.sh
 *     (the script self-references this path)
 *   - Idempotently sources it from ~/.bashrc (and ~/.zshrc if present)
 *
 * WSL2 additions:
 *   - Writes claude-glm.cmd / claude-minimax.cmd / claude-qwen.cmd /
 *     claude-sub.cmd to the Windows user's home (or bin/ subdir if it exists)
 *   - Idempotently appends PowerShell profile functions to PS7 + PS5 profiles
 *   - Writes Windows Terminal fragment JSON (4 profiles) to
 *     %LOCALAPPDATA%\Microsoft\Windows Terminal\Fragments\arcwright-openrouter\
 *
 * All writes are idempotent (guarded by sentinel markers or existence checks).
 */
async function setupOpenRouterLaunchers(platform, homes, chalk) {
  const linuxHome = homes.linux;
  const scriptDest = path.join(linuxHome, '.config', 'openrouter', 'claude-or.sh');
  const scriptSrc  = path.join(TEMPLATES_DIR, 'claude-or.sh');

  if (!await fs.pathExists(scriptSrc)) {
    if (chalk) console.log(chalk.yellow('  ⚠ Launcher template not found in package — skipping'));
    return;
  }

  // ── Per-provider key files (chmod 600, only if absent) ───────────────────
  for (const { dir, placeholder, label } of LAUNCHER_PROVIDERS) {
    const providerDir = path.join(linuxHome, '.config', dir);
    const keyFile = path.join(providerDir, 'key');
    await fs.ensureDir(providerDir);
    if (!await fs.pathExists(keyFile)) {
      await fs.writeFile(keyFile, placeholder + '\n', 'utf8');
      try { fs.chmodSync(keyFile, 0o600); } catch { /* non-POSIX (Windows FS) — ignore */ }
      if (chalk) console.log(chalk.green(`  ✓ Created ~/.config/${dir}/key`) + chalk.dim(` (placeholder — ${label})`));
    } else {
      if (chalk) console.log(chalk.dim(`  · ~/.config/${dir}/key already exists — not overwritten`));
    }
  }

  // ── Copy launcher script ──────────────────────────────────────────────────
  await fs.copy(scriptSrc, scriptDest, { overwrite: true });
  if (chalk) console.log(chalk.green(`  ✓ Installed ~/.config/openrouter/claude-or.sh (multi-provider)`));

  // ── Source block for shell rc files ──────────────────────────────────────
  const SOURCE_START = '# ─── Arcwright model launchers ───';
  const SOURCE_END   = '# ─── End Arcwright model launchers ───';
  // Legacy marker from the OpenRouter-only release — treated as "already present".
  const LEGACY_START = '# ─── Arcwright OpenRouter launchers ───';
  const sourceBlock  = [
    SOURCE_START,
    '[ -f "$HOME/.config/openrouter/claude-or.sh" ] && source "$HOME/.config/openrouter/claude-or.sh"',
    SOURCE_END,
    '',
  ].join('\n');

  for (const rcName of ['.bashrc', '.zshrc']) {
    const rcPath = path.join(linuxHome, rcName);
    if (rcName === '.zshrc' && !await fs.pathExists(rcPath)) continue; // zshrc only if present
    let rc = '';
    if (await fs.pathExists(rcPath)) rc = await fs.readFile(rcPath, 'utf8');
    if (rc.includes(SOURCE_START) || rc.includes(LEGACY_START)) {
      if (chalk) console.log(chalk.dim(`  · ~/${rcName} already sources the launchers — not modified`));
      continue;
    }
    const separator = rc.endsWith('\n') || rc === '' ? '' : '\n';
    await fs.writeFile(rcPath, rc + separator + '\n' + sourceBlock, 'utf8');
    if (chalk) console.log(chalk.green(`  ✓ Added launcher source block to ~/${rcName}`));
  }

  // ── WSL2 Windows-side additions ───────────────────────────────────────────
  if (platform !== 'windows-wsl' || !homes.windows) return;

  const winHome = homes.windows;

  // Detect the current WSL distro name (set inside WSL); fall back to "Ubuntu".
  // Used in the generated .cmd files, PowerShell functions, and WT fragment so
  // they invoke the user's actual distro instead of a hardcoded guess.
  const distro = (process.env.WSL_DISTRO_NAME || '').trim() || 'Ubuntu';
  const editNote = `:: Edit the distro name below if you switch WSL distros.`;

  // .cmd launchers → Windows home (or a bin/ subdir if it exists)
  const cmdTargetDir = await fs.pathExists(path.join(winHome, 'bin'))
    ? path.join(winHome, 'bin')
    : winHome;

  const mkCmd = (herdrFn) =>
    `@echo off\n${editNote}\nwsl.exe -d ${distro} -- bash -ic "${herdrFn}"\n`;
  const cmds = [
    { name: 'claude-glm.cmd',     body: mkCmd('herdr-claude-glm') },
    { name: 'claude-minimax.cmd', body: mkCmd('herdr-claude-minimax') },
    { name: 'claude-qwen.cmd',    body: mkCmd('herdr-claude-qwen') },
    { name: 'claude-sub.cmd',     body: mkCmd('herdr-claude') },
  ];
  for (const { name, body } of cmds) {
    const dest = path.join(cmdTargetDir, name);
    if (!await fs.pathExists(dest)) {
      await fs.writeFile(dest, body, 'utf8');
      if (chalk) console.log(chalk.green(`  ✓ Created ${dest.replace(winHome, '~win')} (distro: ${distro})`));
    } else {
      if (chalk) console.log(chalk.dim(`  · ${name} already exists — not overwritten`));
    }
  }

  // PowerShell profile functions
  const PS_START = '# ─── Arcwright model launchers ───';
  const PS_LEGACY = '# ─── Arcwright OpenRouter launchers ───';
  const PS_END   = '# ─── End Arcwright model launchers ───';
  const psBlock  = [
    PS_START,
    `# Edit "-d ${distro}" below if you switch WSL distros.`,
    `function claude-glm     { wsl.exe -d ${distro} -- bash -ic "herdr-claude-glm" }`,
    `function claude-minimax { wsl.exe -d ${distro} -- bash -ic "herdr-claude-minimax" }`,
    `function claude-qwen    { wsl.exe -d ${distro} -- bash -ic "herdr-claude-qwen" }`,
    `function claude-sub     { wsl.exe -d ${distro} -- bash -ic "herdr-claude" }`,
    PS_END,
    '',
  ].join('\n');

  // Detect Windows Documents folder; fall back to ~/Documents
  let winDocs = path.join(winHome, 'Documents');
  const psProfiles = [
    path.join(winDocs, 'PowerShell', 'profile.ps1'),
    path.join(winDocs, 'WindowsPowerShell', 'profile.ps1'),
  ];
  for (const profilePath of psProfiles) {
    await fs.ensureDir(path.dirname(profilePath));
    let existing = '';
    if (await fs.pathExists(profilePath)) existing = await fs.readFile(profilePath, 'utf8');
    if (existing.includes(PS_START) || existing.includes(PS_LEGACY)) {
      if (chalk) console.log(chalk.dim(`  · ${path.basename(path.dirname(profilePath))}/profile.ps1 already has launcher functions — not modified`));
      continue;
    }
    const sep = existing.endsWith('\n') || existing === '' ? '' : '\n';
    await fs.writeFile(profilePath, existing + sep + '\n' + psBlock, 'utf8');
    if (chalk) console.log(chalk.green(`  ✓ Added claude-glm/minimax/qwen/sub to ${path.basename(path.dirname(profilePath))}/profile.ps1 (distro: ${distro})`));
  }

  // Windows Terminal fragment — substitute the detected distro for the template's "Ubuntu"
  const wtFragDir  = path.join(winHome, 'AppData', 'Local', 'Microsoft', 'Windows Terminal', 'Fragments', 'arcwright-openrouter');
  const wtFragDest = path.join(wtFragDir, 'launchers.json');
  const wtFragSrc  = path.join(TEMPLATES_DIR, 'windows-terminal-fragment.json');
  if (!await fs.pathExists(wtFragDest) && await fs.pathExists(wtFragSrc)) {
    await fs.ensureDir(wtFragDir);
    let frag = await fs.readFile(wtFragSrc, 'utf8');
    if (distro !== 'Ubuntu') frag = frag.replace(/-d Ubuntu/g, `-d ${distro}`);
    await fs.writeFile(wtFragDest, frag, 'utf8');
    if (chalk) console.log(chalk.green(`  ✓ Added Windows Terminal profiles fragment (4 profiles, distro: ${distro})`));
    if (chalk) console.log(chalk.dim(`    (edit launchers.json if you switch WSL distros)`));
  } else if (await fs.pathExists(wtFragDest)) {
    if (chalk) console.log(chalk.dim(`  · Windows Terminal fragment already exists — not overwritten`));
  }
}

// ─── bmad detection ───────────────────────────────────────────────────────────

/**
 * Detect whether the project has bmad artifacts that need migration.
 * Returns {present: boolean, signals: string[]} where signals lists the
 * specific paths/patterns found. Used for logging + prompting.
 */
function detectBmad(projectRoot) {
  const signals = [];
  const check = (rel) => fs.pathExistsSync(path.join(projectRoot, rel));

  if (check('_bmad'))             signals.push('_bmad/');
  if (check('_bmad-output'))      signals.push('_bmad-output/');
  if (check('_bmad_output'))      signals.push('_bmad_output/');
  if (check('_arcwright/bmm'))    signals.push('_arcwright/bmm/ (partial migration)');
  if (check('_arcwright/bmb'))    signals.push('_arcwright/bmb/ (partial migration)');

  // Check for bmad slash commands
  const cmdDir = path.join(projectRoot, '.claude', 'commands');
  if (fs.pathExistsSync(cmdDir)) {
    const bmadCmds = fs.readdirSync(cmdDir).filter(f => /^bmad-/.test(f));
    if (bmadCmds.length > 0) signals.push(`${bmadCmds.length} bmad-*.md command file${bmadCmds.length !== 1 ? 's' : ''} in .claude/commands/`);
  }

  return { present: signals.length > 0, signals };
}

// Modules available in src/
const AVAILABLE_MODULES = ['awm', 'awb', 'core', '_memory'];
/** Modules installed only when their opt-in flag is passed (--aws-infra, --unnamed-pm). */
const OPTIONAL_MODULES = ['aws-infra', 'unnamed-pm'];

// Manifest file location (relative to _arcwright/)
const MANIFEST_FILE = '_config/manifest.yaml';
const FILES_MANIFEST_FILE = '_config/files-manifest.csv';

// ─── Platform IDE config ─────────────────────────────────────────────────────

/**
 * All supported platforms and what files they write.
 * Each platform writes its own agent stub + optional CLAUDE.md / rules file.
 *
 * `hint` feeds the interactive installer multiselect.
 * `summary` feeds `arcwright platforms` (agent stubs / skills column).
 * Order here is the installer option order.
 *
 * codex/hermes/opencode/grok/cursor are NOT dispatched through writeIdeConfig (see
 * the `continue` in the IDE-integration loop) — their own write*Config
 * helpers handle AGENTS.md + skills (and commands/agents where relevant)
 * with upsertManagedBlock and manifest entries. PLATFORMS entries still
 * drive --tools validation, the interactive prompt, and `platforms`.
 */
const PLATFORMS = {
  'claude-code': {
    label: 'Claude Code',
    hint: 'agents, CLAUDE.md, settings.json, herdr skill',
    summary: '.claude/agents/',
    agentDir: '.claude/agents',
    skillsDir: null,
    steeringDir: null,
    hooksDir: null,
    rulesFile: '.claude/CLAUDE.md',
    rulesMarker: '## Arcwright',
  },
  'kiro': {
    label: 'Kiro (IDE + CLI)',
    hint: '.kiro/skills/, .kiro/steering/',
    summary: '.kiro/skills/',
    agentDir: '.kiro/agents',
    skillsDir: '.kiro/skills',
    steeringDir: '.kiro/steering',
    // Display-only: Kiro uses steering files, not a single rules file.
    rulesFile: '.kiro/steering/*.md',
    rulesMarker: null,
  },
  'codex': {
    label: 'Codex',
    hint: 'AGENTS.md, .agents/skills/',
    summary: '.agents/skills/ ($HOME or project)',
    agentDir: null,
    skillsDir: null,
    steeringDir: null,
    hooksDir: null,
    rulesFile: 'AGENTS.md',
    rulesMarker: '## Arcwright',
  },
  'hermes': {
    label: 'Hermes',
    hint: '~/.hermes/skills/, AGENTS.md (project only)',
    summary: '~/.hermes/skills/ (global only)',
    agentDir: null,
    skillsDir: null,
    steeringDir: null,
    hooksDir: null,
    rulesFile: 'AGENTS.md',
    rulesMarker: '## Arcwright',
  },
  'opencode': {
    label: 'OpenCode',
    hint: 'AGENTS.md, .agents/skills/, .opencode/commands/',
    summary: '.agents/skills/ + .opencode/commands/ ($HOME or project)',
    agentDir: null,
    skillsDir: null,
    steeringDir: null,
    hooksDir: null,
    rulesFile: 'AGENTS.md',
    rulesMarker: '## Arcwright',
  },
  'grok': {
    label: 'Grok',
    hint: '~/.grok/AGENTS.md, skills, commands, agents',
    summary: '~/.grok/skills|commands|agents/ (global); .agents/skills + .grok/* (project)',
    agentDir: '.grok/agents',
    skillsDir: null,
    steeringDir: null,
    hooksDir: null,
    // Project uses root AGENTS.md; global uses ~/.grok/AGENTS.md (see GLOBAL_PATHS).
    rulesFile: 'AGENTS.md / ~/.grok/AGENTS.md',
    rulesMarker: '## Arcwright',
  },
  'cursor': {
    label: 'Cursor (IDE + Agent CLI)',
    hint: '.cursor/rules/, .cursor/commands/, AGENTS.md',
    summary: '.cursor/rules/ + .cursor/commands/ + AGENTS.md (project)',
    agentDir: null,
    skillsDir: null,
    steeringDir: null,
    hooksDir: null,
    rulesFile: '.cursor/rules/arcwright.mdc',
    rulesMarker: '<!-- arcwright-cursor-start -->',
  },
};

/** Ordered list of supported --tools ids (keys of PLATFORMS). */
function getSupportedToolIds() {
  return Object.keys(PLATFORMS);
}

/** Multiselect options for the interactive installer prompt. */
function getToolPromptOptions() {
  return getSupportedToolIds().map((id) => ({
    value: id,
    label: PLATFORMS[id].label,
    hint: PLATFORMS[id].hint || '',
  }));
}

/**
 * Parse a comma-separated --tools string. Drops empty/`none` tokens.
 * Throws if any remaining id is not in PLATFORMS.
 */
function parseToolIds(toolsCsv) {
  const parsed = (toolsCsv || '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t && t !== 'none');
  const known = new Set(getSupportedToolIds());
  const unknown = parsed.filter((t) => !known.has(t));
  if (unknown.length) {
    throw new Error(
      `Unknown --tools id(s): ${unknown.join(', ')}. Supported: ${getSupportedToolIds().join(', ')}`
    );
  }
  return parsed;
}

// ─── Cross-platform home resolution ──────────────────────────────────────────

function getHomes(platform) {
  const linuxHome = os.homedir();

  if (platform === 'windows-wsl') {
    try {
      const winProfile = execSync('cmd.exe /C "echo %USERPROFILE%"', { encoding: 'utf8' }).trim().replace(/\r/g, '');
      const winHome = execSync(`wslpath -u "${winProfile}"`, { encoding: 'utf8' }).trim();
      return { linux: linuxHome, windows: winHome };
    } catch {
      try {
        const user = execSync('cmd.exe /C "echo %USERNAME%"', { encoding: 'utf8' }).trim().replace(/\r/g, '');
        return { linux: linuxHome, windows: `/mnt/c/Users/${user}` };
      } catch {
        return { linux: linuxHome, windows: linuxHome };
      }
    }
  }

  return { linux: linuxHome, windows: null };
}

/**
 * Terminal-based tools use Linux home (even on WSL).
 * GUI IDE tools use Windows home when on WSL.
 */
const TERMINAL_TOOLS = ['claude-code', 'codex', 'hermes', 'opencode', 'grok'];

function resolveToolPath(tool, relativePath, isGlobal, homes, platform) {
  if (!isGlobal) return null; // caller handles project paths
  const useWindowsHome = platform === 'windows-wsl' && !TERMINAL_TOOLS.includes(tool);
  const home = useWindowsHome && homes.windows ? homes.windows : homes.linux;
  return path.join(home, relativePath);
}

// Global path mapping for each IDE
const GLOBAL_PATHS = {
  'claude-code': {
    agents: '.claude/agents',
    claudeMd: '.claude/CLAUDE.md',
    settings: '.claude/settings.json',
    skills: '.claude/skills',
  },
  'kiro': {
    agents: '.kiro/agents',
    skills: '.kiro/skills',
    steering: '.kiro/steering',
  },
  'codex': {
    // Codex reads $HOME/.agents/skills (NOT ~/.codex/skills) and ~/.codex/AGENTS.md.
    claudeMd: '.codex/AGENTS.md',
    skills: '.agents/skills',
  },
  'hermes': {
    // Hermes has no project-scoped skills dir and no global rules file — its
    // global persona lives in ~/.hermes/SOUL.md, which Arcwright never touches.
    skills: '.hermes/skills',
    skillBundles: '.hermes/skill-bundles',
  },
  'opencode': {
    // OpenCode natively reads ~/.agents/skills (same as Codex), ~/.config/opencode/AGENTS.md,
    // and ~/.config/opencode/commands/*.md (Claude Code command format, verbatim).
    claudeMd: '.config/opencode/AGENTS.md',
    skills: '.agents/skills',
    commands: '.config/opencode/commands',
  },
  'grok': {
    // Grok (xAI CLI / Grok Build) discovers:
    //   - AGENTS.md / CLAUDE.md under ~/.grok/ (global) and project roots
    //   - SKILL.md from ~/.grok/skills/, .grok/skills/, .agents/skills/, and Claude compat paths
    //   - slash commands from ~/.grok/commands/ and .grok/commands/ (Claude Code *.md format)
    //   - agent defs from ~/.grok/agents/ and .grok/agents/
    claudeMd: '.grok/AGENTS.md',
    skills: '.grok/skills',
    commands: '.grok/commands',
    agents: '.grok/agents',
  },
  'cursor': {
    // Cursor project rules and commands are intentionally project-scoped.
    // Cursor User Rules are stored by the app rather than in a supported
    // user-level rules directory, so global installs stage a paste-ready file.
    userRules: '.cursor/arcwright-user-rules.md',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function readManifest(arcwrightDir) {
  const p = path.join(arcwrightDir, MANIFEST_FILE);
  if (!await fs.pathExists(p)) return null;
  try {
    return yaml.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return null;
  }
}

async function writeManifest(arcwrightDir, manifest) {
  const p = path.join(arcwrightDir, MANIFEST_FILE);
  await fs.ensureDir(path.dirname(p));
  await fs.writeFile(p, yaml.stringify(manifest), 'utf8');
}

async function readFilesManifest(arcwrightDir) {
  const p = path.join(arcwrightDir, FILES_MANIFEST_FILE);
  if (!await fs.pathExists(p)) return [];
  const lines = (await fs.readFile(p, 'utf8')).split('\n').filter(Boolean);
  return lines.slice(1).map(l => {
    const [relPath, hash] = l.split(',');
    return { relPath, hash };
  });
}

async function writeFilesManifest(arcwrightDir, entries) {
  const p = path.join(arcwrightDir, FILES_MANIFEST_FILE);
  await fs.ensureDir(path.dirname(p));
  const lines = ['path,hash', ...entries.map(e => `${e.relPath},${e.hash}`)];
  await fs.writeFile(p, lines.join('\n') + '\n', 'utf8');
}

// After an orphaned file is removed, its skill/command directory is often left
// empty (a removed skill's SKILL.md + RULES.md go, the dir stays). Walk up from
// the removed file and rmdir empty parents, stopping at a non-empty dir or at a
// known container root (never remove the skills/commands/agents roots themselves).
const DIR_CLEANUP_STOP = new Set(['skills', 'commands', 'agents', 'skill-bundles', 'steering', 'hooks', '.claude', '.codex', '.hermes', '.kiro', '.config', 'opencode', '.grok']);
async function removeEmptyDirsUpward(removedFile) {
  let dir = path.dirname(removedFile);
  for (let depth = 0; depth < 5; depth++) {
    if (DIR_CLEANUP_STOP.has(path.basename(dir))) return;
    let entries;
    try {
      entries = await fs.readdir(dir);
    } catch {
      return; // dir already gone or unreadable
    }
    if (entries.length > 0) return; // not empty, keep it and everything above
    try {
      await fs.rmdir(dir);
    } catch {
      return;
    }
    dir = path.dirname(dir);
  }
}

// ─── Kiro config writer ───────────────────────────────────────────────────────

async function writeKiroConfig(projectRoot, chalk, isGlobal, homes, platform, resolvedTeams = true, resolvedDockerCheck = false, resolvedAwsInfra = false, resolvedUnnamedPm = false, resolvedDotnet = false, resolvedElectron = false, resolvedTauri = false, resolvedStrands = false) {
  const kiroSteeringSrc = path.join(SRC_DIR, '.kiro', 'steering');
  const kiroAgentsSrc = path.join(SRC_DIR, '.kiro', 'agents');

  const skillsDest = isGlobal
    ? resolveToolPath('kiro', '.kiro/skills', isGlobal, homes, platform)
    : path.join(projectRoot, '.kiro', 'skills');
  const steeringDest = isGlobal
    ? resolveToolPath('kiro', '.kiro/steering', isGlobal, homes, platform)
    : path.join(projectRoot, '.kiro', 'steering');
  const agentsDest = isGlobal
    ? resolveToolPath('kiro', '.kiro/agents', isGlobal, homes, platform)
    : path.join(projectRoot, '.kiro', 'agents');

  // Copy skills (Kiro-adapted versions with .kiro/ paths)
  const kiroSkillsSrc = path.join(SRC_DIR, '.kiro', 'skills');
  if (await fs.pathExists(kiroSkillsSrc)) {
    await fs.ensureDir(skillsDest);
    const filter = (src) => {
      if (!resolvedTeams && (/[/\\]team-[^/\\]+[/\\]?$/.test(src) || /[/\\]team-[^/\\]+[/\\]/.test(src))) return false;
      if (!resolvedDockerCheck && (/[/\\]docker-type-check[/\\]?$/.test(src) || /[/\\]docker-type-check[/\\]/.test(src))) return false;
      if (!resolvedDotnet && (/[/\\]dotnet-[^/\\]+[/\\]?$/.test(src) || /[/\\]dotnet-[^/\\]+[/\\]/.test(src))) return false;
      if (!resolvedElectron && (/[/\\]electron-[^/\\]+[/\\]?$/.test(src) || /[/\\]electron-[^/\\]+[/\\]/.test(src))) return false;
      if (!resolvedTauri && (/[/\\]tauri-[^/\\]+[/\\]?$/.test(src) || /[/\\]tauri-[^/\\]+[/\\]/.test(src))) return false;
      if (!resolvedStrands && (/[/\\]strands-[^/\\]+[/\\]?$/.test(src) || /[/\\]strands-[^/\\]+[/\\]/.test(src))) return false;
      if (!resolvedAwsInfra && (/[/\\]aws-serverless-cdk[/\\]?$/.test(src) || /[/\\]aws-serverless-cdk[/\\]/.test(src))) return false;
      if (!resolvedUnnamedPm && (/[/\\]unnamed-pm-sync[/\\]?$/.test(src) || /[/\\]unnamed-pm-sync[/\\]/.test(src))) return false;
      return true;
    };
    await fs.copy(kiroSkillsSrc, skillsDest, { overwrite: true, filter });
    const allSkillFiles = await glob('**/*', { cwd: kiroSkillsSrc, nodir: true });
    const skillFiles = allSkillFiles.filter(f => {
      if (!resolvedTeams && /^team-/.test(f)) return false;
      if (!resolvedDockerCheck && /^docker-type-check\//.test(f)) return false;
      if (!resolvedDotnet && /^dotnet-/.test(f)) return false;
      if (!resolvedElectron && /^electron-/.test(f)) return false;
      if (!resolvedTauri && /^tauri-/.test(f)) return false;
      if (!resolvedStrands && /^strands-/.test(f)) return false;
      if (!resolvedAwsInfra && /^aws-serverless-cdk\//.test(f)) return false;
      if (!resolvedUnnamedPm && /^unnamed-pm-sync\//.test(f)) return false;
      return true;
    });
    const skippedCount = allSkillFiles.length - skillFiles.length;
    const skipNotes = [];
    if (!resolvedTeams) skipNotes.push('team-*');
    if (!resolvedDockerCheck) skipNotes.push('docker-type-check');
    if (!resolvedDotnet) skipNotes.push('dotnet-*');
    if (!resolvedElectron) skipNotes.push('electron-*');
    if (!resolvedTauri) skipNotes.push('tauri-*');
    if (!resolvedStrands) skipNotes.push('strands-*');
    if (!resolvedAwsInfra) skipNotes.push('aws-serverless-cdk');
    if (!resolvedUnnamedPm) skipNotes.push('unnamed-pm-sync');
    const teamNote = skipNotes.length > 0 ? chalk.dim(` (skipped ${skippedCount} files: ${skipNotes.join(', ')})`) : '';
    console.log(chalk.green(`  ✓ .kiro/skills/ (${skillFiles.length} files)`) + teamNote);
  }

  // Copy steering files
  if (await fs.pathExists(kiroSteeringSrc)) {
    await fs.ensureDir(steeringDest);
    await fs.copy(kiroSteeringSrc, steeringDest, { overwrite: true });
    const steeringFiles = await fs.readdir(kiroSteeringSrc);
    console.log(chalk.green(`  ✓ .kiro/steering/ (${steeringFiles.length} files)`));
  }

  // Copy Kiro agents (.kiro/agents/ — native Kiro agent configs, JSON format)
  if (await fs.pathExists(kiroAgentsSrc)) {
    await fs.ensureDir(agentsDest);
    const allAgentFiles = (await fs.readdir(kiroAgentsSrc)).filter(f => f.endsWith('.json'));
    const agentFiles = allAgentFiles.filter(f => {
      if (!resolvedTeams && f === 'team.json') return false;
      if (!resolvedDockerCheck && f === 'docker-check.json') return false;
      if (!resolvedDotnet && f === 'dotnet.json') return false;
      if (!resolvedElectron && f === 'electron.json') return false;
      if (!resolvedTauri && f === 'tauri.json') return false;
      if (!resolvedStrands && f === 'strands.json') return false;
      if (!resolvedAwsInfra && (f === 'aws-infra.json' || f === 'arcwright-aws-infra.json')) return false;
      if (!resolvedUnnamedPm && (f === 'unnamed-pm.json' || f === 'arcwright-unnamed-pm.json')) return false;
      return true;
    });
    for (const f of agentFiles) {
      await fs.copy(path.join(kiroAgentsSrc, f), path.join(agentsDest, f), { overwrite: true });
    }
    const skipNotes = [];
    if (!resolvedTeams) skipNotes.push('/team');
    if (!resolvedDockerCheck) skipNotes.push('/docker-check');
    if (!resolvedDotnet) skipNotes.push('/dotnet');
    if (!resolvedElectron) skipNotes.push('/electron');
    if (!resolvedTauri) skipNotes.push('/tauri');
    if (!resolvedStrands) skipNotes.push('/strands');
    if (!resolvedAwsInfra) skipNotes.push('/aws-infra');
    if (!resolvedUnnamedPm) skipNotes.push('/unnamed-pm');
    const teamNote = skipNotes.length > 0 ? chalk.dim(` (skipped ${skipNotes.join(', ')})`) : '';
    console.log(chalk.green(`  ✓ .kiro/agents/ (${agentFiles.length} agents)`) + teamNote);
  }
}

// ─── Shared skill-copy filtering (Codex / Hermes) ────────────────────────────
// Same opt-in gating writeKiroConfig and the unconditional project skills copy
// apply, factored out once here so the two new writers below don't triplicate it.

function skillCopyFilter(flags) {
  const { resolvedTeams, resolvedDockerCheck, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands, resolvedAwsInfra, resolvedUnnamedPm } = flags;
  return (src) => {
    if (!resolvedTeams && (/[/\\]team-[^/\\]+[/\\]?$/.test(src) || /[/\\]team-[^/\\]+[/\\]/.test(src))) return false;
    if (!resolvedDockerCheck && (/[/\\]docker-type-check[/\\]?$/.test(src) || /[/\\]docker-type-check[/\\]/.test(src))) return false;
    if (!resolvedDotnet && (/[/\\]dotnet-[^/\\]+[/\\]?$/.test(src) || /[/\\]dotnet-[^/\\]+[/\\]/.test(src))) return false;
    if (!resolvedElectron && (/[/\\]electron-[^/\\]+[/\\]?$/.test(src) || /[/\\]electron-[^/\\]+[/\\]/.test(src))) return false;
    if (!resolvedTauri && (/[/\\]tauri-[^/\\]+[/\\]?$/.test(src) || /[/\\]tauri-[^/\\]+[/\\]/.test(src))) return false;
    if (!resolvedStrands && (/[/\\]strands-[^/\\]+[/\\]?$/.test(src) || /[/\\]strands-[^/\\]+[/\\]/.test(src))) return false;
    if (!resolvedAwsInfra && (/[/\\]aws-serverless-cdk[/\\]?$/.test(src) || /[/\\]aws-serverless-cdk[/\\]/.test(src))) return false;
    if (!resolvedUnnamedPm && (/[/\\]unnamed-pm-sync[/\\]?$/.test(src) || /[/\\]unnamed-pm-sync[/\\]/.test(src))) return false;
    return true;
  };
}

function filterSkillFiles(files, flags) {
  const { resolvedTeams, resolvedDockerCheck, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands, resolvedAwsInfra, resolvedUnnamedPm } = flags;
  return files.filter(f => {
    if (!resolvedTeams && /^team-/.test(f)) return false;
    if (!resolvedDockerCheck && /^docker-type-check\//.test(f)) return false;
    if (!resolvedDotnet && /^dotnet-/.test(f)) return false;
    if (!resolvedElectron && /^electron-/.test(f)) return false;
    if (!resolvedTauri && /^tauri-/.test(f)) return false;
    if (!resolvedStrands && /^strands-/.test(f)) return false;
    if (!resolvedAwsInfra && /^aws-serverless-cdk\//.test(f)) return false;
    if (!resolvedUnnamedPm && /^unnamed-pm-sync\//.test(f)) return false;
    return true;
  });
}

// ─── Codex config writer ──────────────────────────────────────────────────────
// Codex reads AGENTS.md (global ~/.codex/AGENTS.md, project <root>/AGENTS.md)
// and SKILL.md natively from $HOME/.agents/skills (global) and
// <root>/.agents/skills (project). Bypasses writeIdeConfig entirely (see the
// `continue` in install()'s IDE-integration loop) so it can use
// upsertManagedBlock (never clobbers user content outside the marker block)
// and return manifest entries for orphan-removal tracking — the bug
// writeKiroConfig has (it writes files but returns nothing, so they're never
// cleaned up on update) is NOT replicated here.
//
// Returns Array<{relPath, hash}> for every file written.
async function writeCodexConfig(projectRoot, modules, chalk, isGlobal, homes, platform, resolvedTeams = true, resolvedDockerCheck = false, resolvedAwsInfra = false, resolvedUnnamedPm = false, resolvedDotnet = false, resolvedElectron = false, resolvedTauri = false, resolvedStrands = false) {
  const entries = [];
  const flags = { resolvedTeams, resolvedDockerCheck, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands, resolvedAwsInfra, resolvedUnnamedPm };

  // ── AGENTS.md ── managed block only. Never added to manifest entries: like
  // claude-code's CLAUDE.md, this file can carry user content outside the
  // block, and orphan removal deletes whole files — tracking it would risk
  // deleting a user's AGENTS.md if codex is later deselected on update.
  const rulesPath = isGlobal
    ? resolveToolPath('codex', GLOBAL_PATHS.codex.claudeMd, true, homes, platform)
    : path.join(projectRoot, 'AGENTS.md');
  const label = isGlobal ? '~/.codex/AGENTS.md' : 'AGENTS.md';
  await migrateOldClaudeMd(rulesPath);
  const result = await upsertManagedBlock(rulesPath, '<!-- arcwright-agent-start -->', '<!-- arcwright-agent-end -->', buildArcwrightRulesEntry(modules));
  if (result === 'created') console.log(chalk.green(`  ✓ ${label} created`));
  else if (result !== 'noop') console.log(chalk.green(`  ✓ ${label} updated`));
  else console.log(chalk.gray(`  ○ ${label} already up to date`));

  // ── Skills ──
  const skillsSrc = path.join(SRC_DIR, '.agents', 'skills');
  const skillsDest = isGlobal
    ? resolveToolPath('codex', GLOBAL_PATHS.codex.skills, true, homes, platform)
    : path.join(projectRoot, '.agents', 'skills');

  if (await fs.pathExists(skillsSrc)) {
    if (path.resolve(skillsSrc) === path.resolve(skillsDest)) {
      // Dest resolves to the repo's own .agents/skills (the build source) —
      // copying onto itself would be a no-op at best, destructive at worst.
      console.log(chalk.gray('  ○ .agents/skills/ already the source (skipped copy)'));
    } else {
      await fs.ensureDir(skillsDest);
      await fs.copy(skillsSrc, skillsDest, { overwrite: true, filter: skillCopyFilter(flags) });
      const allSkillFiles = await glob('**/*', { cwd: skillsSrc, nodir: true });
      const skillFiles = filterSkillFiles(allSkillFiles, flags);
      // Global entries use a '.codex/skills/' bookkeeping prefix (distinct from
      // claude-code's '.agents/skills/' → ~/.claude/skills/ remapping) so
      // orphan removal resolves them to the real $HOME/.agents/skills/ path
      // instead of colliding with claude-code's global skill location.
      const relPrefix = isGlobal ? '.codex/skills' : '.agents/skills';
      for (const rel of skillFiles) {
        const content = await fs.readFile(path.join(skillsSrc, rel));
        entries.push({ relPath: path.join(relPrefix, rel).replace(/\\/g, '/'), hash: sha256(content) });
      }
      console.log(chalk.green(`  ✓ ${isGlobal ? '~/.agents/skills/' : '.agents/skills/'} (${skillFiles.length} files)`));
    }
  }

  return entries;
}

// ─── Hermes config writer ─────────────────────────────────────────────────────
// Hermes reads top-level AGENTS.md from cwd (project only — global installs
// must never create or touch ~/.hermes/SOUL.md, Hermes' own persona file) and
// has no project-scoped skills dir, only ~/.hermes/skills/ (global). The 17
// team-* skills also get a matching ~/.hermes/skill-bundles/<name>.yaml
// (bundle name = skill name, listing just that skill) so they're reachable
// as Hermes skill-bundles, not just skills.
//
// Returns Array<{relPath, hash}> for every file written.
async function writeHermesConfig(projectRoot, modules, chalk, isGlobal, homes, platform, resolvedTeams = true, resolvedDockerCheck = false, resolvedAwsInfra = false, resolvedUnnamedPm = false, resolvedDotnet = false, resolvedElectron = false, resolvedTauri = false, resolvedStrands = false) {
  const entries = [];
  const flags = { resolvedTeams, resolvedDockerCheck, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands, resolvedAwsInfra, resolvedUnnamedPm };

  // ── AGENTS.md ── project only (see rationale above for skipping global).
  if (!isGlobal) {
    const rulesPath = path.join(projectRoot, 'AGENTS.md');
    await migrateOldClaudeMd(rulesPath);
    const result = await upsertManagedBlock(rulesPath, '<!-- arcwright-agent-start -->', '<!-- arcwright-agent-end -->', buildArcwrightRulesEntry(modules));
    if (result === 'created') console.log(chalk.green('  ✓ AGENTS.md created'));
    else if (result !== 'noop') console.log(chalk.green('  ✓ AGENTS.md updated'));
    else console.log(chalk.gray('  ○ AGENTS.md already up to date'));
  }

  // ── Skills + skill-bundles ── global only.
  if (isGlobal) {
    const skillsSrc = path.join(SRC_DIR, '.agents', 'skills');
    const skillsDest = resolveToolPath('hermes', GLOBAL_PATHS.hermes.skills, true, homes, platform);

    if (await fs.pathExists(skillsSrc)) {
      if (path.resolve(skillsSrc) === path.resolve(skillsDest)) {
        console.log(chalk.gray('  ○ .agents/skills/ already the source (skipped copy)'));
      } else {
        await fs.ensureDir(skillsDest);
        await fs.copy(skillsSrc, skillsDest, { overwrite: true, filter: skillCopyFilter(flags) });
        const allSkillFiles = await glob('**/*', { cwd: skillsSrc, nodir: true });
        const skillFiles = filterSkillFiles(allSkillFiles, flags);
        for (const rel of skillFiles) {
          const content = await fs.readFile(path.join(skillsSrc, rel));
          entries.push({ relPath: path.join('.hermes/skills', rel).replace(/\\/g, '/'), hash: sha256(content) });
        }
        console.log(chalk.green(`  ✓ ~/.hermes/skills/ (${skillFiles.length} files)`));

        if (resolvedTeams) {
          const bundlesDest = resolveToolPath('hermes', GLOBAL_PATHS.hermes.skillBundles, true, homes, platform);
          await fs.ensureDir(bundlesDest);
          const teamSkillNames = [...new Set(
            skillFiles.map(f => f.split('/')[0]).filter(name => /^team-/.test(name))
          )];
          for (const name of teamSkillNames) {
            const bundleContent = `name: ${name}\nskills:\n  - ${name}\n`;
            await fs.writeFile(path.join(bundlesDest, `${name}.yaml`), bundleContent, 'utf8');
            entries.push({ relPath: `.hermes/skill-bundles/${name}.yaml`, hash: sha256(bundleContent) });
          }
          if (teamSkillNames.length) {
            console.log(chalk.green(`  ✓ ~/.hermes/skill-bundles/ (${teamSkillNames.length} bundles)`));
          }
        }
      }
    }
  }

  return entries;
}

// ─── OpenCode config writer ───────────────────────────────────────────────────
// OpenCode natively reads the exact formats Arcwright already ships, with zero
// content adaptation: AGENTS.md (same file/markers as Codex/Hermes), SKILL.md
// skills at .agents/skills (project) and ~/.agents/skills (global), and Claude
// Code command files (.claude/commands/*.md → .opencode/commands/, verbatim).
//
// Returns Array<{relPath, hash}> for every file written.
async function writeOpenCodeConfig(projectRoot, modules, chalk, isGlobal, homes, platform, resolvedTeams = true, resolvedDockerCheck = false, resolvedAwsInfra = false, resolvedUnnamedPm = false, resolvedDotnet = false, resolvedElectron = false, resolvedTauri = false, resolvedStrands = false) {
  const entries = [];
  const flags = { resolvedTeams, resolvedDockerCheck, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands, resolvedAwsInfra, resolvedUnnamedPm };

  // ── AGENTS.md ── managed block only (not manifest-tracked, same rationale as Codex).
  const rulesPath = isGlobal
    ? resolveToolPath('opencode', GLOBAL_PATHS.opencode.claudeMd, true, homes, platform)
    : path.join(projectRoot, 'AGENTS.md');
  const label = isGlobal ? '~/.config/opencode/AGENTS.md' : 'AGENTS.md';
  await migrateOldClaudeMd(rulesPath);
  const result = await upsertManagedBlock(rulesPath, '<!-- arcwright-agent-start -->', '<!-- arcwright-agent-end -->', buildArcwrightRulesEntry(modules));
  if (result === 'created') console.log(chalk.green(`  ✓ ${label} created`));
  else if (result !== 'noop') console.log(chalk.green(`  ✓ ${label} updated`));
  else console.log(chalk.gray(`  ○ ${label} already up to date`));

  // ── Skills ── OpenCode reads .agents/skills natively (project + ~/.agents/skills global).
  const skillsSrc = path.join(SRC_DIR, '.agents', 'skills');
  const skillsDest = isGlobal
    ? resolveToolPath('opencode', GLOBAL_PATHS.opencode.skills, true, homes, platform)
    : path.join(projectRoot, '.agents', 'skills');
  if (await fs.pathExists(skillsSrc)) {
    if (path.resolve(skillsSrc) === path.resolve(skillsDest)) {
      console.log(chalk.gray('  ○ .agents/skills/ already the source (skipped copy)'));
    } else {
      await fs.ensureDir(skillsDest);
      await fs.copy(skillsSrc, skillsDest, { overwrite: true, filter: skillCopyFilter(flags) });
      const allSkillFiles = await glob('**/*', { cwd: skillsSrc, nodir: true });
      const skillFiles = filterSkillFiles(allSkillFiles, flags);
      // Global entries use a '.opencode/skills' bookkeeping prefix so orphan
      // removal resolves them to ~/.agents/skills without colliding with the
      // '.codex/skills' prefix (which points at the same real path).
      const relPrefix = isGlobal ? '.opencode/skills' : '.agents/skills';
      for (const rel of skillFiles) {
        const content = await fs.readFile(path.join(skillsSrc, rel));
        entries.push({ relPath: path.join(relPrefix, rel).replace(/\\/g, '/'), hash: sha256(content) });
      }
      console.log(chalk.green(`  ✓ ${isGlobal ? '~/.agents/skills/' : '.agents/skills/'} (${skillFiles.length} files)`));
    }
  }

  // ── Commands ── OpenCode natively supports Claude Code's command format.
  const commandsSrc = path.join(SRC_DIR, '.claude', 'commands');
  const commandsDest = isGlobal
    ? resolveToolPath('opencode', GLOBAL_PATHS.opencode.commands, true, homes, platform)
    : path.join(projectRoot, '.opencode', 'commands');
  if (await fs.pathExists(commandsSrc)) {
    await fs.ensureDir(commandsDest);
    await fs.copy(commandsSrc, commandsDest, { overwrite: true });
    const cmdFiles = await glob('**/*', { cwd: commandsSrc, nodir: true });
    for (const rel of cmdFiles) {
      const content = await fs.readFile(path.join(commandsSrc, rel));
      entries.push({ relPath: path.join('.opencode/commands', rel).replace(/\\/g, '/'), hash: sha256(content) });
    }
    console.log(chalk.green(`  ✓ ${isGlobal ? '~/.config/opencode/commands/' : '.opencode/commands/'} (${cmdFiles.length} files)`));
  }

  return entries;
}

// ─── Grok config writer ───────────────────────────────────────────────────────
// Grok (xAI CLI / Grok Build) natively reads:
//   - AGENTS.md / CLAUDE.md (project roots + ~/.grok/ for global rules)
//   - SKILL.md skills at ~/.grok/skills/ (global), .agents/skills/ + .grok/skills/
//     (project; also Claude/Cursor compat paths)
//   - slash commands as flat *.md under ~/.grok/commands/ and .grok/commands/
//     (Claude Code command format, verbatim — same as OpenCode)
//   - agent definitions under ~/.grok/agents/ and .grok/agents/
//
// fs.copy with overwrite merges into dest and does NOT delete files that only
// exist in dest, so Grok's bundled skills under ~/.grok/skills/ (help, docx,
// create-skill, etc.) are preserved across installs.
//
// Returns Array<{relPath, hash}> for every file written.
async function writeGrokConfig(projectRoot, modules, chalk, isGlobal, homes, platform, resolvedTeams = true, resolvedDockerCheck = false, resolvedAwsInfra = false, resolvedUnnamedPm = false, resolvedDotnet = false, resolvedElectron = false, resolvedTauri = false, resolvedStrands = false) {
  const entries = [];
  const flags = { resolvedTeams, resolvedDockerCheck, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands, resolvedAwsInfra, resolvedUnnamedPm };

  // ── AGENTS.md ── managed block only (not manifest-tracked, same rationale as Codex).
  const rulesPath = isGlobal
    ? resolveToolPath('grok', GLOBAL_PATHS.grok.claudeMd, true, homes, platform)
    : path.join(projectRoot, 'AGENTS.md');
  const label = isGlobal ? '~/.grok/AGENTS.md' : 'AGENTS.md';
  await migrateOldClaudeMd(rulesPath);
  const result = await upsertManagedBlock(rulesPath, '<!-- arcwright-agent-start -->', '<!-- arcwright-agent-end -->', buildArcwrightRulesEntry(modules));
  if (result === 'created') console.log(chalk.green(`  ✓ ${label} created`));
  else if (result !== 'noop') console.log(chalk.green(`  ✓ ${label} updated`));
  else console.log(chalk.gray(`  ○ ${label} already up to date`));

  // ── Skills ── global → ~/.grok/skills/; project → .agents/skills/ (Grok scans
  // both .agents/skills and .grok/skills; .agents/skills is shared with Codex/
  // OpenCode so multi-tool project installs do not duplicate skill trees).
  const skillsSrc = path.join(SRC_DIR, '.agents', 'skills');
  const skillsDest = isGlobal
    ? resolveToolPath('grok', GLOBAL_PATHS.grok.skills, true, homes, platform)
    : path.join(projectRoot, '.agents', 'skills');
  if (await fs.pathExists(skillsSrc)) {
    if (path.resolve(skillsSrc) === path.resolve(skillsDest)) {
      console.log(chalk.gray('  ○ .agents/skills/ already the source (skipped copy)'));
    } else {
      await fs.ensureDir(skillsDest);
      await fs.copy(skillsSrc, skillsDest, { overwrite: true, filter: skillCopyFilter(flags) });
      const allSkillFiles = await glob('**/*', { cwd: skillsSrc, nodir: true });
      const skillFiles = filterSkillFiles(allSkillFiles, flags);
      const relPrefix = isGlobal ? '.grok/skills' : '.agents/skills';
      for (const rel of skillFiles) {
        const content = await fs.readFile(path.join(skillsSrc, rel));
        entries.push({ relPath: path.join(relPrefix, rel).replace(/\\/g, '/'), hash: sha256(content) });
      }
      console.log(chalk.green(`  ✓ ${isGlobal ? '~/.grok/skills/' : '.agents/skills/'} (${skillFiles.length} files)`));
    }
  }

  // ── Commands ── Grok treats flat *.md under commands/ as slash commands
  // (Claude Code format, verbatim — same compatibility path OpenCode uses).
  const commandsSrc = path.join(SRC_DIR, '.claude', 'commands');
  const commandsDest = isGlobal
    ? resolveToolPath('grok', GLOBAL_PATHS.grok.commands, true, homes, platform)
    : path.join(projectRoot, '.grok', 'commands');
  if (await fs.pathExists(commandsSrc)) {
    await fs.ensureDir(commandsDest);
    await fs.copy(commandsSrc, commandsDest, { overwrite: true });
    const cmdFiles = await glob('**/*', { cwd: commandsSrc, nodir: true });
    for (const rel of cmdFiles) {
      const content = await fs.readFile(path.join(commandsSrc, rel));
      entries.push({ relPath: path.join('.grok/commands', rel).replace(/\\/g, '/'), hash: sha256(content) });
    }
    console.log(chalk.green(`  ✓ ${isGlobal ? '~/.grok/commands/' : '.grok/commands/'} (${cmdFiles.length} files)`));
  }

  // ── Agent stubs ── Grok loads agent defs from ~/.grok/agents/ (global) and
  // .grok/agents/ (project). Reuse the same lightweight activation stubs Claude
  // Code gets; Grok's agent frontmatter is a compatible superset (name +
  // description + body).
  const agentDest = isGlobal
    ? resolveToolPath('grok', GLOBAL_PATHS.grok.agents, true, homes, platform)
    : path.join(projectRoot, '.grok', 'agents');
  const stubModules = ['awm', 'awb'];
  if (resolvedAwsInfra) stubModules.push('aws-infra');
  if (resolvedUnnamedPm) stubModules.push('unnamed-pm');
  const stubEntries = await writeClaudeAgentStubs(SRC_DIR, agentDest, chalk, stubModules, {
    relPrefix: '.grok/agents',
    logLabel: isGlobal ? '~/.grok/agents/' : '.grok/agents/',
  });
  entries.push(...stubEntries);

  return entries;
}

// ─── Cursor config writer ───────────────────────────────────────────────────
// Cursor's native project integration is MDC rules plus Markdown commands. Its
// Agent CLI also reads root AGENTS.md, so Arcwright writes both surfaces. Cursor
// User Rules are app-managed (not a supported rules directory), therefore a
// global install stages a paste-ready file instead of writing an undocumented
// config location.

function buildCursorRule(modules) {
  return [
    '---',
    'description: Arcwright workflow and skill guidance',
    'alwaysApply: true',
    '---',
    '',
    '<!-- arcwright-cursor-start -->',
    '# Arcwright',
    '',
    `Arcwright is installed for these modules: ${modules.join(', ')}.`,
    '',
    '- Start by reading the root `AGENTS.md`, then load the relevant `SKILL.md` from `.agents/skills/` before applying a matching workflow.',
    '- Arcwright custom commands are available in `.cursor/commands/`; use them when the user invokes an Arcwright slash command.',
    '- Treat commands written for other agents as workflow instructions, not as a requirement to call unavailable tool names. Use Cursor\'s available tools and keep the same verification and handoff intent.',
    '- Keep user-owned instructions and files intact. Do not edit `_arcwright/` workflow assets unless the user explicitly asks to customize Arcwright.',
    '<!-- arcwright-cursor-end -->',
    '',
  ].join('\n');
}

function adaptCursorCommand(content) {
  // Cursor commands are plain Markdown, unlike Claude Code's frontmatter-based
  // command format. Preserve the workflow body while making its argument
  // placeholder understandable to Cursor's command runner.
  return content
    .replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '')
    .replace(/\$ARGUMENTS\b/g, "the user's command input");
}

function filterCommandNames(files, flags) {
  const { resolvedTeams, resolvedDockerCheck, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands, resolvedAwsInfra, resolvedUnnamedPm } = flags;
  return files.filter((f) => {
    if (!resolvedTeams && f === 'team.md') return false;
    if (!resolvedDockerCheck && f === 'docker-check.md') return false;
    if (!resolvedDotnet && f === 'dotnet.md') return false;
    if (!resolvedElectron && f === 'electron.md') return false;
    if (!resolvedTauri && f === 'tauri.md') return false;
    if (!resolvedStrands && f === 'strands.md') return false;
    if (!resolvedAwsInfra && f === 'aws-infra.md') return false;
    if (!resolvedUnnamedPm && f === 'unnamed-pm.md') return false;
    return true;
  });
}

async function writeCursorConfig(projectRoot, modules, chalk, isGlobal, homes, platform, resolvedTeams = true, resolvedDockerCheck = false, resolvedAwsInfra = false, resolvedUnnamedPm = false, resolvedDotnet = false, resolvedElectron = false, resolvedTauri = false, resolvedStrands = false) {
  const entries = [];
  const flags = { resolvedTeams, resolvedDockerCheck, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands, resolvedAwsInfra, resolvedUnnamedPm };
  const rule = buildCursorRule(modules);

  if (isGlobal) {
    const userRulesPath = resolveToolPath('cursor', GLOBAL_PATHS.cursor.userRules, true, homes, platform);
    await fs.ensureDir(path.dirname(userRulesPath));
    await fs.writeFile(userRulesPath, rule, 'utf8');
    entries.push({ relPath: '.cursor/arcwright-user-rules.md', hash: sha256(rule) });
    console.log(chalk.green('  ✓ ~/.cursor/arcwright-user-rules.md staged'));
    console.log(chalk.dim('    Paste it into Cursor Settings → Rules → User Rules; Cursor only supports project-scoped rule files.'));
    return entries;
  }

  // AGENTS.md is read by Cursor Agent CLI, and is a supported simple-rule
  // alternative in the Cursor IDE. Preserve user content outside our block.
  const agentsPath = path.join(projectRoot, 'AGENTS.md');
  const agentsResult = await upsertManagedBlock(agentsPath, '<!-- arcwright-agent-start -->', '<!-- arcwright-agent-end -->', buildArcwrightRulesEntry(modules));
  if (agentsResult === 'created') console.log(chalk.green('  ✓ AGENTS.md created'));
  else if (agentsResult !== 'noop') console.log(chalk.green('  ✓ AGENTS.md updated'));
  else console.log(chalk.gray('  ○ AGENTS.md already up to date'));

  const rulesPath = path.join(projectRoot, '.cursor', 'rules', 'arcwright.mdc');
  await fs.ensureDir(path.dirname(rulesPath));
  await fs.writeFile(rulesPath, rule, 'utf8');
  entries.push({ relPath: '.cursor/rules/arcwright.mdc', hash: sha256(rule) });
  console.log(chalk.green('  ✓ .cursor/rules/arcwright.mdc updated'));

  const commandsSrc = path.join(SRC_DIR, '.claude', 'commands');
  const commandsDest = path.join(projectRoot, '.cursor', 'commands');
  if (await fs.pathExists(commandsSrc)) {
    await fs.ensureDir(commandsDest);
    const allFiles = (await fs.readdir(commandsSrc)).filter((f) => f.endsWith('.md'));
    const files = filterCommandNames(allFiles, flags);
    for (const f of files) {
      const adapted = adaptCursorCommand(await fs.readFile(path.join(commandsSrc, f), 'utf8'));
      await fs.writeFile(path.join(commandsDest, f), adapted, 'utf8');
      entries.push({ relPath: `.cursor/commands/${f}`, hash: sha256(adapted) });
    }
    console.log(chalk.green(`  ✓ ${files.length} Cursor commands → .cursor/commands/`));
  }

  return entries;
}

// ─── Gitignore writer ─────────────────────────────────────────────────────────

/**
 * Append (or replace) a managed Arcwright block in .gitignore.
 * Uses sentinel comments to idempotently update on re-run.
 * NEVER runs git add or git commit — only writes the file.
 *
 * Modes:
 *   'full'        — ignore all Arcwright-installed dirs/files
 *   'skills'      — ignore only _arcwright-output/ and .agents/skills/
 *   'output-only' — ignore only _arcwright-output/ (recommended default)
 *   'none'        — no-op (caller skips this call)
 */
async function updateGitignore(projectRoot, mode, chalk) {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  const START = '# ─── Arcwright installation ──────────────────────────────────────────';
  const END   = '# ─── end arcwright ───────────────────────────────────────────────────';

  const BLOCKS = {
    'full': [
      '_arcwright/',
      '_arcwright-output/',
      '.agents/skills/',
      '.claude/commands/arcwright-*.md',
      '.claude/commands/herdr.md',
      '.claude/commands/gsudo.md',
      '.claude/commands/team.md',
      '.claude/commands/dry*.md',
      '.claude/commands/ux-*.md',
      '.claude/commands/security-review.md',
      '.claude/commands/sec-loop.md',
      '.claude/commands/design.md',
      '.claude/commands/playwright.md',
      '.claude/commands/audit-site.md',
      '.claude/commands/diagram.md',
      '.claude/commands/triage.md',
      '.claude/commands/docker-check.md',
      '.claude/commands/dotnet.md',
      '.claude/commands/electron.md',
      '.claude/commands/tauri.md',
      '.claude/commands/strands.md',
      '.claude/agents/arcwright-*.md',
      '.kiro/agents/',
      '.kiro/skills/',
      '.kiro/steering/arcwright-*.md',
      '.cursor/rules/arcwright.mdc',
      '.cursor/commands/',
    ],
    'skills': [
      '_arcwright-output/',
      '.agents/skills/',
      '.kiro/skills/',
    ],
    'output-only': [
      '_arcwright-output/',
    ],
    'none': [],
  };

  const entries = BLOCKS[mode] || [];
  if (entries.length === 0) return;

  const newBlock = `${START}\n${entries.join('\n')}\n${END}\n`;

  let existing = '';
  try { existing = fs.readFileSync(gitignorePath, 'utf8'); } catch { /* no .gitignore yet */ }

  // Replace existing block if present, else append
  const blockRe = new RegExp(`${escapeRe(START)}[\\s\\S]*?${escapeRe(END)}\\n?`, 'm');
  const updated = blockRe.test(existing)
    ? existing.replace(blockRe, newBlock)
    : (existing.trimEnd() + (existing ? '\n\n' : '') + newBlock);

  fs.writeFileSync(gitignorePath, updated, 'utf8');
  console.log(chalk.green(`  ✓ .gitignore updated (mode: ${mode})`));
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ─── Install ─────────────────────────────────────────────────────────────────

async function install(opts) {
  const {
    directory = process.cwd(),
    modules = 'awm,awb,core,_memory',
    tools = 'claude-code',
    userName = '',
    outputFolder = '_arcwright-output',
    action = 'install',
    yes = false,
    teams = true,  // include team-* skills and /team command
    dockerCheck = false,  // include docker-type-check skill and /docker-check command
    dotnet = false,  // include curated dotnet-* skills and /dotnet command
    electron = false,  // include curated electron-* skills and /electron command
    tauri = false,  // include curated tauri-* skills and /tauri command
    strands = false,  // include curated strands-* skills and /strands command
    awsInfra = false,  // include aws-infra module + aws-serverless-cdk skill + /aws-infra command
    unnamedPm = false,  // include unnamed-pm module + unnamed-pm-sync skill + /unnamed-pm command
    gitignore = null,  // null | 'full' | 'skills' | 'output-only' | 'none'
    tmux = null,   // null = interactive prompt, true/false = explicit
    migrateBmad = null,  // null = prompt if bmad detected; true/false = explicit
    openrouterLaunchers = null, // legacy alias for modelLaunchers
    modelLaunchers = null, // null = interactive prompt, true/false = explicit
    modelSurface = null, // Hermes + OmniRoute primary model surface
    omnirouteBaseUrl = '',
    omnirouteApiKey = '',
    omnirouteModel = DEFAULT_OMNIROUTE_MODEL,
    channel = 'stable', // release channel: 'stable' | 'next'
    hooks = null, // Claude Code hooks to seed: null = prompt | 'none' | 'safe' | 'full'
  } = opts;
  // Validate channel — silently clamp unknown values to 'stable'
  const resolvedChannel = (channel === 'next') ? 'next' : 'stable';
  // Hooks mode: null = decide interactively (or 'none' with --yes); explicit flag wins.
  let resolvedHooks = ['none', 'safe', 'full'].includes(hooks) ? hooks : null;
  let resolvedGitignore = gitignore;
  let resolvedTmux = typeof tmux === 'boolean' ? tmux : null;
  // --model-launchers is the primary flag; --openrouter-launchers is a kept alias.
  const launchersFlag = typeof modelLaunchers === 'boolean' ? modelLaunchers
    : (typeof openrouterLaunchers === 'boolean' ? openrouterLaunchers : null);
  let resolvedOpenrouterLaunchers = launchersFlag;
  let resolvedModelSurface = typeof modelSurface === 'boolean' ? modelSurface : null;

  let isGlobal = opts.global || false;

  const projectRoot = path.resolve(directory);
  const chalk = (await import('chalk')).default;

  // Detect or ask platform
  let platform = null;
  platform = detectPlatform();

  // Resolve homes for cross-platform path resolution
  const homes = getHomes(platform);

  // Determine arcwrightDir — project or global
  const arcwrightDir = isGlobal
    ? path.join(homes.linux, '.arcwright')
    : path.join(projectRoot, '_arcwright');

  // ── Detect existing installation ──────────────────────────────────────────
  const existingManifest = await readManifest(arcwrightDir);
  if (existingManifest?.platform) {
    platform = existingManifest.platform;
  }
  const isUpdate = action === 'update' || (action === 'install' && existingManifest != null);
  const effectiveAction = isUpdate ? 'update' : 'install';

  // ── bmad detection + migration (project installs only) ────────────────────
  // Detect a legacy bmad install, confirm, and migrate (before installing
  // Arcwright files). Returns { migratedAt } only when a migration ran.
  const manifestExtras = await runBmadMigrationIfNeeded({
    migrateBmad, yes, isGlobal, projectRoot, existingManifest, chalk,
  });

  // ── Interactive prompts ───────────────────────────────────────────────────
  let resolvedUserName = userName;

  // Resolve tools/teams/dockerCheck — for --yes updates, fall back to manifest values
  // when CLI flags were not explicitly provided (Commander sets defaults that are
  // indistinguishable from explicit flags, so we use manifest when value == default).
  const manifestFallback = yes && isUpdate && existingManifest;

  // Restore channel from manifest on --yes updates (so re-runs preserve the chosen channel).
  let resolvedChannelFinal = resolvedChannel;
  if (manifestFallback && resolvedChannel === 'stable' && existingManifest.channel) {
    resolvedChannelFinal = existingManifest.channel;
  }
  // Restore hooks mode from manifest on --yes updates (so re-runs preserve choice).
  if (manifestFallback && resolvedHooks === null && existingManifest.hooks) {
    resolvedHooks = existingManifest.hooks;
  }
  if (manifestFallback && resolvedModelSurface === null && existingManifest.modelSurface !== undefined) {
    resolvedModelSurface = existingManifest.modelSurface === true;
  }
  if (manifestFallback && resolvedOpenrouterLaunchers === null && existingManifest.modelLaunchers !== undefined) {
    resolvedOpenrouterLaunchers = existingManifest.modelLaunchers === true;
  }

  // Restore userName from manifest on --yes updates (so config.yaml gets the right name
  // if it needs to be created, e.g. old global install that pre-dates config.yaml writing).
  if (manifestFallback && !resolvedUserName && existingManifest.userName) {
    resolvedUserName = existingManifest.userName;
  }
  let resolvedTools = (() => {
    let parsed;
    try {
      parsed = tools ? parseToolIds(tools) : [];
    } catch (err) {
      console.error(chalk.red(`\n  ✗ ${err.message}\n`));
      process.exit(1);
    }
    if (manifestFallback && parsed.join(',') === 'claude-code' && existingManifest.tools?.length) {
      // CLI default — prefer manifest value
      return existingManifest.tools;
    }
    return parsed.length ? parsed : ['claude-code'];
  })();
  let resolvedModules = (() => {
    const parsed = modules.split(',').map(m => m.trim()).filter(Boolean);
    if (manifestFallback && parsed.join(',') === 'awm,awb,core,_memory' && existingManifest.modules?.length) {
      // CLI default — prefer manifest value. Opt-in modules (aws-infra,
      // unnamed-pm) are excluded here; their own resolved flags re-add them.
      return existingManifest.modules.filter(m => m !== 'aws-infra' && m !== 'unnamed-pm');
    }
    return parsed;
  })();
  let resolvedTeams = (() => {
    // teams===false means --no-teams was explicitly passed; teams===true is the default
    if (manifestFallback && teams !== false && existingManifest.teams !== undefined) {
      return existingManifest.teams !== false;
    }
    return teams !== false;
  })();
  let resolvedDockerCheck = (() => {
    // dockerCheck===true means --docker-check was explicitly passed; false is the default
    if (manifestFallback && dockerCheck !== true && existingManifest.dockerCheck !== undefined) {
      return existingManifest.dockerCheck === true;
    }
    return dockerCheck === true;
  })();
  let resolvedDotnet = (() => {
    // dotnet===true means --dotnet was explicitly passed; false is the default
    if (manifestFallback && dotnet !== true && existingManifest.dotnet !== undefined) {
      return existingManifest.dotnet === true;
    }
    return dotnet === true;
  })();
  let resolvedElectron = (() => {
    // electron===true means --electron was explicitly passed; false is the default
    if (manifestFallback && electron !== true && existingManifest.electron !== undefined) {
      return existingManifest.electron === true;
    }
    return electron === true;
  })();
  let resolvedTauri = (() => {
    // tauri===true means --tauri was explicitly passed; false is the default
    if (manifestFallback && tauri !== true && existingManifest.tauri !== undefined) {
      return existingManifest.tauri === true;
    }
    return tauri === true;
  })();
  let resolvedStrands = (() => {
    // strands===true means --strands was explicitly passed; false is the default
    if (manifestFallback && strands !== true && existingManifest.strands !== undefined) {
      return existingManifest.strands === true;
    }
    return strands === true;
  })();
  let resolvedAwsInfra = (() => {
    if (manifestFallback && awsInfra !== true && existingManifest.awsInfra !== undefined) {
      return existingManifest.awsInfra === true;
    }
    return awsInfra === true;
  })();
  let resolvedUnnamedPm = (() => {
    if (manifestFallback && unnamedPm !== true && existingManifest.unnamedPm !== undefined) {
      return existingManifest.unnamedPm === true;
    }
    return unnamedPm === true;
  })();

  if (!yes) {
    const { intro, text, multiselect, select, confirm, outro, isCancel, cancel } = require('@clack/prompts');
    intro(chalk.bold.cyan(`Arcwright — ${isUpdate ? 'Update' : 'Install'}`));

    if (isUpdate && existingManifest) {
      console.log(chalk.dim(`  Existing installation: v${existingManifest.version || '?'}`));
      console.log(chalk.dim(`  Installed: ${existingManifest.installDate || '?'}\n`));
    }

    // Platform selection — always ask if not already stored in manifest
    if (!existingManifest?.platform) {
      const platformMap = { 'windows-wsl': 'Windows (WSL2)', 'linux-native': 'Linux (native — Fedora/Ubuntu/Arch)', 'macos': 'macOS' };
      const confirmedPlatform = await select({
        message: `Detected platform: ${platformMap[platform]}. Is this correct?`,
        options: [
          { value: platform, label: `✓ Yes — ${platformMap[platform]}` },
          { value: 'windows-wsl', label: 'Windows (WSL2)' },
          { value: 'linux-native', label: 'Linux (native — Fedora/Ubuntu/Arch)' },
          { value: 'macos', label: 'macOS' },
        ],
        initialValue: platform,
      });
      if (isCancel(confirmedPlatform)) { cancel('Installation cancelled.'); process.exit(0); }
      platform = confirmedPlatform;
    }

    // Scope selection — only ask if --global wasn't passed
    if (!isGlobal) {
      const scopeChoice = await select({
        message: 'Install scope:',
        options: [
          { value: 'project', label: 'This project only', hint: 'installs to project directory' },
          { value: 'global', label: 'Global', hint: 'installs to ~/.claude/, ~/.kiro/, etc.' },
        ],
        initialValue: 'project',
      });
      if (isCancel(scopeChoice)) { cancel('Installation cancelled.'); process.exit(0); }
      if (scopeChoice === 'global') {
        isGlobal = true;
      }
    }

    if (!resolvedUserName) {
      resolvedUserName = await text({
        message: 'Your name (for config.yaml):',
        placeholder: 'Developer',
        defaultValue: existingManifest?.userName || 'Developer',
      });
      if (isCancel(resolvedUserName)) { process.exit(0); }
    }

    const platformChoices = await multiselect({
      message: 'Which AI tools / IDEs are you installing for?',
      options: getToolPromptOptions(),
      initialValues: existingManifest?.tools || ['claude-code'],
      required: false,
    });
    if (isCancel(platformChoices)) { process.exit(0); }
    if (platformChoices && platformChoices.length > 0) {
      resolvedTools = platformChoices;
    }

    // Hermes + OmniRoute primary model surface. This is independent from the
    // lower-level Hermes integration but selecting it also installs/configures
    // Hermes because Hermes is the user-facing surface.
    if (resolvedModelSurface === null) {
      const surfaceChoice = await confirm({
        message: 'Use Hermes + OmniRoute as the primary model surface? (installs Hermes CLI; routes agent-fallback through grouped Claude/Codex subscriptions with free fallback)',
        initialValue: existingManifest?.modelSurface === true,
      });
      if (isCancel(surfaceChoice)) { process.exit(0); }
      resolvedModelSurface = surfaceChoice;
      if (surfaceChoice && !resolvedTools.includes('hermes')) {
        resolvedTools = [...resolvedTools, 'hermes'];
      }
    }

    // Agent teams opt-in — 17 team-* skills + /team slash command
    const teamsChoice = await confirm({
      message: 'Install agent teams? (17 pre-built multi-agent compositions + /team command, in-process by default)',
      initialValue: existingManifest?.teams !== false,
    });
    if (isCancel(teamsChoice)) { process.exit(0); }
    resolvedTeams = teamsChoice;

    // Docker type-check opt-in — docker-type-check skill + /docker-check command
    const dockerCheckChoice = await confirm({
      message: 'Install /docker-check? (runs TypeScript type-check inside the project\'s Docker container — only useful if your project has a Dockerfile with tsc)',
      initialValue: existingManifest?.dockerCheck === true,
    });
    if (isCancel(dockerCheckChoice)) { process.exit(0); }
    resolvedDockerCheck = dockerCheckChoice;

    // .NET opt-in — curated dotnet-* skills + /dotnet command (vendored from dotnet/skills, MIT)
    const dotnetChoice = await confirm({
      message: 'Install .NET skills? (curated dotnet-* — P/Invoke/native interop, Native AOT, MSBuild, local SDK — only useful for .NET / C# projects)',
      initialValue: existingManifest?.dotnet === true,
    });
    if (isCancel(dotnetChoice)) { process.exit(0); }
    resolvedDotnet = dotnetChoice;

    // Electron opt-in — curated electron-* skills + /electron command (original works from electronjs.org docs)
    const electronChoice = await confirm({
      message: 'Install Electron skills? (curated electron-* — security baseline, IPC, packaging, auto-updates, performance, native modules — only useful for Electron desktop apps)',
      initialValue: existingManifest?.electron === true,
    });
    if (isCancel(electronChoice)) { process.exit(0); }
    resolvedElectron = electronChoice;

    // Tauri opt-in — curated tauri-* skills + /tauri command (original works from v2.tauri.app docs)
    const tauriChoice = await confirm({
      message: 'Install Tauri v2 skills? (curated tauri-* — architecture, commands/IPC, capabilities/ACL, plugins, distribution, mobile — only useful for Tauri desktop/mobile apps)',
      initialValue: existingManifest?.tauri === true,
    });
    if (isCancel(tauriChoice)) { process.exit(0); }
    resolvedTauri = tauriChoice;

    // AWS Strands Agents opt-in — curated strands-* skills + /strands command
    const strandsChoice = await confirm({
      message: 'Install AWS Strands Agents skills? (curated strands-*, only useful if you build agents with the Strands SDK on AWS)',
      initialValue: existingManifest?.strands === true,
    });
    if (isCancel(strandsChoice)) { process.exit(0); }
    resolvedStrands = strandsChoice;

    // AWS serverless infrastructure opt-in — aws-infra module + aws-serverless-cdk skill + /aws-infra
    const awsInfraChoice = await confirm({
      message: 'Install the AWS-Infra module? (AWS serverless architect agent + aws-serverless-cdk skill + /aws-infra — CDK, Lambda, DynamoDB, EventBridge knowledge)',
      initialValue: existingManifest?.awsInfra === true,
    });
    if (isCancel(awsInfraChoice)) { process.exit(0); }
    resolvedAwsInfra = awsInfraChoice;

    // Unnamed Development PM opt-in — unnamed-pm module + unnamed-pm-sync skill + /unnamed-pm
    const unnamedPmChoice = await confirm({
      message: 'Install the Unnamed-PM module? (PM-sync agent + unnamed-pm-sync skill + /unnamed-pm — keeps projects/milestones/issues in sync via the unnamed-development MCP)',
      initialValue: existingManifest?.unnamedPm === true,
    });
    if (isCancel(unnamedPmChoice)) { process.exit(0); }
    resolvedUnnamedPm = unnamedPmChoice;

    // tmux setup removed — Herdr replaces it (herdr.dev). No prompt.

    // Claude Code direct-provider launchers. Kept for users who explicitly want
    // separate Claude launcher functions; Hermes + OmniRoute is the preferred
    // model surface for grouped subscriptions.
    if (resolvedTools.includes('claude-code') && resolvedOpenrouterLaunchers === null) {
      const orChoice = await confirm({
        message: 'Also install legacy Claude direct-provider launchers? (claude-glm, claude-minimax, claude-qwen, claude-sub; Hermes + OmniRoute is preferred)',
        initialValue: false,
      });
      if (isCancel(orChoice)) { process.exit(0); }
      resolvedOpenrouterLaunchers = orChoice;
    }

    // Gitignore mode — only for project installs (global installs don't touch .gitignore)
    if (!isGlobal && resolvedGitignore === null) {
      const gitignoreChoice = await select({
        message: 'How should Arcwright files be handled in git?',
        options: [
          { value: 'output-only', label: 'Commit config + skills, ignore only _arcwright-output/ (recommended)' },
          { value: 'skills',      label: 'Commit config, ignore _arcwright-output/ and .agents/skills/' },
          { value: 'full',        label: 'Ignore everything Arcwright installed' },
          { value: 'none',        label: 'Do not modify .gitignore — I will handle it' },
        ],
        initialValue: existingManifest?.gitignore || 'output-only',
      });
      if (isCancel(gitignoreChoice)) { process.exit(0); }
      resolvedGitignore = gitignoreChoice;
    }

    // Autonomy posture (Claude Code hooks + permission mode) — claude-code only,
    // only if not set via flag. Default leans autonomous-with-guardrails.
    if (resolvedTools.includes('claude-code') && resolvedHooks === null) {
      const hooksChoice = await select({
        message: 'How autonomous should Arcwright agents run?',
        options: [
          { value: 'safe', label: 'Autonomous (recommended) — auto-accept edits; guardrails block destructive commands + secret writes; load context on session start' },
          { value: 'full', label: 'Autonomous + typecheck — safe, plus tsc/pyright on every edit (slower, tighter)' },
          { value: 'none', label: 'Conservative — no hooks, ask before edits/commands (Claude Code default)' },
        ],
        initialValue: existingManifest?.hooks || 'safe',
      });
      if (isCancel(hooksChoice)) { process.exit(0); }
      resolvedHooks = hooksChoice;
    }

    outro(`${isUpdate ? 'Updating' : 'Installing'} Arcwright...`);
  }

  // Finalize resolvedHooks BEFORE writeIdeConfig (which writes settings.json).
  // Default autonomy posture is 'safe' (autonomous-with-guardrails); --hooks none
  // opts into the conservative ask-first path.
  if (resolvedHooks === null) resolvedHooks = 'safe';

  // Finalize resolvedTmux — default to true when claude-code is selected (both project + global)
  if (resolvedTmux === null) {
    resolvedTmux = resolvedTools.includes('claude-code');
  }

  // Finalize resolvedOpenrouterLaunchers — default to false (opt-in only)
  if (resolvedOpenrouterLaunchers === null) {
    resolvedOpenrouterLaunchers = false;
  }
  // Finalize model surface — default off, but if enabled make Hermes an
  // installed tool even when --tools omitted it.
  if (resolvedModelSurface === null) {
    resolvedModelSurface = false;
  }
  if (resolvedModelSurface && !resolvedTools.includes('hermes')) {
    resolvedTools = [...resolvedTools, 'hermes'];
  }

  const selectedModules = resolvedModules;

  console.log(`\n${chalk.bold.blue('Arcwright')} ${isUpdate ? 'Update' : 'Install'}`);
  console.log(`  Target:   ${chalk.cyan(isGlobal ? '~/.arcwright (global)' : projectRoot)}`);
  console.log(`  Modules:  ${chalk.cyan(selectedModules.join(', '))}`);
  console.log(`  IDEs:     ${chalk.cyan(resolvedTools.join(', ') || 'none')}\n`);

  // ── Module install ────────────────────────────────────────────────────────
  const modulesToInstall = new Set(['core', ...selectedModules]);
  if (selectedModules.includes('awm') || selectedModules.includes('awb')) {
    modulesToInstall.add('_memory');
  }
  // Optional opt-in modules — gated by their own flags, never part of the
  // default --modules set. Each ships its own config.yaml (preserved on update).
  if (resolvedAwsInfra) modulesToInstall.add('aws-infra');
  if (resolvedUnnamedPm) modulesToInstall.add('unnamed-pm');

  const newFileEntries = [];
  let installedCount = 0;

  // Recalculate arcwrightDir after scope may have changed interactively
  const effectiveArwDir = isGlobal
    ? path.join(homes.linux, '.arcwright')
    : path.join(projectRoot, '_arcwright');

  for (const mod of modulesToInstall) {
    const srcMod = path.join(SRC_DIR, mod);
    if (!await fs.pathExists(srcMod)) {
      console.log(chalk.yellow(`  ⚠ Module '${mod}' not found in package src/`));
      continue;
    }

    const destMod = path.join(effectiveArwDir, mod);

    // Preserve config.yaml on update
    const configDest = path.join(destMod, 'config.yaml');
    let existingConfig = null;
    if (isUpdate && await fs.pathExists(configDest)) {
      existingConfig = await fs.readFile(configDest, 'utf8');
    }

    await fs.ensureDir(destMod);
    await fs.copy(srcMod, destMod, { overwrite: true });

    if (existingConfig) {
      await fs.writeFile(configDest, existingConfig, 'utf8');
    }

    const files = await glob('**/*', { cwd: srcMod, nodir: true });
    for (const rel of files) {
      const content = await fs.readFile(path.join(srcMod, rel));
      newFileEntries.push({ relPath: path.join(mod, rel).replace(/\\/g, '/'), hash: sha256(content) });
    }
    installedCount += files.length;
    console.log(chalk.green(`  ✓ ${mod} (${files.length} files)`));
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  const pkgSkillsSrc = path.join(SRC_DIR, '.agents', 'skills');
  if (await fs.pathExists(pkgSkillsSrc)) {
    const destSkills = isGlobal
      ? resolveToolPath('claude-code', '.claude/skills', true, homes, platform)
      : path.join(projectRoot, '.agents', 'skills');
    await fs.ensureDir(destSkills);

    // Filter team-* skills if teams were declined; filter optional add-on skills if not opted in
    const filter = (src) => {
      if (!resolvedTeams && (/[/\\]team-[^/\\]+[/\\]?$/.test(src) || /[/\\]team-[^/\\]+[/\\]/.test(src))) return false;
      if (!resolvedDockerCheck && (/[/\\]docker-type-check[/\\]?$/.test(src) || /[/\\]docker-type-check[/\\]/.test(src))) return false;
      if (!resolvedDotnet && (/[/\\]dotnet-[^/\\]+[/\\]?$/.test(src) || /[/\\]dotnet-[^/\\]+[/\\]/.test(src))) return false;
      if (!resolvedElectron && (/[/\\]electron-[^/\\]+[/\\]?$/.test(src) || /[/\\]electron-[^/\\]+[/\\]/.test(src))) return false;
      if (!resolvedTauri && (/[/\\]tauri-[^/\\]+[/\\]?$/.test(src) || /[/\\]tauri-[^/\\]+[/\\]/.test(src))) return false;
      if (!resolvedStrands && (/[/\\]strands-[^/\\]+[/\\]?$/.test(src) || /[/\\]strands-[^/\\]+[/\\]/.test(src))) return false;
      if (!resolvedAwsInfra && (/[/\\]aws-serverless-cdk[/\\]?$/.test(src) || /[/\\]aws-serverless-cdk[/\\]/.test(src))) return false;
      if (!resolvedUnnamedPm && (/[/\\]unnamed-pm-sync[/\\]?$/.test(src) || /[/\\]unnamed-pm-sync[/\\]/.test(src))) return false;
      return true;
    };

    await fs.copy(pkgSkillsSrc, destSkills, { overwrite: true, filter });
    const allSkillFiles = await glob('**/*', { cwd: pkgSkillsSrc, nodir: true });
    const skillFiles = allSkillFiles.filter(f => {
      if (!resolvedTeams && /^team-/.test(f)) return false;
      if (!resolvedDockerCheck && /^docker-type-check\//.test(f)) return false;
      if (!resolvedDotnet && /^dotnet-/.test(f)) return false;
      if (!resolvedElectron && /^electron-/.test(f)) return false;
      if (!resolvedTauri && /^tauri-/.test(f)) return false;
      if (!resolvedStrands && /^strands-/.test(f)) return false;
      if (!resolvedAwsInfra && /^aws-serverless-cdk\//.test(f)) return false;
      if (!resolvedUnnamedPm && /^unnamed-pm-sync\//.test(f)) return false;
      return true;
    });
    for (const rel of skillFiles) {
      const content = await fs.readFile(path.join(pkgSkillsSrc, rel));
      newFileEntries.push({ relPath: path.join('.agents/skills', rel).replace(/\\/g, '/'), hash: sha256(content) });
    }
    installedCount += skillFiles.length;
    const skippedCount = allSkillFiles.length - skillFiles.length;
    const skipNotes = [];
    if (!resolvedTeams) skipNotes.push('team-*');
    if (!resolvedDockerCheck) skipNotes.push('docker-type-check');
    if (!resolvedDotnet) skipNotes.push('dotnet-*');
    if (!resolvedElectron) skipNotes.push('electron-*');
    if (!resolvedTauri) skipNotes.push('tauri-*');
    if (!resolvedStrands) skipNotes.push('strands-*');
    if (!resolvedAwsInfra) skipNotes.push('aws-serverless-cdk');
    if (!resolvedUnnamedPm) skipNotes.push('unnamed-pm-sync');
    const teamNote = skipNotes.length > 0 ? chalk.dim(` (skipped ${skippedCount} files: ${skipNotes.join(', ')})`) : '';
    console.log(chalk.green(`  ✓ .agents/skills/ (${skillFiles.length} files)`) + teamNote);
  }

  // ── Customization dir scaffold ──────────────────────────────────────────────
  // Create _arcwright/custom/ (or ~/.arcwright/custom/) and seed an example override
  // file on first install. Preserved on update — user owns everything in custom/.
  {
    const customDir = path.join(effectiveArwDir, 'custom');
    await fs.ensureDir(customDir);
    const exampleDest = path.join(customDir, 'example.toml');
    if (!await fs.pathExists(exampleDest)) {
      const exampleSrc = path.join(__dirname, 'templates', 'custom', 'example.toml');
      if (await fs.pathExists(exampleSrc)) {
        await fs.copy(exampleSrc, exampleDest);
        console.log(chalk.green('  ✓ _arcwright/custom/example.toml (customization scaffold)'));
      }
    }
  }

  // ── config.yaml generation ────────────────────────────────────────────────
  // Written for both project and global installs. Global installs write to
  // ~/.arcwright/{mod}/config.yaml. The output_folder uses {project-root} so
  // agents always resolve artifacts into the user's current project directory,
  // regardless of whether Arcwright was installed locally or globally.
  for (const mod of selectedModules) {
    const configPath = path.join(effectiveArwDir, mod, 'config.yaml');
    if (!isUpdate || !await fs.pathExists(configPath)) {
      // Merge onto the module's own shipped config (copied just above) rather
      // than replacing it. buildModuleConfig() only knows the six generic keys;
      // AWM additionally ships project_name, user_skill_level,
      // planning_artifacts, implementation_artifacts, project_knowledge and
      // mcp_standards, which its workflows resolve directly — e.g.
      // `outputFile: '{planning_artifacts}/product-brief-{{project_name}}.md'`.
      // Overwriting dropped all six on every fresh install, leaving those
      // placeholders unresolved across ~170 agent and workflow files.
      let base = {};
      if (await fs.pathExists(configPath)) {
        try { base = yaml.parse(await fs.readFile(configPath, 'utf8')) || {}; }
        catch { base = {}; }
      }
      // Shipped artifact paths hardcode the default output folder; retarget them
      // when the user picked a different one so the preserved keys stay correct.
      if (outputFolder && outputFolder !== '_arcwright-output') {
        for (const [k, v] of Object.entries(base)) {
          if (typeof v === 'string' && v.includes('_arcwright-output')) {
            base[k] = v.split('_arcwright-output').join(outputFolder);
          }
        }
      }
      const config = { ...base, ...buildModuleConfig(mod, resolvedUserName || 'Developer', outputFolder) };
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeFile(configPath, yaml.stringify(config), 'utf8');
      const label = isGlobal ? `~/.arcwright/${mod}/` : `_arcwright/${mod}/`;
      console.log(chalk.green(`  ✓ config.yaml → ${label}`));
    }
  }

  // ── IDE integration ───────────────────────────────────────────────────────
  for (const tool of resolvedTools) {
    if (tool === 'kiro' || tool === 'codex' || tool === 'hermes' || tool === 'opencode' || tool === 'grok' || tool === 'cursor') continue; // handled separately below
    const ideEntries = await writeIdeConfig(tool, projectRoot, selectedModules, chalk, isGlobal, homes, platform, resolvedTeams, resolvedDockerCheck, resolvedAwsInfra, resolvedUnnamedPm, resolvedHooks, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands);
    if (ideEntries && ideEntries.length > 0) {
      newFileEntries.push(...ideEntries);
    }
  }

  // ── Kiro integration ──────────────────────────────────────────────────────
  if (resolvedTools.includes('kiro')) {
    await writeKiroConfig(projectRoot, chalk, isGlobal, homes, platform, resolvedTeams, resolvedDockerCheck, resolvedAwsInfra, resolvedUnnamedPm, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands);
  }

  // ── Codex integration ─────────────────────────────────────────────────────
  if (resolvedTools.includes('codex')) {
    const codexEntries = await writeCodexConfig(projectRoot, selectedModules, chalk, isGlobal, homes, platform, resolvedTeams, resolvedDockerCheck, resolvedAwsInfra, resolvedUnnamedPm, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands);
    if (codexEntries && codexEntries.length > 0) {
      newFileEntries.push(...codexEntries);
    }
  }

  // ── Hermes integration ────────────────────────────────────────────────────
  if (resolvedTools.includes('hermes')) {
    const hermesEntries = await writeHermesConfig(projectRoot, selectedModules, chalk, isGlobal, homes, platform, resolvedTeams, resolvedDockerCheck, resolvedAwsInfra, resolvedUnnamedPm, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands);
    if (hermesEntries && hermesEntries.length > 0) {
      newFileEntries.push(...hermesEntries);
    }
    console.log(chalk.bold('\nHermes setup:'));
    await ensureHermesCliInstalled(homes, chalk);
    if (resolvedModelSurface) {
      await setupHermesModelSurface({
        homes,
        chalk,
        baseUrl: omnirouteBaseUrl,
        apiKey: omnirouteApiKey,
        model: omnirouteModel || DEFAULT_OMNIROUTE_MODEL,
      });
    } else {
      console.log(chalk.dim('  · OmniRoute model surface not enabled (pass --model-surface to configure agent-fallback)'));
    }
  }

  // ── OpenCode integration ──────────────────────────────────────────────────
  if (resolvedTools.includes('opencode')) {
    const openCodeEntries = await writeOpenCodeConfig(projectRoot, selectedModules, chalk, isGlobal, homes, platform, resolvedTeams, resolvedDockerCheck, resolvedAwsInfra, resolvedUnnamedPm, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands);
    if (openCodeEntries && openCodeEntries.length > 0) {
      newFileEntries.push(...openCodeEntries);
    }
  }

  // ── Grok integration ──────────────────────────────────────────────────────
  if (resolvedTools.includes('grok')) {
    const grokEntries = await writeGrokConfig(projectRoot, selectedModules, chalk, isGlobal, homes, platform, resolvedTeams, resolvedDockerCheck, resolvedAwsInfra, resolvedUnnamedPm, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands);
    if (grokEntries && grokEntries.length > 0) {
      newFileEntries.push(...grokEntries);
    }
  }

  // ── Cursor integration ───────────────────────────────────────────────────
  if (resolvedTools.includes('cursor')) {
    const cursorEntries = await writeCursorConfig(projectRoot, selectedModules, chalk, isGlobal, homes, platform, resolvedTeams, resolvedDockerCheck, resolvedAwsInfra, resolvedUnnamedPm, resolvedDotnet, resolvedElectron, resolvedTauri, resolvedStrands);
    if (cursorEntries && cursorEntries.length > 0) {
      newFileEntries.push(...cursorEntries);
    }
  }

  // ── Orphan removal (update only) ──────────────────────────────────────────
  // Runs AFTER all newFileEntries are collected (modules + skills + IDE entries + commands)
  // so that nothing currently being installed is mistakenly flagged as an orphan.
  // NOTE: _arcwright/overlays/ and _arcwright/_config/agents/*.customize.yaml are
  // project-local and must never be removed by orphan cleanup — they are user-owned.
  if (isUpdate) {
    const oldEntries = await readFilesManifest(effectiveArwDir);
    const newPaths = new Set(newFileEntries.map(e => e.relPath));
    const orphans = oldEntries.filter(e => {
      if (newPaths.has(e.relPath)) return false; // still present in new install
      if (e.relPath.startsWith('overlays/')) return false; // project-local overlays — never remove
      if (e.relPath.endsWith('.customize.yaml')) return false; // user customize overlays — never remove
      return true;
    });

    if (orphans.length > 0) {
      console.log(chalk.dim(`\n  Removing ${orphans.length} orphaned file(s) from previous version:`));
      for (const orphan of orphans) {
        let fullPath;
        if (isGlobal) {
          // Global install: each prefix maps to its real resolved path
          if (orphan.relPath.startsWith('.agents/skills/')) {
            // Skills written to ~/.claude/skills/ for global installs
            const rel = orphan.relPath.slice('.agents/skills/'.length);
            fullPath = path.join(resolveToolPath('claude-code', '.claude/skills', true, homes, platform), rel);
          } else if (orphan.relPath.startsWith('.claude/')) {
            // .claude/agents/, .claude/commands/, etc. — resolve from terminal home
            fullPath = resolveToolPath('claude-code', orphan.relPath, true, homes, platform);
          } else if (orphan.relPath.startsWith('.codex/skills/')) {
            // Bookkeeping prefix only — Codex's global skills actually live at
            // $HOME/.agents/skills/, not ~/.codex/skills/ (see GLOBAL_PATHS.codex).
            const rel = orphan.relPath.slice('.codex/skills/'.length);
            fullPath = path.join(resolveToolPath('codex', GLOBAL_PATHS.codex.skills, true, homes, platform), rel);
          } else if (orphan.relPath.startsWith('.codex/')) {
            fullPath = resolveToolPath('codex', orphan.relPath, true, homes, platform);
          } else if (orphan.relPath.startsWith('.hermes/skill-bundles/')) {
            const rel = orphan.relPath.slice('.hermes/skill-bundles/'.length);
            fullPath = path.join(resolveToolPath('hermes', GLOBAL_PATHS.hermes.skillBundles, true, homes, platform), rel);
          } else if (orphan.relPath.startsWith('.hermes/skills/')) {
            const rel = orphan.relPath.slice('.hermes/skills/'.length);
            fullPath = path.join(resolveToolPath('hermes', GLOBAL_PATHS.hermes.skills, true, homes, platform), rel);
          } else if (orphan.relPath.startsWith('.opencode/skills/')) {
            // Bookkeeping prefix — OpenCode's global skills live at $HOME/.agents/skills/.
            const rel = orphan.relPath.slice('.opencode/skills/'.length);
            fullPath = path.join(resolveToolPath('opencode', GLOBAL_PATHS.opencode.skills, true, homes, platform), rel);
          } else if (orphan.relPath.startsWith('.opencode/commands/')) {
            const rel = orphan.relPath.slice('.opencode/commands/'.length);
            fullPath = path.join(resolveToolPath('opencode', GLOBAL_PATHS.opencode.commands, true, homes, platform), rel);
          } else if (orphan.relPath.startsWith('.grok/skills/')) {
            const rel = orphan.relPath.slice('.grok/skills/'.length);
            fullPath = path.join(resolveToolPath('grok', GLOBAL_PATHS.grok.skills, true, homes, platform), rel);
          } else if (orphan.relPath.startsWith('.grok/commands/')) {
            const rel = orphan.relPath.slice('.grok/commands/'.length);
            fullPath = path.join(resolveToolPath('grok', GLOBAL_PATHS.grok.commands, true, homes, platform), rel);
          } else if (orphan.relPath.startsWith('.grok/agents/')) {
            const rel = orphan.relPath.slice('.grok/agents/'.length);
            fullPath = path.join(resolveToolPath('grok', GLOBAL_PATHS.grok.agents, true, homes, platform), rel);
          } else if (orphan.relPath.startsWith('.grok/')) {
            fullPath = resolveToolPath('grok', orphan.relPath, true, homes, platform);
          } else if (orphan.relPath.startsWith('.cursor/')) {
            fullPath = resolveToolPath('cursor', orphan.relPath, true, homes, platform);
          } else {
            // _arcwright/ module files — in ~/.arcwright/
            fullPath = path.join(effectiveArwDir, orphan.relPath);
          }
        } else {
          // Project install: _arcwright/ files use effectiveArwDir; others use projectRoot
          if (orphan.relPath.startsWith('.agents/') || orphan.relPath.startsWith('.claude/') || orphan.relPath.startsWith('.opencode/') || orphan.relPath.startsWith('.grok/') || orphan.relPath.startsWith('.cursor/')) {
            fullPath = path.join(projectRoot, orphan.relPath);
          } else {
            fullPath = path.join(effectiveArwDir, orphan.relPath);
          }
        }
        if (await fs.pathExists(fullPath)) {
          await fs.remove(fullPath);
          await removeEmptyDirsUpward(fullPath);
          console.log(chalk.dim(`    ✗ ${orphan.relPath}`));
        }
      }
    }
  }

  // Configure an existing Herdr install; Herdr itself remains user-installed.
  // Herdr session restore is agent-agnostic once integrations are installed.
  // Trigger for any terminal CLI we wire resume support for.
  if (resolvedTools.some((tool) => ['claude-code', 'codex', 'hermes', 'opencode', 'grok'].includes(tool))) {
    console.log(chalk.bold('\nHerdr setup:'));
    await setupHerdr({ chalk });
  }

  // ── WSL audio (Claude Code /voice — WSL2 + WSLg only, idempotent) ─────────
  if (resolvedTools.includes('claude-code')) {
    await setupWslAudio(platform, chalk);
  }

  // ── Model launchers (opt-in; claude-code only) ────────────────────────────
  if (resolvedOpenrouterLaunchers && resolvedTools.includes('claude-code')) {
    console.log(chalk.bold('\nAlternate-model launchers:'));
    await setupOpenRouterLaunchers(platform, homes, chalk);
  }

  // ── Gitignore update (project installs only, not global) ─────────────────
  // For --yes with no --gitignore flag, default to 'output-only'
  if (!isGlobal) {
    if (resolvedGitignore === null) resolvedGitignore = 'output-only';
    if (resolvedGitignore !== 'none') {
      await updateGitignore(projectRoot, resolvedGitignore, chalk);
    }
  }

  // ── Manifest write ────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const manifest = {
    version: require('../package.json').version,
    installDate: existingManifest?.installDate || now,
    lastUpdated: now,
    userName: resolvedUserName || 'Developer',
    outputFolder: outputFolder || '_arcwright-output',
    platform: platform,
    modules: [...modulesToInstall],
    tools: resolvedTools,
    teams: resolvedTeams,
    dockerCheck: resolvedDockerCheck,
    dotnet: resolvedDotnet,
    electron: resolvedElectron,
    tauri: resolvedTauri,
    strands: resolvedStrands,
    awsInfra: resolvedAwsInfra,
    unnamedPm: resolvedUnnamedPm,
    tmux: resolvedTmux,
    modelSurface: resolvedModelSurface,
    omnirouteBaseUrl: omnirouteBaseUrl || process.env.ARCWRIGHT_OMNIROUTE_BASE_URL || process.env.OMNIROUTE_BASE_URL || DEFAULT_OMNIROUTE_BASE_URL,
    omnirouteModel: omnirouteModel || DEFAULT_OMNIROUTE_MODEL,
    modelLaunchers: resolvedOpenrouterLaunchers,
    openrouterLaunchers: resolvedOpenrouterLaunchers, // legacy alias, kept for older readers
    channel: resolvedChannelFinal || resolvedChannel,  // release channel: 'stable' | 'next'
    hooks: resolvedHooks,  // seeded Claude Code hooks: 'none' | 'safe' | 'full'
    gitignore: isGlobal ? null : resolvedGitignore,
    global: isGlobal,
    // Preserve existing migratedAt if present; add new one if migration ran this session
    ...(existingManifest?.migratedAt ? { migratedAt: existingManifest.migratedAt } : {}),
    ...manifestExtras,
  };

  const manifestDir = isGlobal
    ? path.join(homes.linux, '.arcwright')
    : effectiveArwDir;
  await writeManifest(manifestDir, manifest);
  await writeFilesManifest(manifestDir, newFileEntries);

  console.log(`\n${chalk.bold.green('✓ Done!')} ${installedCount} files ${isUpdate ? 'updated' : 'installed'}.`);
  if (isGlobal) {
    console.log(`  Arcwright is ready at ${chalk.cyan('~/.arcwright/')} (global)\n`);
  } else {
    console.log(`  Arcwright is ready at ${chalk.cyan('_arcwright/')}\n`);
  }

  // ── Skill prerequisites ────────────────────────────────────────────────────
  printSkillPrerequisites(chalk);
}

/**
 * Detect a legacy bmad install (project installs only), confirm migration
 * (interactive unless --yes or an explicit --migrate-bmad), and run it before
 * Arcwright files are installed.
 * @returns {Promise<{migratedAt?: string}>} migratedAt set only when a migration ran
 */
async function runBmadMigrationIfNeeded({ migrateBmad, yes, isGlobal, projectRoot, existingManifest, chalk }) {
  let resolvedMigrateBmad = typeof migrateBmad === 'boolean' ? migrateBmad : null;
  const bmadDetected = !isGlobal ? detectBmad(projectRoot) : { present: false, signals: [] };
  // If the manifest already records a migration, skip re-prompting.
  const alreadyMigrated = existingManifest?.migratedAt != null;

  if (!yes && bmadDetected.present && !alreadyMigrated && resolvedMigrateBmad === null) {
    const { confirm, isCancel } = require('@clack/prompts');
    console.log(chalk.yellow('\n  Existing bmad installation detected:'));
    for (const s of bmadDetected.signals) console.log(chalk.dim(`     - ${s}`));
    const migrateChoice = await confirm({
      message: 'Run automatic migration (rename bmad -> arcwright, preserve output dirs)?',
      initialValue: true,
    });
    if (isCancel(migrateChoice)) { process.exit(0); }
    resolvedMigrateBmad = migrateChoice;
  }

  // Default for --yes / non-interactive: migrate if detected and not already migrated.
  if (resolvedMigrateBmad === null) {
    resolvedMigrateBmad = bmadDetected.present && !alreadyMigrated;
  }

  if (resolvedMigrateBmad && !isGlobal && bmadDetected.present) {
    const { migrate } = require('./migrate');
    const result = migrate(projectRoot, false);
    console.log(chalk.green(`\n  Migration complete: ${result.actions.filter(a => a.type !== 'skip').length} changes applied`));
    return { migratedAt: new Date().toISOString() };
  }
  return {};
}

/** Print the optional skill prerequisite hints (playwright-cli, browser-use, gsudo). */
function printSkillPrerequisites(chalk) {
  console.log(chalk.bold('Optional skill prerequisites:'));
  console.log('');
  console.log('  ' + chalk.white('playwright-cli') + chalk.dim(' — deterministic browser automation for QA agent (.agents/skills/playwright-cli/)'));
  console.log('    ' + chalk.cyan('npm install -g @playwright/cli@latest'));
  console.log('    ' + chalk.dim('Then: npx playwright install  # downloads browser binaries'));
  console.log('');
  console.log('  ' + chalk.white('browser-use') + chalk.dim(' — agentic browser exploration / test scaffolding (.agents/skills/browser-use/)'));
  console.log('    ' + chalk.cyan('uv add "browser-use[core]"') + chalk.dim('   # or: pip install "browser-use[core]" (Python >=3.11)'));
  console.log('    ' + chalk.dim('Needs ANTHROPIC_API_KEY in env. Optional — use for unknown/changing UIs; playwright-cli stays the default for known flows.'));
  console.log('');
  console.log('  ' + chalk.white('gsudo') + chalk.dim(' — Windows privilege escalation for git/PowerShell/playwright (.agents/skills/gsudo/)'));
  console.log('    ' + chalk.cyan('winget install gerardog.gsudo') + chalk.dim('  # Windows'));
  console.log('    ' + chalk.cyan('scoop install gsudo') + chalk.dim('            # Windows (Scoop)'));
  console.log('');
}

// ─── Status ───────────────────────────────────────────────────────────────────

async function status(opts) {
  const { directory = process.cwd() } = opts;
  const projectRoot = path.resolve(directory);
  const arcwrightDir = path.join(projectRoot, '_arcwright');
  const chalk = (await import('chalk')).default;

  if (!await fs.pathExists(arcwrightDir)) {
    console.log(chalk.yellow('Arcwright is not installed in this project.'));
    console.log('Run: npx @arcwright-ai/agent-orchestration');
    return;
  }

  const manifest = await readManifest(arcwrightDir);
  console.log(chalk.bold.blue('Arcwright Status'));
  if (manifest) {
    console.log(`  Version:   ${chalk.cyan(manifest.version || '?')}`);
    console.log(`  Installed: ${chalk.dim(manifest.installDate || '?')}`);
    console.log(`  Updated:   ${chalk.dim(manifest.lastUpdated || '?')}`);
    console.log(`  User:      ${chalk.dim(manifest.userName || '?')}`);
    console.log(`  IDEs:      ${chalk.dim((manifest.tools || []).join(', ') || 'none')}\n`);
  }

  // Core modules are reported whether installed or not. The opt-in modules are
  // reported only when present — listing them unconditionally would be noise for
  // the majority who never enable them, but omitting them entirely (as this loop
  // did) made --aws-infra and --unnamed-pm installs invisible to `status`.
  for (const mod of AVAILABLE_MODULES) {
    const modDir = path.join(arcwrightDir, mod);
    if (await fs.pathExists(modDir)) {
      const files = await glob('**/*', { cwd: modDir, nodir: true });
      console.log(`  ${chalk.green('✓')} ${mod} (${files.length} files)`);
    } else {
      console.log(`  ${chalk.gray('○')} ${mod} (not installed)`);
    }
  }
  for (const mod of OPTIONAL_MODULES) {
    const modDir = path.join(arcwrightDir, mod);
    if (!await fs.pathExists(modDir)) continue;
    const files = await glob('**/*', { cwd: modDir, nodir: true });
    console.log(`  ${chalk.green('✓')} ${mod} (${files.length} files)`);
  }

  const filesManifest = await readFilesManifest(arcwrightDir);
  console.log(`\n  ${chalk.dim(`${filesManifest.length} files tracked in manifest`)}`);
}

// ─── Config helpers ───────────────────────────────────────────────────────────

function buildModuleConfig(moduleName, userName, outputFolder) {
  return {
    _note: 'Auto-generated by Arcwright installer — safe to edit',
    user_name: userName,
    communication_language: 'English',
    document_output_language: 'English',
    output_folder: `{project-root}/${outputFolder}`,
    [`${moduleName}_output_folder`]: `{project-root}/${outputFolder}/${moduleName}`,
  };
}

// ─── IDE config writers ───────────────────────────────────────────────────────

async function writeIdeConfig(tool, projectRoot, modules, chalk, isGlobal, homes, platform, resolvedTeams = true, resolvedDockerCheck = false, resolvedAwsInfra = false, resolvedUnnamedPm = false, resolvedHooks = 'none', resolvedDotnet = false, resolvedElectron = false, resolvedTauri = false, resolvedStrands = false) {
  const stubEntries = [];
  const platformCfg = PLATFORMS[tool];
  if (!platformCfg) {
    console.log(chalk.yellow(`  ⚠ Unknown IDE platform: ${tool}`));
    return;
  }

  const arcwrightEntry = buildArcwrightRulesEntry(modules);
  const tmuxEntry = buildTmuxEntry();
  const proactiveEntry = buildProactiveEntry();

  // Write rules/context file
  if (platformCfg.rulesFile) {
    const rulesPath = isGlobal && GLOBAL_PATHS[tool]?.claudeMd
      ? resolveToolPath(tool, GLOBAL_PATHS[tool].claudeMd, true, homes, platform)
      : path.join(projectRoot, platformCfg.rulesFile);

    await fs.ensureDir(path.dirname(rulesPath));

    if (await fs.pathExists(rulesPath)) {
      const existing = await fs.readFile(rulesPath, 'utf8');
      let updated = existing;
      let changed = false;

      if (!existing.includes(platformCfg.rulesMarker)) {
        updated += arcwrightEntry;
        changed = true;
      }
      // Only add the orchestration entry for Claude Code. Treat either the new
      // Herdr heading or the older tmux-opt-in heading as "already present" so an
      // in-place update does not double-add the section.
      if (tool === 'claude-code'
          && !existing.includes('## Agent Spawning (in-process, Herdr pane opt-in)')
          && !existing.includes('## Agent Spawning (in-process, tmux opt-in)')) {
        updated += tmuxEntry;
        changed = true;
      }

      if (changed) {
        await fs.writeFile(rulesPath, updated, 'utf8');
        console.log(chalk.green(`  ✓ ${platformCfg.rulesFile} updated`));
      } else {
        console.log(chalk.gray(`  ○ ${platformCfg.rulesFile} already up to date`));
      }
    } else {
      const header = getFileHeader(tool);
      const content = tool === 'claude-code'
        ? `${header}${arcwrightEntry}${tmuxEntry}`
        : `${header}${arcwrightEntry}`;
      await fs.writeFile(rulesPath, content, 'utf8');
      console.log(chalk.green(`  ✓ ${platformCfg.rulesFile} created`));
    }
  }

  // Write root CLAUDE.md (claude-code only) — upserts managed Arcwright + tmux sections
  if (tool === 'claude-code') {
    const rootClaudePath = isGlobal
      ? resolveToolPath('claude-code', '.claude/CLAUDE.md', true, homes, platform)
      : path.join(projectRoot, 'CLAUDE.md');
    await migrateOldClaudeMd(rootClaudePath);
    const arcwrightResult  = await upsertManagedBlock(rootClaudePath, '<!-- arcwright-agent-start -->',         '<!-- arcwright-agent-end -->',         arcwrightEntry);
    const tmuxResult       = await upsertManagedBlock(rootClaudePath, '<!-- arcwright-orchestration-start -->', '<!-- arcwright-orchestration-end -->', tmuxEntry);
    const proactiveResult  = await upsertManagedBlock(rootClaudePath, '<!-- arcwright-proactive-start -->',     '<!-- arcwright-proactive-end -->',     proactiveEntry);
    const anyChanged  = arcwrightResult !== 'noop' || tmuxResult !== 'noop' || proactiveResult !== 'noop';
    if (anyChanged) {
      console.log(chalk.green(`  ✓ ${isGlobal ? '~/.claude/CLAUDE.md' : 'CLAUDE.md'} updated (stale sections replaced)`));
    } else {
      console.log(chalk.gray(`  ○ ${isGlobal ? '~/.claude/CLAUDE.md' : 'CLAUDE.md'} already up to date`));
    }

    // Write global ~/.claude/CLAUDE.md — applies Arcwright + tmux rules to every project
    if (!isGlobal) {
      await writeGlobalClaudeMd(arcwrightEntry, tmuxEntry, proactiveEntry, chalk);
    }
  }

  // Create _arcwright-output/ folder (output artifacts land here, project installs only)
  if (tool === 'claude-code' && !isGlobal) {
    const outputDir = path.join(projectRoot, '_arcwright-output');
    if (!await fs.pathExists(outputDir)) {
      await fs.ensureDir(outputDir);
      console.log(chalk.green('  ✓ _arcwright-output/ created'));
    } else {
      console.log(chalk.gray('  ○ _arcwright-output/ already exists'));
    }
  }

  // Install .claude/commands/ slash commands (claude-code only)
  if (tool === 'claude-code') {
    const cmdSrc = path.join(SRC_DIR, '.claude', 'commands');
    if (await fs.pathExists(cmdSrc)) {
      const cmdDest = isGlobal
        ? resolveToolPath('claude-code', '.claude/commands', true, homes, platform)
        : path.join(projectRoot, '.claude', 'commands');
      await fs.ensureDir(cmdDest);
      const allFiles = (await fs.readdir(cmdSrc)).filter(f => f.endsWith('.md'));
      const files = allFiles.filter(f => {
        if (!resolvedTeams && f === 'team.md') return false;
        if (!resolvedDockerCheck && f === 'docker-check.md') return false;
        if (!resolvedDotnet && f === 'dotnet.md') return false;
        if (!resolvedElectron && f === 'electron.md') return false;
        if (!resolvedTauri && f === 'tauri.md') return false;
        if (!resolvedStrands && f === 'strands.md') return false;
        if (!resolvedAwsInfra && f === 'aws-infra.md') return false;
        if (!resolvedUnnamedPm && f === 'unnamed-pm.md') return false;
        return true;
      });
      let installed = 0;
      for (const f of files) {
        const srcFile = path.join(cmdSrc, f);
        await fs.copy(srcFile, path.join(cmdDest, f), { overwrite: true });
        // Track in manifest for orphan removal on future updates
        const content = await fs.readFile(srcFile);
        stubEntries.push({ relPath: `.claude/commands/${f}`, hash: sha256(content) });
        installed++;
      }
      if (installed) {
        const skipNotes = [];
        if (!resolvedTeams) skipNotes.push('/team');
        if (!resolvedDockerCheck) skipNotes.push('/docker-check');
        if (!resolvedDotnet) skipNotes.push('/dotnet');
        if (!resolvedElectron) skipNotes.push('/electron');
        if (!resolvedTauri) skipNotes.push('/tauri');
        if (!resolvedStrands) skipNotes.push('/strands');
        if (!resolvedAwsInfra) skipNotes.push('/aws-infra');
        if (!resolvedUnnamedPm) skipNotes.push('/unnamed-pm');
        const skipNote = skipNotes.length > 0 ? chalk.dim(` (skipped ${skipNotes.join(', ')})`) : '';
        console.log(chalk.green(`  ✓ ${installed} slash commands → .claude/commands/`) + skipNote);
      }
    }
  }

  // Write Claude Code settings.json (env vars, permissions)
  if (tool === 'claude-code') {
    const settingsBase = isGlobal
      ? resolveToolPath('claude-code', '.claude', true, homes, platform)
      : path.join(projectRoot, '.claude');
    await writeClaudeSettings(settingsBase, chalk, resolvedHooks, isGlobal);
  }

  // Write per-agent stubs into agent directory (claude-code only for now)
  if (tool === 'claude-code' && platformCfg.agentDir) {
    const agentDir = isGlobal
      ? resolveToolPath('claude-code', GLOBAL_PATHS['claude-code'].agents, true, homes, platform)
      : path.join(projectRoot, platformCfg.agentDir);
    const stubModules = [...modules];
    if (resolvedAwsInfra) stubModules.push('aws-infra');
    if (resolvedUnnamedPm) stubModules.push('unnamed-pm');
    const entries = await writeClaudeAgentStubs(SRC_DIR, agentDir, chalk, stubModules);
    stubEntries.push(...entries);
  }

  return stubEntries;
}

function getFileHeader(tool) {
  switch (tool) {
    default:             return '# Claude Code Configuration — Arcwright\n';
  }
}

/**
 * Skill-listing budget, as a fraction of the context window. Claude Code's own
 * default (0.01) drops skill descriptions for anyone with many skills, which
 * makes those skills undiscoverable.
 *
 * Sized from the actual catalogue rather than guessed. Arcwright ships 152
 * skills whose names + descriptions total ~28.7k characters, roughly 7.2k
 * tokens. The previous 0.03 was chosen when there were "50+" skills and no
 * longer covers that: 3% of a 200k context is 6k tokens, so the listing
 * overflowed and skills were silently truncated at session start. 5% gives 10k
 * tokens at 200k, leaving headroom for the user's own skills on top.
 */
const SKILL_LISTING_BUDGET = 0.05;

/**
 * Earlier defaults this installer wrote. stripInstallerSettingsKeys() must
 * still recognise them, or an uninstall leaves a stale value behind on every
 * machine that installed before the bump.
 */
const LEGACY_SKILL_LISTING_BUDGETS = [0.03];

/**
 * Write / merge .claude/settings.json with Arcwright-required env vars and
 * skill-listing budget. Enables CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS so the
 * SendMessage agent-reuse primitive works out of the box. Sets
 * skillListingBudgetFraction (see SKILL_LISTING_BUDGET) and
 * fallbackModel: ["sonnet"] so overload/flag-fallbacks land on a fast
 * mid-tier model without pinning a version.
 * Merges with any existing settings — never overwrites user values.
 */
async function writeClaudeSettings(claudeDir, chalk, hooksMode = 'none', isGlobal = false) {
  const settingsPath = path.join(claudeDir, 'settings.json');
  await fs.ensureDir(claudeDir);

  let settings = {};
  if (await fs.pathExists(settingsPath)) {
    try {
      settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));
    } catch {
      settings = {};
    }
  }

  const before = JSON.stringify(settings);

  // Ensure env object exists
  settings.env = settings.env || {};

  // Set Agent Teams env var if not already configured.
  // Load-bearing: this env var powers the SendMessage agent-reuse primitive
  // used by the in-process orchestration (claude-subagent-protocol skill).
  // Without it, kept-alive agents can't be re-engaged across turns.
  if (!settings.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS) {
    settings.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1';
  }
  // Disable terminal flicker (alternate rendering path)
  if (!settings.env.CLAUDE_CODE_NO_FLICKER) {
    settings.env.CLAUDE_CODE_NO_FLICKER = '1';
  }

  // Bump skill-listing budget so Arcwright's skills don't get truncated on
  // session start. Only set if the user hasn't customized it already.
  if (settings.skillListingBudgetFraction === undefined) {
    settings.skillListingBudgetFraction = SKILL_LISTING_BUDGET;
  }

  // Set fallbackModel: ["sonnet"] so overload/flag-fallbacks land on a fast
  // mid-tier model without pinning a specific version (per models.md guidance).
  // Only set if user hasn't customized it already.
  if (settings.fallbackModel === undefined) {
    settings.fallbackModel = ['sonnet'];
  }

  // Seed Arcwright hooks (safe|full). Copies guard scripts and idempotently
  // merges hook entries without clobbering user hooks. The guards are what make
  // the autonomous permission posture below safe to run.
  if (hooksMode === 'safe' || hooksMode === 'full') {
    await seedArcwrightHooks(settings, claudeDir, hooksMode, isGlobal);
    // Autonomous posture: auto-accept edits so agents don't stop on every write.
    // Destructive bash + secret writes are still fenced by the guard hooks, and
    // bash itself still prompts (acceptEdits only auto-accepts file edits).
    // Only set if the user hasn't chosen their own permission mode.
    settings.permissions = settings.permissions || {};
    if (!settings.permissions.defaultMode) {
      settings.permissions.defaultMode = 'acceptEdits';
    }
  }

  const after = JSON.stringify(settings);
  if (before !== after) {
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
    const hookNote = (hooksMode === 'safe' || hooksMode === 'full') ? `, hooks=${hooksMode}` : '';
    console.log(chalk.green(`  ✓ .claude/settings.json (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1, CLAUDE_CODE_NO_FLICKER=1, skillListingBudgetFraction=${SKILL_LISTING_BUDGET}, fallbackModel=["sonnet"]${hookNote})`));
  } else {
    console.log(chalk.gray('  ○ .claude/settings.json already up to date'));
  }
}

/**
 * Copy Arcwright hook guard scripts into <claudeDir>/arcwright-hooks/ and merge
 * the corresponding hook entries into settings.hooks. Idempotent: this
 * installer's own entries are replaced in place, so re-runs never duplicate and
 * user hooks are preserved.
 *
 *   safe → PreToolUse(Bash) destructive-command guard
 *          PreToolUse(Write|Edit) secret/key-file guard
 *          SessionStart context-load reminder
 *   full → safe + PostToolUse(Write|Edit) tsc/pyright typecheck
 *
 * OWNERSHIP: an entry is "ours to replace" only if it invokes one of the three
 * scripts this function installs, or is the SessionStart reminder it writes.
 * It is NOT enough for the command to mention the `arcwright-hooks` directory.
 * That directory is shared: the `ci-gates` skill installs gate-lint.js,
 * gate-precommit.js and gate-ci-verify.js into the very same folder, and a repo
 * may add its own guards there too. Treating the directory name as the
 * ownership marker made a routine `agent-orchestration update` silently delete
 * every one of those foreign hooks — including dropping the whole PostToolUse
 * event, since `safe` mode clears it.
 */
const INSTALLER_OWNED_HOOKS = ['guard-bash.js', 'guard-write.js', 'typecheck.js'];
// Stable substring of the SessionStart reminder written below. It carries no
// filename, so it needs its own identifier; keep this in sync with the echo.
const SESSION_START_SENTINEL = 'run the project-context scan';
async function seedArcwrightHooks(settings, claudeDir, mode, isGlobal) {
  const srcDir = path.join(__dirname, 'templates', 'hooks');
  const destDir = path.join(claudeDir, 'arcwright-hooks');
  await fs.ensureDir(destDir);
  for (const f of ['guard-bash.js', 'guard-write.js', 'typecheck.js']) {
    await fs.copy(path.join(srcDir, f), path.join(destDir, f), { overwrite: true });
  }

  // Command path: absolute for global installs (scripts live in ~/.claude);
  // $CLAUDE_PROJECT_DIR-relative for project installs so the repo stays portable.
  const ref = (name) =>
    isGlobal
      ? `node ${JSON.stringify(path.join(destDir, name))}`
      : `node "$CLAUDE_PROJECT_DIR/.claude/arcwright-hooks/${name}"`;

  settings.hooks = settings.hooks || {};

  // True only for an entry this installer itself wrote — see OWNERSHIP above.
  const isOurs = (h) => {
    if (!h || typeof h.command !== 'string') return false;
    if (h.command.includes(SESSION_START_SENTINEL)) return true;
    return (
      h.command.includes('arcwright-hooks') &&
      INSTALLER_OWNED_HOOKS.some((name) => h.command.includes(name))
    );
  };

  // For one event, drop our own previous entries then append fresh ones.
  // Foreign entries (ci-gates gates, project-specific guards) are left alone.
  const setEvent = (event, entries) => {
    const existing = Array.isArray(settings.hooks[event]) ? settings.hooks[event] : [];
    const kept = existing.filter(
      (g) => !(g && Array.isArray(g.hooks) && g.hooks.some(isOurs))
    );
    settings.hooks[event] = [...kept, ...entries];
  };

  const cmd = (command) => ({ type: 'command', command });

  setEvent('PreToolUse', [
    { matcher: 'Bash', hooks: [cmd(ref('guard-bash.js'))] },
    { matcher: 'Write|Edit', hooks: [cmd(ref('guard-write.js'))] },
  ]);

  // SessionStart context reminder — carries the marker so it's replaceable.
  setEvent('SessionStart', [
    { hooks: [cmd(`echo "Arcwright: run the project-context scan (arcwright-hooks) and load the project's CLAUDE.md / AGENTS.md if present."`)] },
  ]);

  if (mode === 'full') {
    setEvent('PostToolUse', [
      { matcher: 'Write|Edit', hooks: [cmd(ref('typecheck.js'))] },
    ]);
  } else {
    // Downgrade safe: strip any prior Arcwright PostToolUse typecheck.
    setEvent('PostToolUse', []);
    if (settings.hooks.PostToolUse && settings.hooks.PostToolUse.length === 0) {
      delete settings.hooks.PostToolUse;
    }
  }
}

function buildArcwrightRulesEntry(modules) {
  return [
    '',
    '## Arcwright',
    '',
    'Arcwright agents, skills, and workflows are installed in `_arcwright/`.',
    'Key modules: ' + modules.join(', '),
    '',
    'To use an agent, load its `.md` file and follow its activation instructions.',
    'Agent configs are in `_arcwright/{module}/config.yaml`.',
    'Skills are in `.agents/skills/` and `_arcwright/_memory/skills/`.',
    '',
    'To update Arcwright: `npx @arcwright-ai/agent-orchestration update`',
    'To toggle agent teams: add `--no-teams` or run update again and choose differently at the prompt.',
    'To enable Docker type-check: add `--docker-check`.',
    'To modify gitignore behavior on next update: add `--gitignore full|skills|output-only|none`.',
    'For global installs: add `--global` to any command. Update a global install with `npx @arcwright-ai/agent-orchestration update --global`.',
    '',
  ].join('\n');
}

function buildTmuxEntry() {
  return [
    '',
    '## Agent Spawning (in-process, Herdr pane opt-in)',
    '',
    'Default orchestration is **in-process** via the `Agent` tool + `SendMessage`',
    'reuse. See `.agents/skills/claude-subagent-protocol/SKILL.md` for the full',
    'protocol (Session Agent Registry, sonnet-first, permission-before-opus).',
    '',
    '`herdr` is **opt-in visibility only** — load `.agents/skills/herdr/SKILL.md`',
    '("Watching agents in panes" section) only when the user has explicitly asked',
    'for split-pane visibility AND `$HERDR_ENV` is set. Spawn with',
    '`herdr agent start`, wait with `herdr wait agent-status`. The pane is just a',
    'viewing surface; the in-process orchestration inside it is still governed by',
    'the `claude-subagent-protocol` skill.',
    '',
    'The old `tmux-protocol` skill (AGENT_SIGNAL/PEER_SIGNAL/STATUS_CHECK polling)',
    'is retired. Do not reintroduce those signals.',
    '',
    'Required setting (load-bearing for `SendMessage` reuse):',
    '`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in `.claude/settings.json`.',
    'The installer writes this automatically.',
    '',
  ].join('\n');
}

function buildProactiveEntry() {
  // Each skill directory contains a RULES.md sidecar (~300 tokens) alongside SKILL.md (~2500 tokens).
  // Proactive loading reads RULES.md only; full SKILL.md is loaded when executing the procedure.
  return [
    '',
    '## Proactive Skill Invocation',
    '',
    'When your work touches a domain covered by a skill, read its `RULES.md` sidecar for quick',
    'context (~300 tokens — alongside SKILL.md in the same skill directory).',
    'Load the full `SKILL.md` only when executing the skill as a formal procedure.',
    'Do not ask the user before invoking — if the trigger is clear, act immediately.',
    '',
    '| Situation | Skill |',
    '|-----------|-------|',
    '| Starting any Arcwright workflow (triage, team) | `project-context` |',
    '| Bug, test failure, or unexpected behavior | `systematic-debugging` |',
    '| Writing or reviewing TypeScript | `typescript-best-practices` |',
    '| Writing or reviewing React | `react-expert` |',
    '| Writing Python backend code | `python-backend` |',
    '| Writing Next.js / App Router | `nextjs-app-router-patterns` |',
    '| Security-sensitive code (auth, input, SQL, file ops) | `security-review` |',
    '| Code quality / refactor review | `dry` |',
    '| New task or ambiguous feature request | `triage` |',
    '| Writing frontend / CSS / layout | `frontend-responsive-design-standards` |',
    '| Redis, PostgreSQL, WebSocket implementation | `redis-best-practices` / `postgresql-optimization` / `websocket-engineer` |',
    '',
  ].join('\n');
}

/**
 * Write / merge ~/.claude/CLAUDE.md (global) with Arcwright + tmux sections.
 * This file is loaded by Claude Code for every project automatically.
 */
async function writeGlobalClaudeMd(arcwrightEntry, tmuxEntry, proactiveEntry, chalk) {
  const globalClaudeDir = path.join(os.homedir(), '.claude');
  const globalClaudePath = path.join(globalClaudeDir, 'CLAUDE.md');

  await fs.ensureDir(globalClaudeDir);

  // Migrate: strip old markerless sections left by pre-1.0.21 installers
  await migrateOldClaudeMd(globalClaudePath);

  const arcwrightResult  = await upsertManagedBlock(globalClaudePath, '<!-- arcwright-agent-start -->',         '<!-- arcwright-agent-end -->',         arcwrightEntry);
  const tmuxResult       = await upsertManagedBlock(globalClaudePath, '<!-- arcwright-orchestration-start -->', '<!-- arcwright-orchestration-end -->', tmuxEntry);
  const proactiveResult  = await upsertManagedBlock(globalClaudePath, '<!-- arcwright-proactive-start -->',     '<!-- arcwright-proactive-end -->',     proactiveEntry);
  const anyChanged = arcwrightResult !== 'noop' || tmuxResult !== 'noop' || proactiveResult !== 'noop';

  if (arcwrightResult === 'created' || tmuxResult === 'created' || proactiveResult === 'created') {
    console.log(chalk.green('  ✓ ~/.claude/CLAUDE.md (global) created'));
  } else if (anyChanged) {
    console.log(chalk.green('  ✓ ~/.claude/CLAUDE.md (global) updated (stale sections replaced)'));
  } else {
    console.log(chalk.gray('  ○ ~/.claude/CLAUDE.md (global) already up to date'));
  }
}

// ─── Managed-block registries (Stage 5b) ──────────────────────────────────────
// Single source of truth for blocks the installer writes vs. blocks it used to
// write. Consumed by `upsertManagedBlock` (write), `cleanupManagedBlocks`
// (strip), and `uninstall` (full strip). Keeping the lists in one place means
// a rename or new managed block only touches one constant.

/**
 * Blocks the installer CURRENTLY writes. install/update use these to upsert;
 * uninstall uses them to strip everything Arcwright wrote.
 */
const MANAGED_MARKERS = [
  { name: 'arcwright-agent',         start: '<!-- arcwright-agent-start -->',         end: '<!-- arcwright-agent-end -->' },
  { name: 'arcwright-orchestration', start: '<!-- arcwright-orchestration-start -->', end: '<!-- arcwright-orchestration-end -->' },
  { name: 'arcwright-proactive',     start: '<!-- arcwright-proactive-start -->',     end: '<!-- arcwright-proactive-end -->' },
];

/**
 * Blocks the installer NO LONGER writes but might still exist in user
 * CLAUDE.md files. install/update strip these so a rename or dropped block
 * can't orphan stale content in user files. uninstall also strips them.
 * Includes markerless pre-1.0.21 headings that the old migrateOldClaudeMd
 * helper used to remove by hand.
 */
const DEPRECATED_MARKERS = [
  { name: 'arcwright-tmux',         start: '<!-- arcwright-tmux-start -->',          end: '<!-- arcwright-tmux-end -->' },
  // Markerless pre-1.0.21 headings — `start` is the heading line, `end` is the
  // next heading marker we strip up to. cleanupManagedBlocks uses the same
  // `next ## ` heuristic the old migrateOldClaudeMd did for these pairs.
  { name: 'arcwright-legacy-block', start: '## Arcwright',                          end: '## Agent Spawning' },
  { name: 'arcwright-legacy-tmux',  start: '## Agent Spawning (tmux-aware)',        end: '## Proactive Skill' },
];

// cleanupManagedBlocks is imported from ./managed-md (shared with tmuxInstaller.js).

/**
 * One-time migration helper — KEPT for backward compatibility (still called
 * by the install flows during the transition), but the actual logic is now
 * driven by `cleanupManagedBlocks` + `DEPRECATED_MARKERS`. New code should
 * call `cleanupManagedBlocks(filePath, DEPRECATED_MARKERS)` directly.
 */
async function migrateOldClaudeMd(filePath) {
  await cleanupManagedBlocks(filePath, DEPRECATED_MARKERS);
}

// upsertManagedBlock is imported from ./managed-md (shared with tmuxInstaller.js).

/**
 * Write lightweight agent stub files into .claude/agents/ so the IDE
 * can discover Arcwright agents natively without requiring the user to
 * manually load them.
 *
 * Reads from SRC_DIR/{module}/agents/ for awm and awb (core is skipped —
 * the master orchestrator is invoked via slash commands, not agent stubs).
 *
 * Returns an array of { relPath, hash } manifest entries so the caller
 * can merge them into newFileEntries for orphan-removal tracking.
 */
async function writeClaudeAgentStubs(srcDir, agentDest, chalk, modules, options = {}) {
  const STUB_MODULES = ['awm', 'awb', 'aws-infra', 'unnamed-pm'];
  const selectedStubModules = (modules || STUB_MODULES).filter(m => STUB_MODULES.includes(m));
  const relPrefix = options.relPrefix || '.claude/agents';
  const logLabel = options.logLabel || '.claude/agents/';

  const manifestEntries = [];
  let written = 0;

  await fs.ensureDir(agentDest);

  for (const mod of selectedStubModules) {
    const agentsSrc = path.join(srcDir, mod, 'agents');
    if (!await fs.pathExists(agentsSrc)) continue;

    // Walk all *.md files under the agents dir (handles subdirs like tech-writer/)
    const agentFiles = await glob('**/*.md', { cwd: agentsSrc, nodir: true });

    for (const rel of agentFiles) {
      const agentPath = path.join(agentsSrc, rel);
      const raw = await fs.readFile(agentPath, 'utf8');

      // Parse YAML frontmatter name/description
      const nameMatch = raw.match(/^name:\s*["']?(.+?)["']?\s*$/m);
      const descMatch = raw.match(/^description:\s*["']?(.+?)["']?\s*$/m);

      // Fall back to <agent name="..." title="..."> XML tag
      const xmlNameMatch = raw.match(/<agent[^>]+name="([^"]+)"/);
      const xmlTitleMatch = raw.match(/<agent[^>]+title="([^"]+)"/);

      const description = descMatch?.[1] || xmlTitleMatch?.[1] || xmlNameMatch?.[1] || `Arcwright ${mod} agent`;

      // Slug = basename without .md (e.g. dev, ux-designer, tech-writer)
      const slug = path.basename(rel, '.md');
      // Original filename (just the basename) for the activation path
      const originalFilename = path.basename(rel);
      // Module subfolder relative to agents/ (e.g. '' or 'tech-writer')
      const subdir = path.dirname(rel) === '.' ? '' : path.dirname(rel) + '/';

      const stubName = `arcwright-${slug}.md`;
      const stubPath = path.join(agentDest, stubName);
      const stub = [
        '---',
        `name: arcwright-${slug}`,
        `description: ${description}`,
        '---',
        '',
        `<agent-activation CRITICAL="TRUE">`,
        `1. LOAD {project-root}/_arcwright/${mod}/agents/${subdir}${originalFilename}`,
        '2. READ its entire contents',
        '3. EXECUTE every critical_action in order',
        '4. PRESENT the menu',
        '5. WAIT for user input',
        '</agent-activation>',
        '',
      ].join('\n');

      await fs.writeFile(stubPath, stub, 'utf8');
      written++;

      const relManifestPath = `${relPrefix}/${stubName}`;
      manifestEntries.push({ relPath: relManifestPath, hash: sha256(stub) });
    }
  }

  if (written > 0) {
    console.log(chalk.green(`  ✓ ${written} agent stubs → ${logLabel}`));
  }

  return manifestEntries;
}

// ─── Uninstall ────────────────────────────────────────────────────────────────

/**
 * Locations the installer can target for CLAUDE.md cleanup. Mirrors the
 * three write sites in writeIdeConfig + writeGlobalClaudeMd.
 */
function getClaudeMdLocations(projectRoot, isGlobal, platform, homes) {
  // Every instruction file Arcwright writes a managed block into. Used by
  // uninstall to strip those blocks back out, so anything missing here stays
  // behind and keeps instructing the user's agent after they uninstall.
  //
  // AGENTS.md is not optional: Codex, OpenCode, Grok, Hermes and Cursor all
  // receive their block there rather than in CLAUDE.md. Omitting it left a full
  // Arcwright block — "To update Arcwright: npx …" and all — in the user's
  // AGENTS.md forever.
  if (isGlobal) {
    return [
      resolveToolPath('claude-code', GLOBAL_PATHS['claude-code'].claudeMd, true, homes, platform),
      resolveToolPath('codex', GLOBAL_PATHS.codex.claudeMd, true, homes, platform),
      resolveToolPath('opencode', GLOBAL_PATHS.opencode.claudeMd, true, homes, platform),
      resolveToolPath('grok', GLOBAL_PATHS.grok.claudeMd, true, homes, platform),
    ].filter(Boolean);
  }
  return [
    // Project install: rules file lives in .claude/CLAUDE.md, root CLAUDE.md
    // may also exist, and AGENTS.md carries the block for the AGENTS.md-based
    // tools (Codex, OpenCode, Grok, Hermes, Cursor).
    path.join(projectRoot, '.claude', 'CLAUDE.md'),
    path.join(projectRoot, 'CLAUDE.md'),
    path.join(projectRoot, 'AGENTS.md'),
  ];
}

/**
 * Strip the installer-managed `# ─── Arcwright installation ───` block from
 * .gitignore. Idempotent — no-op if absent.
 */
async function stripGitignoreBlock(projectRoot) {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  if (!await fs.pathExists(gitignorePath)) return false;
  const original = await fs.readFile(gitignorePath, 'utf8');

  const START = '# ─── Arcwright installation ──────────────────────────────────────────';
  const END   = '# ─── end arcwright ───────────────────────────────────────────────────';
  const blockRe = new RegExp(`${escapeRe(START)}[\\s\\S]*?${escapeRe(END)}\\n?`, 'm');
  const cleaned = original.replace(blockRe, '').replace(/\n{3,}/g, '\n\n').trimStart() + '\n';
  if (cleaned === original) return false;
  await fs.writeFile(gitignorePath, cleaned, 'utf8');
  return true;
}

/**
 * Remove keys the installer wrote to .claude/settings.json IF they still match
 * the installer-written values. Never clobber user-customized values.
 *
 * Installer-written defaults:
 *   env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === '1'
 *   env.CLAUDE_CODE_NO_FLICKER === '1'
 *   skillListingBudgetFraction === SKILL_LISTING_BUDGET (or a legacy default)
 *   fallbackModel === ['sonnet']
 */
async function stripInstallerSettingsKeys(claudeDir) {
  const settingsPath = path.join(claudeDir, 'settings.json');
  if (!await fs.pathExists(settingsPath)) return false;
  let settings;
  try { settings = JSON.parse(await fs.readFile(settingsPath, 'utf8')); }
  catch { return false; }

  let touched = false;
  if (settings.env) {
    if (settings.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === '1') {
      delete settings.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;
      touched = true;
    }
    if (settings.env.CLAUDE_CODE_NO_FLICKER === '1') {
      delete settings.env.CLAUDE_CODE_NO_FLICKER;
      touched = true;
    }
    if (settings.env && Object.keys(settings.env).length === 0) {
      delete settings.env;
    }
  }
  // Current default plus every earlier one, so an uninstall on a machine that
  // installed before the budget was raised still cleans up after itself.
  if (
    settings.skillListingBudgetFraction === SKILL_LISTING_BUDGET ||
    LEGACY_SKILL_LISTING_BUDGETS.includes(settings.skillListingBudgetFraction)
  ) {
    delete settings.skillListingBudgetFraction;
    touched = true;
  }
  if (Array.isArray(settings.fallbackModel) && settings.fallbackModel.length === 1 && settings.fallbackModel[0] === 'sonnet') {
    delete settings.fallbackModel;
    touched = true;
  }

  if (!touched) return false;
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  return true;
}

/**
 * Uninstall Arcwright from the user's project or global config.
 *
 * Steps:
 *  1. Strip MANAGED_MARKERS + DEPRECATED_MARKERS blocks from every CLAUDE.md
 *     location the installer might have written to.
 *  2. Strip the managed Arcwright block from .gitignore (project installs only).
 *  3. Strip installer-written keys from .claude/settings.json (only if they
 *     still match the installer defaults — never clobber user edits).
 *  4. Optionally remove installed dirs per the manifest. Prompts unless --yes.
 *
 * Idempotent — running twice is safe (everything's already gone on run 2).
 *
 * @param {Object} [opts]
 * @param {boolean} [opts.global]   - uninstall from global (~/.claude/, ~/.arcwright/)
 * @param {boolean} [opts.yes]      - skip confirmation prompts
 * @param {string}  [opts.directory] - project root (default cwd)
 */
async function uninstall(opts = {}) {
  const isGlobal = !!opts.global;
  const yes = !!opts.yes;
  const projectRoot = path.resolve(opts.directory || process.cwd());
  const chalk = (await import('chalk')).default;
  const platform = detectPlatform();
  const homes = getHomes(platform);

  console.log(chalk.bold(`\nUninstalling Arcwright (${isGlobal ? 'global' : 'project'}: ${projectRoot})\n`));

  // 1. Strip managed + deprecated blocks from every CLAUDE.md location.
  const claudeMdLocations = getClaudeMdLocations(projectRoot, isGlobal, platform, homes);
  let mdStripped = 0;
  for (const md of claudeMdLocations) {
    const removed = await cleanupManagedBlocks(md, [...MANAGED_MARKERS, ...DEPRECATED_MARKERS]);
    if (removed) {
      mdStripped++;
      console.log(chalk.green(`  ✓ ${path.relative(projectRoot, md) || md} (Arcwright blocks stripped)`));
    }
  }
  if (mdStripped === 0) console.log(chalk.gray('  ○ No CLAUDE.md blocks to strip'));

  // 2. Strip the managed gitignore block (project installs only).
  if (!isGlobal) {
    const removed = await stripGitignoreBlock(projectRoot);
    if (removed) console.log(chalk.green('  ✓ .gitignore (Arcwright block stripped)'));
    else console.log(chalk.gray('  ○ .gitignore (no Arcwright block)'));
  }

  // 3. Strip installer-written settings.json keys.
  const settingsBase = isGlobal
    ? resolveToolPath('claude-code', '.claude', true, homes, platform)
    : path.join(projectRoot, '.claude');
  const settingsChanged = await stripInstallerSettingsKeys(settingsBase);
  if (settingsChanged) console.log(chalk.green('  ✓ .claude/settings.json (installer keys removed)'));
  else console.log(chalk.gray('  ○ .claude/settings.json (no installer keys to remove)'));

  // 3b. Remove Arcwright-owned rule files that are whole files rather than a
  // managed block inside a user file. .cursor/rules/arcwright.mdc is generated
  // entirely by the installer and carries `alwaysApply: true`, so leaving it
  // behind meant Cursor kept injecting Arcwright guidance into every session
  // after the user uninstalled. Only files Arcwright authors in full belong
  // here — never a user-owned file like AGENTS.md, which is handled by
  // managed-block stripping above.
  if (!isGlobal) {
    const cursorRule = path.join(projectRoot, '.cursor', 'rules', 'arcwright.mdc');
    if (await fs.pathExists(cursorRule)) {
      await fs.remove(cursorRule);
      console.log(chalk.green('  ✓ .cursor/rules/arcwright.mdc (removed)'));
    }
  }

  // 4. Optionally remove installed dirs per the manifest.
  // Library contract: `--yes` opts in automatically. The CLI layer
  // (`cli.js`) is responsible for the interactive prompt and is expected
  // to call this function with `yes: true` only after the user confirms.
  // Idempotent: if there's no manifest, there's nothing to remove.
  const manifestDir = isGlobal
    ? path.join(homes.linux, '.arcwright')
    : path.join(projectRoot, '_arcwright');
  const manifest = await readManifest(manifestDir);
  if (!manifest) {
    console.log(chalk.gray('  ○ No manifest found — nothing to remove'));
  } else if (yes) {
    if (isGlobal) {
      if (await fs.pathExists(manifestDir)) {
        await fs.remove(manifestDir);
        console.log(chalk.green(`  ✓ ${manifestDir} (removed)`));
      }
    } else {
      // Project installs: only remove Arcwright-owned module dirs + the
      // output folder. _arcwright/_config/ contains the manifest + any user
      // `.customize.yaml` overlays — leave in place so the next install can
      // detect prior state and preserve user-owned files. Callers wanting a
      // full wipe can `rm -rf _arcwright/` themselves.
      // Drive this from the manifest, not a hardcoded list. The literal
      // ['awm','awb','core','_memory'] predates the optional modules, so an
      // install that used --aws-infra or --unnamed-pm left those directories
      // behind. Fall back to the four for manifests written before `modules`
      // was recorded.
      const installedModules = Array.isArray(manifest.modules) && manifest.modules.length
        ? manifest.modules
        : ['awm', 'awb', 'core', '_memory'];
      for (const sub of installedModules) {
        const d = path.join(manifestDir, sub);
        if (await fs.pathExists(d)) await fs.remove(d);
      }
      const outputDir = path.join(projectRoot, manifest.outputFolder || '_arcwright-output');
      if (await fs.pathExists(outputDir)) await fs.remove(outputDir);
      console.log(chalk.green(`  ✓ Arcwright module dirs + ${manifest.outputFolder || '_arcwright-output'} removed`));
      console.log(chalk.dim(`    (${path.relative(projectRoot, manifestDir)} retained — contains manifest + user overlays)`));
    }
  } else {
    console.log(chalk.yellow('  ⚠ Installed dirs NOT removed (pass --yes to remove them).'));
  }

  console.log(chalk.bold.green(`\n✓ Uninstalled.\n`));
}

module.exports = {
  install, status, uninstall,
  // Public helpers for CLI surfaces (platforms list, --tools help text).
  PLATFORMS, getSupportedToolIds, getToolPromptOptions, parseToolIds,
  // Internal helpers exported for unit testing (not part of the public CLI API).
  _internal: {
    sha256, escapeRe, detectBmad, getHomes, resolveToolPath,
    readManifest, writeManifest, readFilesManifest, writeFilesManifest, removeEmptyDirsUpward,
    buildModuleConfig, getFileHeader, getClaudeMdLocations,
    updateGitignore, stripGitignoreBlock,
    cleanupManagedBlocks, upsertManagedBlock, migrateOldClaudeMd,
    writeClaudeSettings, stripInstallerSettingsKeys,
    buildArcwrightRulesEntry, buildTmuxEntry, buildProactiveEntry,
    writeCodexConfig, writeHermesConfig, writeOpenCodeConfig, writeGrokConfig, writeCursorConfig,
    buildCursorRule, adaptCursorCommand, filterCommandNames,
    commandExists, ensureHermesCliInstalled, setupHermesModelSurface,
    PLATFORMS, getSupportedToolIds, getToolPromptOptions, parseToolIds,
  },
};
