'use strict';
/**
 * bmad-package/lib/installer.js
 * Core installer — copies src/ files into _devo-bmad-custom/ of the target project,
 * tracks installed files in a manifest, removes orphaned files on update,
 * generates config.yaml, and writes IDE integration files for all supported platforms.
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const yaml = require('yaml');
const { glob } = require('glob');

const SRC_DIR = path.join(__dirname, '..', 'src');
const { setupTmux } = require('./tmuxInstaller');
const { detectPlatform } = require('./platform');

// Modules available in src/
const AVAILABLE_MODULES = ['bmm', 'bmb', 'core', '_memory'];

// Manifest file location (relative to _devo-bmad-custom/)
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
    rulesFile: '.claude/CLAUDE.md',
    rulesMarker: '## BMAD Method',
  },
  'cursor': {
    label: 'Cursor',
    agentDir: '.cursor/rules',
    rulesFile: '.cursor/rules/bmad.mdc',
    rulesMarker: '## BMAD Method',
  },
  'windsurf': {
    label: 'Windsurf',
    agentDir: null,
    rulesFile: '.windsurfrules',
    rulesMarker: '## BMAD Method',
  },
  'cline': {
    label: 'Cline',
    agentDir: null,
    rulesFile: '.clinerules',
    rulesMarker: '## BMAD Method',
  },
  'github-copilot': {
    label: 'GitHub Copilot',
    agentDir: '.github/copilot-instructions.d',
    rulesFile: '.github/copilot-instructions.md',
    rulesMarker: '## BMAD Method',
  },
  'gemini': {
    label: 'Gemini CLI',
    agentDir: null,
    rulesFile: 'GEMINI.md',
    rulesMarker: '## BMAD Method',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function readManifest(bmadDir) {
  const p = path.join(bmadDir, MANIFEST_FILE);
  if (!await fs.pathExists(p)) return null;
  try {
    return yaml.parse(await fs.readFile(p, 'utf8'));
  } catch {
    return null;
  }
}

async function writeManifest(bmadDir, manifest) {
  const p = path.join(bmadDir, MANIFEST_FILE);
  await fs.ensureDir(path.dirname(p));
  await fs.writeFile(p, yaml.stringify(manifest), 'utf8');
}

async function readFilesManifest(bmadDir) {
  const p = path.join(bmadDir, FILES_MANIFEST_FILE);
  if (!await fs.pathExists(p)) return [];
  const lines = (await fs.readFile(p, 'utf8')).split('\n').filter(Boolean);
  return lines.slice(1).map(l => {
    const [relPath, hash] = l.split(',');
    return { relPath, hash };
  });
}

async function writeFilesManifest(bmadDir, entries) {
  const p = path.join(bmadDir, FILES_MANIFEST_FILE);
  await fs.ensureDir(path.dirname(p));
  const lines = ['path,hash', ...entries.map(e => `${e.relPath},${e.hash}`)];
  await fs.writeFile(p, lines.join('\n') + '\n', 'utf8');
}

// ─── Install ─────────────────────────────────────────────────────────────────

async function install(opts) {
  const {
    directory = process.cwd(),
    modules = 'bmm,bmb,core,_memory',
    tools = 'claude-code',
    userName = '',
    outputFolder = '_bmad-output',
    action = 'install',
    yes = false,
  } = opts;

  const projectRoot = path.resolve(directory);
  const bmadDir = path.join(projectRoot, '_devo-bmad-custom');
  const chalk = (await import('chalk')).default;

  // ── Detect existing installation ──────────────────────────────────────────
  const existingManifest = await readManifest(bmadDir);
  const isUpdate = action === 'update' || (action === 'install' && existingManifest != null);
  const effectiveAction = isUpdate ? 'update' : 'install';

  // ── Interactive prompts ───────────────────────────────────────────────────
  let resolvedUserName = userName;

  let resolvedTools = tools ? tools.split(',').map(t => t.trim()).filter(t => t !== 'none') : ['claude-code'];

  // Detect or ask platform
  let platform = existingManifest?.platform || null;
  if (!platform) {
    platform = detectPlatform();
  }

  if (!yes) {
    const { intro, text, multiselect, select, outro, isCancel, cancel } = require('@clack/prompts');
    intro(chalk.bold.cyan(`BMAD Method — ${isUpdate ? 'Update' : 'Install'}`));

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
        { value: 'cursor',          label: 'Cursor',          hint: '.cursor/rules/bmad.mdc' },
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

    outro(`${isUpdate ? 'Updating' : 'Installing'} BMAD...`);
  }

  const selectedModules = modules.split(',').map(m => m.trim()).filter(Boolean);

  console.log(`\n${chalk.bold.blue('BMAD')} ${isUpdate ? 'Update' : 'Install'}`);
  console.log(`  Target:   ${chalk.cyan(projectRoot)}`);
  console.log(`  Modules:  ${chalk.cyan(selectedModules.join(', '))}`);
  console.log(`  IDEs:     ${chalk.cyan(resolvedTools.join(', ') || 'none')}\n`);

  // ── Module install ────────────────────────────────────────────────────────
  const modulesToInstall = new Set(['core', ...selectedModules]);
  if (selectedModules.includes('bmm') || selectedModules.includes('bmb')) {
    modulesToInstall.add('_memory');
  }

  const newFileEntries = [];
  let installedCount = 0;

  for (const mod of modulesToInstall) {
    const srcMod = path.join(SRC_DIR, mod);
    if (!await fs.pathExists(srcMod)) {
      console.log(chalk.yellow(`  ⚠ Module '${mod}' not found in package src/`));
      continue;
    }

    const destMod = path.join(bmadDir, mod);

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
    const destSkills = path.join(projectRoot, '.agents', 'skills');
    await fs.ensureDir(destSkills);
    await fs.copy(pkgSkillsSrc, destSkills, { overwrite: true });
    const skillFiles = await glob('**/*', { cwd: pkgSkillsSrc, nodir: true });
    for (const rel of skillFiles) {
      const content = await fs.readFile(path.join(pkgSkillsSrc, rel));
      newFileEntries.push({ relPath: path.join('.agents/skills', rel).replace(/\\/g, '/'), hash: sha256(content) });
    }
    installedCount += skillFiles.length;
    console.log(chalk.green(`  ✓ .agents/skills/ (${skillFiles.length} files)`));
  }

  // ── Orphan removal (update only) ──────────────────────────────────────────
  if (isUpdate) {
    const oldEntries = await readFilesManifest(bmadDir);
    const newPaths = new Set(newFileEntries.map(e => e.relPath));
    const orphans = oldEntries.filter(e => !newPaths.has(e.relPath));

    if (orphans.length > 0) {
      console.log(chalk.dim(`\n  Removing ${orphans.length} orphaned file(s) from previous version:`));
      for (const orphan of orphans) {
        // _bmad/ files
        let fullPath = path.join(bmadDir, orphan.relPath);
        // .agents/skills/ files
        if (orphan.relPath.startsWith('.agents/')) {
          fullPath = path.join(projectRoot, orphan.relPath);
        }
        if (await fs.pathExists(fullPath)) {
          await fs.remove(fullPath);
          console.log(chalk.dim(`    ✗ ${orphan.relPath}`));
        }
      }
    }
  }

  // ── config.yaml generation ────────────────────────────────────────────────
  for (const mod of selectedModules) {
    const configPath = path.join(bmadDir, mod, 'config.yaml');
    if (!isUpdate || !await fs.pathExists(configPath)) {
      const config = buildModuleConfig(mod, resolvedUserName || 'Developer', outputFolder);
      await fs.ensureDir(path.dirname(configPath));
      await fs.writeFile(configPath, yaml.stringify(config), 'utf8');
      console.log(chalk.green(`  ✓ config.yaml → _devo-bmad-custom/${mod}/`));
    }
  }

  // ── IDE integration ───────────────────────────────────────────────────────
  for (const tool of resolvedTools) {
    await writeIdeConfig(tool, projectRoot, selectedModules, chalk);
  }

  // ── tmux setup (claude-code only) ─────────────────────────────────────────
  if (resolvedTools.includes('claude-code')) {
    await setupTmux(projectRoot, chalk, platform);
  }

  // ── Manifest write ────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const manifest = {
    version: require('../package.json').version,
    installDate: existingManifest?.installDate || now,
    lastUpdated: now,
    userName: resolvedUserName || 'Developer',
    outputFolder,
    platform: platform,
    modules: [...modulesToInstall],
    tools: resolvedTools,
  };
  await writeManifest(bmadDir, manifest);
  await writeFilesManifest(bmadDir, newFileEntries);

  console.log(`\n${chalk.bold.green('✓ Done!')} ${installedCount} files ${isUpdate ? 'updated' : 'installed'}.`);
  console.log(`  BMAD is ready at ${chalk.cyan('_devo-bmad-custom/')}\n`);

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

  // ── Open workflows overview in default browser ─────────────────────────────
  const overviewHtml = path.join(bmadDir, '_memory', 'master-orchestrator-sidecar', 'workflows-overview.html');
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

