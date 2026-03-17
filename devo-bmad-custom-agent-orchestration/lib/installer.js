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

  if (!yes) {
    const { intro, text, multiselect, outro, isCancel } = require('@clack/prompts');
    intro(chalk.bold.cyan(`BMAD Method — ${isUpdate ? 'Update' : 'Install'}`));

    if (isUpdate && existingManifest) {
      console.log(chalk.dim(`  Existing installation: v${existingManifest.version || '?'}`));
      console.log(chalk.dim(`  Installed: ${existingManifest.installDate || '?'}\n`));
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
    await setupTmux(projectRoot, chalk);
  }

  // ── Manifest write ────────────────────────────────────────────────────────
  const now = new Date().toISOString();
  const manifest = {
    version: require('../package.json').version,
    installDate: existingManifest?.installDate || now,
    lastUpdated: now,
    userName: resolvedUserName || 'Developer',
    outputFolder,
    modules: [...modulesToInstall],
    tools: resolvedTools,
  };
  await writeManifest(bmadDir, manifest);
  await writeFilesManifest(bmadDir, newFileEntries);

  console.log(`\n${chalk.bold.green('✓ Done!')} ${installedCount} files ${isUpdate ? 'updated' : 'installed'}.`);
  console.log(`  BMAD is ready at ${chalk.cyan('_devo-bmad-custom/')}\n`);

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

  // Write root CLAUDE.md (claude-code only) — appends BMAD + tmux sections
  if (tool === 'claude-code') {
    const rootClaudePath = path.join(projectRoot, 'CLAUDE.md');
    if (await fs.pathExists(rootClaudePath)) {
      const existing = await fs.readFile(rootClaudePath, 'utf8');
      let updated = existing;
      let changed = false;
      if (!existing.includes(platform.rulesMarker)) { updated += bmadEntry; changed = true; }
      if (!existing.includes('## Agent Spawning (tmux-aware)')) { updated += tmuxEntry; changed = true; }
      if (changed) {
        await fs.writeFile(rootClaudePath, updated, 'utf8');
        console.log(chalk.green('  ✓ CLAUDE.md updated'));
      } else {
        console.log(chalk.gray('  ○ CLAUDE.md already up to date'));
      }
    } else {
      await fs.writeFile(rootClaudePath, `${bmadEntry}${tmuxEntry}`, 'utf8');
      console.log(chalk.green('  ✓ CLAUDE.md created'));
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

  const after = JSON.stringify(settings);
  if (before !== after) {
    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
    console.log(chalk.green('  ✓ .claude/settings.json (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)'));
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
}

/**
 * Write / merge ~/.claude/CLAUDE.md (global) with BMAD + tmux sections.
 * This file is loaded by Claude Code for every project automatically.
 */
async function writeGlobalClaudeMd(bmadEntry, tmuxEntry, chalk) {
  const os = require('os');
  const globalClaudeDir = path.join(os.homedir(), '.claude');
  const globalClaudePath = path.join(globalClaudeDir, 'CLAUDE.md');
  const GLOBAL_BMAD_MARKER = '## BMAD Method';

  await fs.ensureDir(globalClaudeDir);

  if (await fs.pathExists(globalClaudePath)) {
    const existing = await fs.readFile(globalClaudePath, 'utf8');
    let updated = existing;
    let changed = false;
    if (!existing.includes(GLOBAL_BMAD_MARKER)) { updated += bmadEntry; changed = true; }
    if (!existing.includes('## Agent Spawning (tmux-aware)')) { updated += tmuxEntry; changed = true; }
    if (changed) {
      await fs.writeFile(globalClaudePath, updated, 'utf8');
      console.log(chalk.green('  ✓ ~/.claude/CLAUDE.md (global) updated'));
    } else {
      console.log(chalk.gray('  ○ ~/.claude/CLAUDE.md (global) already up to date'));
    }
  } else {
    await fs.writeFile(globalClaudePath, `${bmadEntry}${tmuxEntry}`, 'utf8');
    console.log(chalk.green('  ✓ ~/.claude/CLAUDE.md (global) created'));
  }
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

/**
 * Interactive tmux setup — only offered for claude-code installs.
 * Walks the user through WSL prerequisites, writes all config files and scripts,
 * checks for existing files before overwriting, and prompts for manual steps.
 */
async function setupTmux(projectRoot, chalk) {
  const readline = require('readline');
  const os = require('os');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise(res => rl.question(q, res));

  console.log('\n' + chalk.bold.cyan('━━━ tmux Setup for AI Agent Workflows ━━━'));
  console.log(chalk.dim('  Installs a full tmux config optimized for Claude Code + multi-agent pipelines.'));
  console.log(chalk.dim('  Includes: Catppuccin theme · status bar · pane title sync · clipboard · agent orchestration scripts\n'));

  const doTmux = await ask(chalk.yellow('  Set up tmux? (y/N): '));
  if (!doTmux.toLowerCase().startsWith('y')) {
    console.log(chalk.dim('  Skipping tmux setup.\n'));
    rl.close();
    return;
  }

  // Check tmux version if tmux is already installed
  try {
    const { execSync } = require('child_process');
    const verLine = execSync('tmux -V 2>/dev/null', { stdio: 'pipe' }).toString().trim();
    const match = verLine.match(/tmux (\d+)\.(\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major < 3 || (major === 3 && minor < 4)) {
        console.log(chalk.yellow(`\n  ⚠  tmux ${match[1]}.${match[2]} detected — this config requires tmux 3.4+`));
        console.log(chalk.dim('     pane-title-changed hook requires set-hook -wg (3.4 feature)'));
        console.log(chalk.dim('     Upgrade: sudo apt-get install -y tmux  (or build from source for latest)\n'));
      } else {
        console.log(chalk.green(`  ✓  tmux ${match[1]}.${match[2]} — version OK\n`));
      }
    }
  } catch { /* tmux not installed yet — skip check */ }

  // ── Step 1: Prerequisites ────────────────────────────────────────────────
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

  console.log('\n' + chalk.dim('  Complete the manual steps above, then press Enter to continue with config file installation.'));
  await ask(chalk.yellow('  Press Enter to continue → '));

  // ── Detect environment ──────────────────────────────────────────────────
  const homeDir = os.homedir();
  const tmuxBin = path.join(homeDir, '.config', 'tmux', 'bin');
  const tmuxConf = path.join(homeDir, '.tmux.conf');
  const colorsConf = path.join(homeDir, '.config', 'tmux', 'colors.conf');
  const xclipPath = path.join(homeDir, '.local', 'bin', 'xclip');
  const xdgOpenPath = path.join(homeDir, '.local', 'bin', 'xdg-open');
  const tpmPath = path.join(homeDir, '.tmux', 'plugins', 'tpm');

  const tmuxSrc = path.join(__dirname, '..', 'src', 'docs', 'dev', 'tmux');
  if (!await fs.pathExists(tmuxSrc)) {
    console.log(chalk.yellow('\n  ⚠  tmux bundle not found in this installation. Run `npx @devo-bmad-custom/agent-orchestration` again after a fresh build.'));
    rl.close();
    return;
  }

  await fs.ensureDir(tmuxBin);
  await fs.ensureDir(path.join(homeDir, '.local', 'bin'));
  await fs.ensureDir(path.join(homeDir, '.tmux', 'plugins'));

  // ── Step 2: Shell aliases ────────────────────────────────────────────────
  console.log('\n' + chalk.bold('Step 2 — Shell aliases'));
  const bashrc = path.join(homeDir, '.bashrc');
  const resolvedRoot = path.resolve(projectRoot);
  const tmuxAlias = `alias tmux-ai='tmux new-session -c ${resolvedRoot}'`;
  const tmuxClaudeAlias = `alias tmux-claude='tmux new-session -c ${resolvedRoot} "claude --dangerously-skip-permissions"'`;
  let bashrcContent = '';
  if (await fs.pathExists(bashrc)) bashrcContent = await fs.readFile(bashrc, 'utf8');

  const aliasBlock = `\n# BMAD tmux shortcuts\n${tmuxAlias}\n${tmuxClaudeAlias}\n`;
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

  // xdg-open symlink → wslview
  if (!await fs.pathExists(xdgOpenPath)) {
    try {
      await fs.ensureSymlink('/usr/bin/wslview', xdgOpenPath);
      console.log(chalk.green(`  ✓ ${xdgOpenPath} → /usr/bin/wslview`));
    } catch {
      console.log(chalk.dim(`  ○ Could not create xdg-open symlink (run manually: ln -sf /usr/bin/wslview ~/.local/bin/xdg-open)`));
    }
  } else {
    console.log(chalk.dim(`  ○ ${xdgOpenPath} already exists`));
  }

  // ── Step 3: TPM check ────────────────────────────────────────────────────
  console.log('\n' + chalk.bold('Step 3 — TPM check'));
  if (await fs.pathExists(tpmPath)) {
    console.log(chalk.green('  ✓ TPM already installed at ~/.tmux/plugins/tpm'));
  } else {
    console.log(chalk.yellow('  ⚠  TPM not found — install it before starting tmux:'));
    console.log('  ' + chalk.cyan('git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm'));
    console.log(chalk.dim('  Then inside tmux press Ctrl+B I to install plugins.'));
  }

  // ── Step 4: Write config files (last) ───────────────────────────────────
  console.log('\n' + chalk.bold('Step 4 — Writing config files'));
  console.log(chalk.dim('  Installing tmux.conf, scripts, and support files...\n'));

  const FILE_MAP = [
    ['tmux.conf',               tmuxConf],
    ['colors.conf',             colorsConf],
    ['dispatch.sh',             path.join(tmuxBin, 'dispatch.sh')],
    ['actions_popup.py',        path.join(tmuxBin, 'actions_popup.py')],
    ['actions_popup.sh',        path.join(tmuxBin, 'actions_popup.sh')],
    ['title_sync.sh',           path.join(tmuxBin, 'title_sync.sh')],
    ['float_term.sh',           path.join(tmuxBin, 'float_term.sh')],
    ['float_init.sh',           path.join(tmuxBin, 'float_init.sh')],
    ['open_clip.sh',            path.join(tmuxBin, 'open_clip.sh')],
    ['paste_image_wrapper.sh',  path.join(tmuxBin, 'paste_image_wrapper.sh')],
    ['paste_clipboard.sh',      path.join(tmuxBin, 'paste_clipboard.sh')],
    ['cpu_usage.sh',            path.join(tmuxBin, 'cpu_usage.sh')],
    ['ram_usage.sh',            path.join(tmuxBin, 'ram_usage.sh')],
    ['claude_usage.sh',         path.join(tmuxBin, 'claude_usage.sh')],
    ['xclip',                   xclipPath],
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

  // xdg-open symlink → wslview
  // Copy reference doc to the project
  const tmuxSetupSrc = path.join(tmuxSrc, 'tmux-setup.md');
  if (await fs.pathExists(tmuxSetupSrc)) {
    const refDocDest = path.join(resolvedRoot, 'docs', 'dev', 'tmux', 'README.md');
    await fs.ensureDir(path.dirname(refDocDest));
    await fs.copy(tmuxSetupSrc, refDocDest, { overwrite: true });
    console.log(chalk.green(`  ✓ ${refDocDest} (reference doc)`));
  }

  console.log('\n' + chalk.bold.green('✓ tmux setup complete!'));
  console.log(chalk.dim('  Start tmux and press Ctrl+B I to finish TPM plugin install.\n'));

  rl.close();
}

module.exports = { install, status, setupTmux };
