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
const { setupTmux } = require('./tmuxInstaller');
const { detectPlatform } = require('./platform');

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

// Manifest file location (relative to _arcwright/)
const MANIFEST_FILE = '_config/manifest.yaml';
const FILES_MANIFEST_FILE = '_config/files-manifest.csv';

// ─── Platform IDE config ─────────────────────────────────────────────────────

/**
 * All supported platforms and what files they write.
 * Each platform writes its own agent stub + optional CLAUDE.md / rules file.
 */
const PLATFORMS = {
  'claude-code': {
    label: 'Claude Code',
    agentDir: '.claude/agents',
    skillsDir: null,
    steeringDir: null,
    hooksDir: null,
    rulesFile: '.claude/CLAUDE.md',
    rulesMarker: '## Arcwright',
  },
  'kiro': {
    label: 'Kiro',
    agentDir: '.kiro/agents',
    skillsDir: '.kiro/skills',
    steeringDir: '.kiro/steering',
    rulesFile: null,  // Kiro uses steering files, not a single rules file
    rulesMarker: null,
  },
  'cursor': {
    label: 'Cursor',
    agentDir: '.cursor/rules',
    skillsDir: null,
    steeringDir: null,
    hooksDir: null,
    rulesFile: '.cursor/rules/arcwright.mdc',
    rulesMarker: '## Arcwright',
  },
  'windsurf': {
    label: 'Windsurf',
    agentDir: null,
    skillsDir: null,
    steeringDir: null,
    hooksDir: null,
    rulesFile: '.windsurfrules',
    rulesMarker: '## Arcwright',
  },
  'cline': {
    label: 'Cline',
    agentDir: null,
    skillsDir: null,
    steeringDir: null,
    hooksDir: null,
    rulesFile: '.clinerules',
    rulesMarker: '## Arcwright',
  },
  'github-copilot': {
    label: 'GitHub Copilot',
    agentDir: '.github/copilot-instructions.d',
    skillsDir: null,
    steeringDir: null,
    hooksDir: null,
    rulesFile: '.github/copilot-instructions.md',
    rulesMarker: '## Arcwright',
  },
  'gemini': {
    label: 'Gemini CLI',
    agentDir: null,
    skillsDir: null,
    steeringDir: null,
    hooksDir: null,
    rulesFile: 'GEMINI.md',
    rulesMarker: '## Arcwright',
  },
};

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
const TERMINAL_TOOLS = ['claude-code', 'gemini'];

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
  'cursor': {
    rules: '.cursor/rules/arcwright.mdc',
  },
  'windsurf': {
    rules: '.codeium/windsurf/globalRules/arcwright.md',
  },
  'cline': {
    rules: '.clinerules',
  },
  'github-copilot': {
    rules: '.github/copilot-instructions.md',
  },
  'gemini': {
    rules: 'GEMINI.md',
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

// ─── Kiro config writer ───────────────────────────────────────────────────────

async function writeKiroConfig(projectRoot, chalk, isGlobal, homes, platform, resolvedTeams = true, resolvedDockerCheck = false) {
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
      return true;
    };
    await fs.copy(kiroSkillsSrc, skillsDest, { overwrite: true, filter });
    const allSkillFiles = await glob('**/*', { cwd: kiroSkillsSrc, nodir: true });
    const skillFiles = allSkillFiles.filter(f => {
      if (!resolvedTeams && /^team-/.test(f)) return false;
      if (!resolvedDockerCheck && /^docker-type-check\//.test(f)) return false;
      return true;
    });
    const skippedCount = allSkillFiles.length - skillFiles.length;
    const skipNotes = [];
    if (!resolvedTeams) skipNotes.push('team-*');
    if (!resolvedDockerCheck) skipNotes.push('docker-type-check');
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
      return true;
    });
    for (const f of agentFiles) {
      await fs.copy(path.join(kiroAgentsSrc, f), path.join(agentsDest, f), { overwrite: true });
    }
    const skipNotes = [];
    if (!resolvedTeams) skipNotes.push('/team');
    if (!resolvedDockerCheck) skipNotes.push('/docker-check');
    const teamNote = skipNotes.length > 0 ? chalk.dim(` (skipped ${skipNotes.join(', ')})`) : '';
    console.log(chalk.green(`  ✓ .kiro/agents/ (${agentFiles.length} agents)`) + teamNote);
  }
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
      '.claude/commands/tmux.md',
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
      '.claude/agents/arcwright-*.md',
      '.kiro/agents/',
      '.kiro/skills/',
      '.kiro/steering/arcwright-*.md',
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
    gitignore = null,  // null | 'full' | 'skills' | 'output-only' | 'none'
    tmux = null,   // null = interactive prompt, true/false = explicit
    migrateBmad = null,  // null = prompt if bmad detected; true/false = explicit
  } = opts;
  let resolvedGitignore = gitignore;
  let resolvedTmux = typeof tmux === 'boolean' ? tmux : null;
  let resolvedMigrateBmad = typeof migrateBmad === 'boolean' ? migrateBmad : null;

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

  // ── bmad detection (project installs only; skip if already migrated) ──────
  const bmadDetected = !isGlobal ? detectBmad(projectRoot) : { present: false, signals: [] };
  // If manifest already records a migration, skip re-prompting unless --migrate-bmad is explicit
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

  // Default for --yes or non-interactive: migrate if detected and not already migrated
  if (resolvedMigrateBmad === null) {
    resolvedMigrateBmad = bmadDetected.present && !alreadyMigrated;
  }

  // ── Run migrate before installing arcwright files ─────────────────────────
  const manifestExtras = {};
  if (resolvedMigrateBmad && !isGlobal && bmadDetected.present) {
    const { migrate } = require('./migrate');
    const result = migrate(projectRoot, false);
    console.log(chalk.green(`\n  Migration complete: ${result.actions.filter(a => a.type !== 'skip').length} changes applied`));
    manifestExtras.migratedAt = new Date().toISOString();
  }

  // ── Interactive prompts ───────────────────────────────────────────────────
  let resolvedUserName = userName;

  // Resolve tools/teams/dockerCheck — for --yes updates, fall back to manifest values
  // when CLI flags were not explicitly provided (Commander sets defaults that are
  // indistinguishable from explicit flags, so we use manifest when value == default).
  const manifestFallback = yes && isUpdate && existingManifest;
  let resolvedTools = (() => {
    const parsed = tools ? tools.split(',').map(t => t.trim()).filter(t => t !== 'none') : [];
    if (manifestFallback && parsed.join(',') === 'claude-code' && existingManifest.tools?.length) {
      // CLI default — prefer manifest value
      return existingManifest.tools;
    }
    return parsed.length ? parsed : ['claude-code'];
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
      options: [
        { value: 'claude-code',     label: 'Claude Code',     hint: 'agents, CLAUDE.md, settings.json, tmux setup' },
        { value: 'kiro',            label: 'Kiro (IDE + CLI)', hint: '.kiro/skills/, .kiro/steering/' },
        { value: 'cursor',          label: 'Cursor',          hint: '.cursor/rules/arcwright.mdc' },
        { value: 'windsurf',        label: 'Windsurf',        hint: '.windsurfrules' },
        { value: 'cline',           label: 'Cline',           hint: '.clinerules' },
        { value: 'github-copilot',  label: 'GitHub Copilot',  hint: '.github/copilot-instructions.md' },
        { value: 'gemini',          label: 'Gemini CLI',      hint: 'GEMINI.md' },
      ],
      initialValues: existingManifest?.tools || ['claude-code'],
      required: false,
    });
    if (isCancel(platformChoices)) { process.exit(0); }
    if (platformChoices && platformChoices.length > 0) {
      resolvedTools = platformChoices;
    }

    // Agent teams opt-in — 17 team-* skills + /team slash command
    const teamsChoice = await confirm({
      message: 'Install agent teams? (17 pre-built multi-agent compositions + /team command — requires tmux for split-pane mode)',
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

    // tmux setup opt-in — runs for both project and global installs (tmux config is always global)
    if (resolvedTools.includes('claude-code') && resolvedTmux === null) {
      const tmuxChoice = await confirm({
        message: 'Set up tmux config? (writes ~/.tmux.conf + ~/.config/tmux/ — for AI agent workflows with Claude Code)',
        initialValue: existingManifest?.tmux !== false,
      });
      if (isCancel(tmuxChoice)) { process.exit(0); }
      resolvedTmux = tmuxChoice;
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

    outro(`${isUpdate ? 'Updating' : 'Installing'} Arcwright...`);
  }

  // Finalize resolvedTmux — default to true when claude-code is selected (both project + global)
  if (resolvedTmux === null) {
    resolvedTmux = resolvedTools.includes('claude-code');
  }

  const selectedModules = modules.split(',').map(m => m.trim()).filter(Boolean);

  console.log(`\n${chalk.bold.blue('Arcwright')} ${isUpdate ? 'Update' : 'Install'}`);
  console.log(`  Target:   ${chalk.cyan(isGlobal ? '~/.arcwright (global)' : projectRoot)}`);
  console.log(`  Modules:  ${chalk.cyan(selectedModules.join(', '))}`);
  console.log(`  IDEs:     ${chalk.cyan(resolvedTools.join(', ') || 'none')}\n`);

  // ── Module install ────────────────────────────────────────────────────────
  const modulesToInstall = new Set(['core', ...selectedModules]);
  if (selectedModules.includes('awm') || selectedModules.includes('awb')) {
    modulesToInstall.add('_memory');
  }

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

    // Filter team-* skills if teams were declined; filter docker-type-check if not opted in
    const filter = (src) => {
      if (!resolvedTeams && (/[/\\]team-[^/\\]+[/\\]?$/.test(src) || /[/\\]team-[^/\\]+[/\\]/.test(src))) return false;
      if (!resolvedDockerCheck && (/[/\\]docker-type-check[/\\]?$/.test(src) || /[/\\]docker-type-check[/\\]/.test(src))) return false;
      return true;
    };

    await fs.copy(pkgSkillsSrc, destSkills, { overwrite: true, filter });
    const allSkillFiles = await glob('**/*', { cwd: pkgSkillsSrc, nodir: true });
    const skillFiles = allSkillFiles.filter(f => {
      if (!resolvedTeams && /^team-/.test(f)) return false;
      if (!resolvedDockerCheck && /^docker-type-check\//.test(f)) return false;
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
    const teamNote = skipNotes.length > 0 ? chalk.dim(` (skipped ${skippedCount} files: ${skipNotes.join(', ')})`) : '';
    console.log(chalk.green(`  ✓ .agents/skills/ (${skillFiles.length} files)`) + teamNote);
  }

  // ── config.yaml generation (skip for global installs) ────────────────────
  if (!isGlobal) {
    for (const mod of selectedModules) {
      const configPath = path.join(effectiveArwDir, mod, 'config.yaml');
      if (!isUpdate || !await fs.pathExists(configPath)) {
        const config = buildModuleConfig(mod, resolvedUserName || 'Developer', outputFolder);
        await fs.ensureDir(path.dirname(configPath));
        await fs.writeFile(configPath, yaml.stringify(config), 'utf8');
        console.log(chalk.green(`  ✓ config.yaml → _arcwright/${mod}/`));
      }
    }
  }

  // ── IDE integration ───────────────────────────────────────────────────────
  for (const tool of resolvedTools) {
    if (tool === 'kiro') continue; // handled separately below
    const ideEntries = await writeIdeConfig(tool, projectRoot, selectedModules, chalk, isGlobal, homes, platform, resolvedTeams, resolvedDockerCheck);
    if (ideEntries && ideEntries.length > 0) {
      newFileEntries.push(...ideEntries);
    }
  }

  // ── Kiro integration ──────────────────────────────────────────────────────
  if (resolvedTools.includes('kiro')) {
    await writeKiroConfig(projectRoot, chalk, isGlobal, homes, platform, resolvedTeams, resolvedDockerCheck);
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
          } else {
            // _arcwright/ module files — in ~/.arcwright/
            fullPath = path.join(effectiveArwDir, orphan.relPath);
          }
        } else {
          // Project install: _arcwright/ files use effectiveArwDir; others use projectRoot
          if (orphan.relPath.startsWith('.agents/') || orphan.relPath.startsWith('.claude/')) {
            fullPath = path.join(projectRoot, orphan.relPath);
          } else {
            fullPath = path.join(effectiveArwDir, orphan.relPath);
          }
        }
        if (await fs.pathExists(fullPath)) {
          await fs.remove(fullPath);
          console.log(chalk.dim(`    ✗ ${orphan.relPath}`));
        }
      }
    }
  }

  // ── tmux setup (claude-code only; runs for both project and global installs) ─
  if (resolvedTmux && resolvedTools.includes('claude-code')) {
    await setupTmux(projectRoot, chalk, platform);
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
    outputFolder: isGlobal ? null : outputFolder,
    platform: platform,
    modules: [...modulesToInstall],
    tools: resolvedTools,
    teams: resolvedTeams,
    dockerCheck: resolvedDockerCheck,
    tmux: resolvedTmux,
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
  console.log(chalk.bold('Optional skill prerequisites:'));
  console.log('');
  console.log('  ' + chalk.white('playwright-cli') + chalk.dim(' — browser automation for QA agent (.agents/skills/playwright-cli/)'));
  console.log('    ' + chalk.cyan('npm install -g @playwright/cli@latest'));
  console.log('    ' + chalk.dim('Then: npx playwright install  # downloads browser binaries'));
  console.log('');
  console.log('  ' + chalk.white('gsudo') + chalk.dim(' — Windows privilege escalation for git/PowerShell/playwright (.agents/skills/gsudo/)'));
  console.log('    ' + chalk.cyan('winget install gerardog.gsudo') + chalk.dim('  # Windows'));
  console.log('    ' + chalk.cyan('scoop install gsudo') + chalk.dim('            # Windows (Scoop)'));
  console.log('');

  // ── Open workflows overview in default browser (project installs only) ────
  if (!isGlobal) {
    const overviewHtml = path.join(effectiveArwDir, '_memory', 'master-orchestrator-sidecar', 'workflows-overview.html');
    if (await fs.pathExists(overviewHtml)) {
      const { spawn } = require('child_process');
      const opener = process.platform === 'win32' ? 'cmd'
                   : process.platform === 'darwin' ? 'open'
                   : 'xdg-open';
      const args = process.platform === 'win32' ? ['/c', 'start', '', overviewHtml] : [overviewHtml];
      spawn(opener, args, { detached: true, stdio: 'ignore' }).unref();
      console.log(chalk.dim(`  Opening workflows overview in your browser…\n`));
    }
  }
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

  for (const mod of AVAILABLE_MODULES) {
    const modDir = path.join(arcwrightDir, mod);
    if (await fs.pathExists(modDir)) {
      const files = await glob('**/*', { cwd: modDir, nodir: true });
      console.log(`  ${chalk.green('✓')} ${mod} (${files.length} files)`);
    } else {
      console.log(`  ${chalk.gray('○')} ${mod} (not installed)`);
    }
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

async function writeIdeConfig(tool, projectRoot, modules, chalk, isGlobal, homes, platform, resolvedTeams = true, resolvedDockerCheck = false) {
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
    const rulesPath = isGlobal && GLOBAL_PATHS[tool]?.rules
      ? resolveToolPath(tool, GLOBAL_PATHS[tool].rules, true, homes, platform)
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
      // Only add tmux entry for Claude Code (the only tool with tmux-native pane support)
      if (tool === 'claude-code' && !existing.includes('## Agent Spawning (tmux-aware)')) {
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
    const arcwrightResult  = await upsertManagedBlock(rootClaudePath, '<!-- arcwright-agent-start -->',    '<!-- arcwright-agent-end -->',    arcwrightEntry);
    const tmuxResult       = await upsertManagedBlock(rootClaudePath, '<!-- arcwright-tmux-start -->',     '<!-- arcwright-tmux-end -->',     tmuxEntry);
    const proactiveResult  = await upsertManagedBlock(rootClaudePath, '<!-- arcwright-proactive-start -->', '<!-- arcwright-proactive-end -->', proactiveEntry);
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
    await writeClaudeSettings(settingsBase, chalk);
  }

  // Write per-agent stubs into agent directory (claude-code only for now)
  if (tool === 'claude-code' && platformCfg.agentDir) {
    const agentDir = isGlobal
      ? resolveToolPath('claude-code', GLOBAL_PATHS['claude-code'].agents, true, homes, platform)
      : path.join(projectRoot, platformCfg.agentDir);
    const entries = await writeClaudeAgentStubs(SRC_DIR, agentDir, chalk, modules);
    stubEntries.push(...entries);
  }

  return stubEntries;
}

function getFileHeader(tool) {
  switch (tool) {
    case 'cursor':       return '# Cursor Rules — Arcwright\n';
    case 'windsurf':     return '# Windsurf Rules — Arcwright\n';
    case 'cline':        return '# Cline Rules — Arcwright\n';
    case 'github-copilot': return '# GitHub Copilot Instructions — Arcwright\n';
    case 'gemini':       return '# Gemini CLI Configuration — Arcwright\n';
    default:             return '# Claude Code Configuration — Arcwright\n';
  }
}

/**
 * Write / merge .claude/settings.json with Arcwright-required env vars.
 * Enables CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS so mode [4] parallel agents
 * work out of the box without manual env setup.
 * Merges with any existing settings — never overwrites user values.
 */
async function writeClaudeSettings(claudeDir, chalk) {
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

  // Set Agent Teams env var if not already configured
  if (!settings.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS) {
    settings.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1';
  }
  // Disable terminal flicker (alternate rendering path)
  if (!settings.env.CLAUDE_CODE_NO_FLICKER) {
    settings.env.CLAUDE_CODE_NO_FLICKER = '1';
  }

  const after = JSON.stringify(settings);
  if (before !== after) {
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
    console.log(chalk.green('  ✓ .claude/settings.json (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1, CLAUDE_CODE_NO_FLICKER=1)'));
  } else {
    console.log(chalk.gray('  ○ .claude/settings.json already up to date'));
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
    '## Agent Spawning (tmux-aware)',
    '',
    'If `$TMUX` is set, load `.agents/skills/tmux-protocol/SKILL.md` before any multi-pane work.',
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

  const arcwrightResult  = await upsertManagedBlock(globalClaudePath, '<!-- arcwright-agent-start -->',    '<!-- arcwright-agent-end -->',    arcwrightEntry);
  const tmuxResult       = await upsertManagedBlock(globalClaudePath, '<!-- arcwright-tmux-start -->',     '<!-- arcwright-tmux-end -->',     tmuxEntry);
  const proactiveResult  = await upsertManagedBlock(globalClaudePath, '<!-- arcwright-proactive-start -->', '<!-- arcwright-proactive-end -->', proactiveEntry);
  const anyChanged = arcwrightResult !== 'noop' || tmuxResult !== 'noop' || proactiveResult !== 'noop';

  if (arcwrightResult === 'created' || tmuxResult === 'created' || proactiveResult === 'created') {
    console.log(chalk.green('  ✓ ~/.claude/CLAUDE.md (global) created'));
  } else if (anyChanged) {
    console.log(chalk.green('  ✓ ~/.claude/CLAUDE.md (global) updated (stale sections replaced)'));
  } else {
    console.log(chalk.gray('  ○ ~/.claude/CLAUDE.md (global) already up to date'));
  }
}

/**
 * One-time migration: remove old markerless Arcwright/tmux sections injected by
 * pre-1.0.21 installers. Detects the old heading anchors and strips from that
 * heading to the next top-level heading (or end of file). No-ops if file has
 * new managed-block markers already, or if old headings are not present.
 */
async function migrateOldClaudeMd(filePath) {
  if (!await fs.pathExists(filePath)) return;
  const content = await fs.readFile(filePath, 'utf8');
  // Already migrated — new markers present
  if (content.includes('<!-- arcwright-agent-start -->') || content.includes('<!-- arcwright-tmux-start -->')) return;

  const OLD_MARKERS = ['## Arcwright', '## Agent Spawning (tmux-aware)'];
  let cleaned = content;
  for (const marker of OLD_MARKERS) {
    const idx = cleaned.indexOf(marker);
    if (idx === -1) continue;
    // Find the next top-level heading after this one, or end of string
    const rest = cleaned.slice(idx + marker.length);
    const nextHeading = rest.search(/\n## /);
    const end = nextHeading === -1 ? cleaned.length : idx + marker.length + nextHeading;
    cleaned = cleaned.slice(0, idx) + cleaned.slice(end);
  }

  if (cleaned !== content) {
    await fs.writeFile(filePath, cleaned.trimStart(), 'utf8');
  }
}

/**
 * Upsert a managed block in a file using start/end HTML comment markers.
 * - File missing or markers absent: append block
 * - Markers present: replace content between them (removes stale content)
 * Returns: 'created' | 'appended' | 'updated' | 'noop'
 */
async function upsertManagedBlock(filePath, startMarker, endMarker, content) {
  await fs.ensureDir(path.dirname(filePath));
  const block = `${startMarker}\n${content}\n${endMarker}`;

  if (!await fs.pathExists(filePath)) {
    await fs.writeFile(filePath, block + '\n', 'utf8');
    return 'created';
  }

  const existing = await fs.readFile(filePath, 'utf8');
  const startIdx = existing.indexOf(startMarker);
  const endIdx   = existing.indexOf(endMarker);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const replacement = existing.slice(0, startIdx) + block + existing.slice(endIdx + endMarker.length);
    if (replacement === existing) return 'noop';
    await fs.writeFile(filePath, replacement, 'utf8');
    return 'updated';
  }

  await fs.writeFile(filePath, existing.trimEnd() + '\n\n' + block + '\n', 'utf8');
  return 'appended';
}

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
async function writeClaudeAgentStubs(srcDir, agentDest, chalk, modules) {
  const STUB_MODULES = ['awm', 'awb'];
  const selectedStubModules = (modules || STUB_MODULES).filter(m => STUB_MODULES.includes(m));

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

      const relManifestPath = `.claude/agents/${stubName}`;
      manifestEntries.push({ relPath: relManifestPath, hash: sha256(stub) });
    }
  }

  if (written > 0) {
    console.log(chalk.green(`  ✓ ${written} Claude Code agent stubs → .claude/agents/`));
  }

  return manifestEntries;
}

module.exports = { install, status, setupTmux };