// ─── Status ───────────────────────────────────────────────────────────────────

async function status(opts) {
  const { directory = process.cwd() } = opts;
  const projectRoot = path.resolve(directory);
  const bmadDir = path.join(projectRoot, '_devo-bmad-custom');
  const chalk = (await import('chalk')).default;

  if (!await fs.pathExists(bmadDir)) {
    console.log(chalk.yellow('BMAD is not installed in this project.'));
    console.log('Run: npx @devo-bmad-custom/agent-orchestration');
    return;
  }

  const manifest = await readManifest(bmadDir);
  console.log(chalk.bold.blue('BMAD Status'));
  if (manifest) {
    console.log(`  Version:   ${chalk.cyan(manifest.version || '?')}`);
    console.log(`  Installed: ${chalk.dim(manifest.installDate || '?')}`);
    console.log(`  Updated:   ${chalk.dim(manifest.lastUpdated || '?')}`);
    console.log(`  User:      ${chalk.dim(manifest.userName || '?')}`);
    console.log(`  IDEs:      ${chalk.dim((manifest.tools || []).join(', ') || 'none')}\n`);
  }

  for (const mod of AVAILABLE_MODULES) {
    const modDir = path.join(bmadDir, mod);
    if (await fs.pathExists(modDir)) {
      const files = await glob('**/*', { cwd: modDir, nodir: true });
      console.log(`  ${chalk.green('✓')} ${mod} (${files.length} files)`);
    } else {
      console.log(`  ${chalk.gray('○')} ${mod} (not installed)`);
    }
  }

  const filesManifest = await readFilesManifest(bmadDir);
  console.log(`\n  ${chalk.dim(`${filesManifest.length} files tracked in manifest`)}`);
}

// ─── Config helpers ───────────────────────────────────────────────────────────

function buildModuleConfig(moduleName, userName, outputFolder) {
  return {
    _note: 'Auto-generated by BMAD installer — safe to edit',
    user_name: userName,
    communication_language: 'English',
    document_output_language: 'English',
    output_folder: `{project-root}/${outputFolder}`,
    [`${moduleName}_output_folder`]: `{project-root}/${outputFolder}/${moduleName}`,
  };
}

// ─── IDE config writers ───────────────────────────────────────────────────────

async function writeIdeConfig(tool, projectRoot, modules, chalk) {
  const platform = PLATFORMS[tool];
  if (!platform) {
    console.log(chalk.yellow(`  ⚠ Unknown IDE platform: ${tool}`));
    return;
  }

  const bmadEntry = buildBmadRulesEntry(modules);
  const tmuxEntry = buildTmuxEntry();

  // Write rules/context file
  if (platform.rulesFile) {
    const rulesPath = path.join(projectRoot, platform.rulesFile);
    await fs.ensureDir(path.dirname(rulesPath));

    if (await fs.pathExists(rulesPath)) {
      const existing = await fs.readFile(rulesPath, 'utf8');
      let updated = existing;
      let changed = false;

      if (!existing.includes(platform.rulesMarker)) {
        updated += bmadEntry;
        changed = true;
      }
      // Only add tmux entry for Claude Code (the only tool with tmux-native pane support)
      if (tool === 'claude-code' && !existing.includes('## Agent Spawning (tmux-aware)')) {
        updated += tmuxEntry;
        changed = true;
      }

      if (changed) {
        await fs.writeFile(rulesPath, updated, 'utf8');
        console.log(chalk.green(`  ✓ ${platform.rulesFile} updated`));
      } else {
        console.log(chalk.gray(`  ○ ${platform.rulesFile} already up to date`));
      }
    } else {
      const header = getFileHeader(tool);
      const content = tool === 'claude-code'
        ? `${header}${bmadEntry}${tmuxEntry}`
        : `${header}${bmadEntry}`;
      await fs.writeFile(rulesPath, content, 'utf8');
      console.log(chalk.green(`  ✓ ${platform.rulesFile} created`));
    }
  }

  // Write root CLAUDE.md (claude-code only) — upserts managed BMAD + tmux sections
  if (tool === 'claude-code') {
    const rootClaudePath = path.join(projectRoot, 'CLAUDE.md');
    await migrateOldClaudeMd(rootClaudePath);
    const bmadResult  = await upsertManagedBlock(rootClaudePath, '<!-- bmad-agent-start -->', '<!-- bmad-agent-end -->', bmadEntry);
    const tmuxResult  = await upsertManagedBlock(rootClaudePath, '<!-- bmad-tmux-start -->',  '<!-- bmad-tmux-end -->',  tmuxEntry);
    const anyChanged  = bmadResult !== 'noop' || tmuxResult !== 'noop';
    if (anyChanged) {
      console.log(chalk.green('  ✓ CLAUDE.md updated (stale sections replaced)'));
    } else {
      console.log(chalk.gray('  ○ CLAUDE.md already up to date'));
    }

    // Write global ~/.claude/CLAUDE.md — applies BMAD + tmux rules to every project
    await writeGlobalClaudeMd(bmadEntry, tmuxEntry, chalk);
  }

  // Create _bmad-output/ folder (output artifacts land here)
  if (tool === 'claude-code') {
    const outputDir = path.join(projectRoot, '_bmad-output');
    if (!await fs.pathExists(outputDir)) {
      await fs.ensureDir(outputDir);
      console.log(chalk.green('  ✓ _bmad-output/ created'));
    } else {
      console.log(chalk.gray('  ○ _bmad-output/ already exists'));
    }
  }

  // Install .claude/commands/bmad-track-*.md slash commands (claude-code only)
  if (tool === 'claude-code') {
    const cmdSrc = path.join(SRC_DIR, '.claude', 'commands');
    if (await fs.pathExists(cmdSrc)) {
      const cmdDest = path.join(projectRoot, '.claude', 'commands');
      await fs.ensureDir(cmdDest);
      const files = (await fs.readdir(cmdSrc)).filter(f => f.startsWith('bmad-track-') && f.endsWith('.md'));
      let installed = 0;
      for (const f of files) {
        await fs.copy(path.join(cmdSrc, f), path.join(cmdDest, f), { overwrite: true });
        installed++;
      }
      if (installed) console.log(chalk.green(`  ✓ ${installed} /bmad-track-* slash commands → .claude/commands/`));
    }
  }

  // Write Claude Code settings.json (env vars, permissions)
  if (tool === 'claude-code') {
    await writeClaudeSettings(projectRoot, chalk);
  }

  // Write per-agent stubs into agent directory (claude-code only for now)
  if (tool === 'claude-code' && platform.agentDir) {
    await writeClaudeAgentStubs(projectRoot, platform.agentDir, chalk);
  }
}

function getFileHeader(tool) {
  switch (tool) {
    case 'cursor':       return '# Cursor Rules — BMAD Method\n';
    case 'windsurf':     return '# Windsurf Rules — BMAD Method\n';
    case 'cline':        return '# Cline Rules — BMAD Method\n';
    case 'github-copilot': return '# GitHub Copilot Instructions — BMAD Method\n';
    case 'gemini':       return '# Gemini CLI Configuration — BMAD Method\n';
    default:             return '# Claude Code Configuration — BMAD Method\n';
  }
}

/**
 * Write / merge .claude/settings.json with BMAD-required env vars.
 * Enables CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS so mode [4] parallel agents
 * work out of the box without manual env setup.
 * Merges with any existing settings — never overwrites user values.
 */
async function writeClaudeSettings(projectRoot, chalk) {
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
  await fs.ensureDir(path.dirname(settingsPath));

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

function buildBmadRulesEntry(modules) {
  return [
    '',
    '## BMAD Method',
    '',
    'BMAD agents, skills, and workflows are installed in `_devo-bmad-custom/`.',
    'Key modules: ' + modules.join(', '),
    '',
    'To use an agent, load its `.md` file and follow its activation instructions.',
    'Agent configs are in `_devo-bmad-custom/{module}/config.yaml`.',
    'Skills are in `.agents/skills/` and `_bmad/_memory/skills/`.',
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

/**
 * Write / merge ~/.claude/CLAUDE.md (global) with BMAD + tmux sections.
 * This file is loaded by Claude Code for every project automatically.
 */
async function writeGlobalClaudeMd(bmadEntry, tmuxEntry, chalk) {
  const os = require('os');
  const globalClaudeDir = path.join(os.homedir(), '.claude');
  const globalClaudePath = path.join(globalClaudeDir, 'CLAUDE.md');

  await fs.ensureDir(globalClaudeDir);

  // Migrate: strip old markerless sections left by pre-1.0.21 installers
  await migrateOldClaudeMd(globalClaudePath);

  const bmadResult = await upsertManagedBlock(globalClaudePath, '<!-- bmad-agent-start -->', '<!-- bmad-agent-end -->', bmadEntry);
  const tmuxResult = await upsertManagedBlock(globalClaudePath, '<!-- bmad-tmux-start -->',  '<!-- bmad-tmux-end -->',  tmuxEntry);
  const anyChanged = bmadResult !== 'noop' || tmuxResult !== 'noop';

  if (bmadResult === 'created' || tmuxResult === 'created') {
    console.log(chalk.green('  ✓ ~/.claude/CLAUDE.md (global) created'));
  } else if (anyChanged) {
    console.log(chalk.green('  ✓ ~/.claude/CLAUDE.md (global) updated (stale sections replaced)'));
  } else {
    console.log(chalk.gray('  ○ ~/.claude/CLAUDE.md (global) already up to date'));
  }
}

/**
 * One-time migration: remove old markerless BMAD/tmux sections injected by
 * pre-1.0.21 installers. Detects the old heading anchors and strips from that
 * heading to the next top-level heading (or end of file). No-ops if file has
 * new managed-block markers already, or if old headings are not present.
 */
async function migrateOldClaudeMd(filePath) {
  if (!await fs.pathExists(filePath)) return;
  const content = await fs.readFile(filePath, 'utf8');
  // Already migrated — new markers present
  if (content.includes('<!-- bmad-agent-start -->') || content.includes('<!-- bmad-tmux-start -->')) return;

  const OLD_MARKERS = ['## BMAD Method', '## Agent Spawning (tmux-aware)'];
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
 * can discover BMAD agents without requiring the user to manually load them.
 */
async function writeClaudeAgentStubs(projectRoot, agentDir, chalk) {
  const agentsDest = path.join(projectRoot, agentDir);
  const bmadAgentsGlob = await glob('**/*.agent.md', {
    cwd: path.join(projectRoot, '_devo-bmad-custom'),
    nodir: true,
  });

  if (bmadAgentsGlob.length === 0) return;

  await fs.ensureDir(agentsDest);
  let written = 0;

  for (const rel of bmadAgentsGlob) {
    const agentPath = path.join(projectRoot, '_devo-bmad-custom', rel);
    const raw = await fs.readFile(agentPath, 'utf8');

    // Extract name + description from frontmatter if present
    const nameMatch = raw.match(/^name:\s*['"]?(.+?)['"]?\s*$/m);
    const descMatch = raw.match(/^description:\s*['"]?(.+?)['"]?\s*$/m);
    const name = nameMatch?.[1] || path.basename(rel, '.agent.md');
    const description = descMatch?.[1] || `BMAD agent: ${name}`;

    const stubFile = path.join(agentsDest, `bmad-${path.basename(rel, '.agent.md')}.md`);
    const stub = [
      '---',
      `name: '${name}'`,
      `description: '${description}'`,
      '---',
      '',
      'You must fully embody this agent\'s persona when activated.',
      '',
      `<agent-activation CRITICAL="TRUE">`,
      `1. LOAD the full agent file from {project-root}/_devo-bmad-custom/${rel}`,
      '2. READ its entire contents before responding.',
      '3. FOLLOW all activation instructions within it.',
      '</agent-activation>',
      '',
    ].join('\n');

    await fs.writeFile(stubFile, stub, 'utf8');
    written++;
  }

  if (written > 0) {
    console.log(chalk.green(`  ✓ ${agentDir}/ (${written} agent stubs)`));
  }
}

module.exports = { install, status, setupTmux };
