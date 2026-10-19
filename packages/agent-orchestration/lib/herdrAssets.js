'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const { upsertManagedBlock } = require('./managed-md');

const SHELL_START = '# >>> arcwright-herdr-launchers >>>';
const SHELL_END = '# <<< arcwright-herdr-launchers <<<';

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Set one scalar in a TOML section without duplicating the section. */
async function upsertTomlSetting(filePath, section, key, value) {
  await fs.ensureDir(path.dirname(filePath));
  const original = await fs.readFile(filePath, 'utf8').catch(() => '');
  const lines = original.split(/\r?\n/);
  const header = `[${section}]`;
  const start = lines.findIndex((line) => line.trim() === header);

  if (start === -1) {
    const prefix = original.trimEnd();
    const addition = `${header}\n${key} = ${value}\n`;
    await fs.writeFile(filePath, prefix ? `${prefix}\n\n${addition}` : addition, 'utf8');
    return;
  }

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^\s*\[/.test(lines[i])) {
      end = i;
      break;
    }
  }
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const setting = new RegExp(`^\\s*${escapedKey}\\s*=`);
  const existing = lines.findIndex((line, i) => i > start && i < end && setting.test(line));
  if (existing === -1) lines.splice(end, 0, `${key} = ${value}`);
  else lines[existing] = `${key} = ${value}`;
  await fs.writeFile(filePath, lines.join('\n'), 'utf8');
}

function herdrTemplate(name) {
  return path.join(__dirname, 'templates', 'herdr', name);
}

function hasHerdrHook(group) {
  return (group?.hooks || []).some((hook) =>
    typeof hook.command === 'string' && /herdr-agent-(?:state|session)/.test(hook.command)
  );
}

/**
 * List every Claude Code config home under `homeDir`.
 *
 * Claude Code supports multiple config homes (~/.claude, ~/.claude-alt,
 * ~/.claude-work, …) selected per session via CLAUDE_CONFIG_DIR. Each carries
 * its OWN settings.json — env vars, permission mode, and hooks are not shared,
 * even when the sibling profiles symlink agents/commands/skills back to the
 * default one. Anything writing global Claude settings has to reach all of them.
 *
 * The default ~/.claude is always included, even if it does not exist yet.
 */
async function listClaudeProfileDirs(homeDir = os.homedir(), { sharing, codeHomes } = {}) {
  const entries = await fs.readdir(homeDir, { withFileTypes: true }).catch(() => []);
  const profileDirs = entries
    .filter((entry) => entry.isDirectory() && /^\.claude(?:-.+)?$/.test(entry.name) && !/backup|archive|\.bak(?:$|[.-])/i.test(entry.name))
    .map((entry) => path.join(homeDir, entry.name));
  const defaultProfile = path.join(homeDir, '.claude');
  if (!profileDirs.includes(defaultProfile)) profileDirs.unshift(defaultProfile);
  const identity = async file => fs.realpath(file).catch(() => path.resolve(file));
  const shadows = new Set(await Promise.all((codeHomes?.codex || []).map(item => item.shadowHome).filter(Boolean).map(identity)));
  const safeProfiles = [];
  for (const profileDir of profileDirs) if (!shadows.has(await identity(profileDir))) safeProfiles.push(profileDir);
  if (!sharing) return safeProfiles;
  if (codeHomes?.status === 'unreadable') return [];
  // Enrollment never grants permission to alter excluded accounts' private settings.
  const { choiceFor } = require('./global-sharing');
  return safeProfiles.filter(profileDir => {
    if ((codeHomes?.codex || []).some(item => item.shadowHome === profileDir)) return false;
    const choice = choiceFor(sharing, { provider: 'claude', path: profileDir, main: profileDir === defaultProfile });
    return choice.instructions || choice.skills;
  });
}

async function installProfileHook(profileDir, hookPath) {
  const settingsPath = path.join(profileDir, 'settings.json');
  let settings = {};
  try {
    settings = await fs.readJson(settingsPath);
  } catch {
    // Do not replace an invalid user-owned settings file.
    if (await fs.pathExists(settingsPath)) return;
  }
  if (!isPlainObject(settings)) return;
  if (settings.hooks === undefined) settings.hooks = {};
  if (!isPlainObject(settings.hooks)) return;
  const existing = Array.isArray(settings.hooks.SessionStart) ? settings.hooks.SessionStart : [];
  const command = `bash '${hookPath}'`;
  settings.hooks.SessionStart = [
    { matcher: '*', hooks: [{ type: 'command', command, timeout: 10 }] },
    ...existing.filter((group) => !hasHerdrHook(group)),
  ];
  await fs.ensureDir(profileDir);
  await fs.writeJson(settingsPath, settings, { spaces: 2 });
}

/** Install scripts, shell launch policy, and profile-aware Claude hooks. */
async function installHerdrAssets(homeDir = os.homedir()) {
  const binDir = path.join(homeDir, '.local', 'bin');
  const hooksDir = path.join(homeDir, '.claude', 'hooks');
  const launcherDir = path.join(homeDir, '.config', 'arcwright');
  await Promise.all([fs.ensureDir(binDir), fs.ensureDir(hooksDir), fs.ensureDir(launcherDir)]);

  const clipboardPath = path.join(binDir, 'herdr-clipboard-paste');
  const hookPath = path.join(hooksDir, 'herdr-agent-session.sh');
  const launcherPath = path.join(launcherDir, 'herdr-agent-launchers.sh');
  await fs.copy(herdrTemplate('clipboard-paste.sh'), clipboardPath, { overwrite: true });
  await fs.copy(herdrTemplate('claude-session-profile.sh'), hookPath, { overwrite: true });
  await fs.copy(herdrTemplate('agent-launchers.sh'), launcherPath, { overwrite: true });
  await Promise.all([fs.chmod(clipboardPath, 0o755), fs.chmod(hookPath, 0o755)]);

  const sourceLine = `[ -f "${launcherPath}" ] && source "${launcherPath}"`;
  const rcFiles = [path.join(homeDir, '.bashrc')];
  const zshrc = path.join(homeDir, '.zshrc');
  if (await fs.pathExists(zshrc)) rcFiles.push(zshrc);
  for (const rcFile of rcFiles) {
    await upsertManagedBlock(rcFile, SHELL_START, SHELL_END, sourceLine);
  }

  const profileDirs = await listClaudeProfileDirs(homeDir);
  await Promise.all(profileDirs.map((profileDir) => installProfileHook(profileDir, hookPath)));

  return { clipboardPath, hookPath, launcherPath, profileDirs };
}

module.exports = {
  installHerdrAssets,
  installProfileHook,
  listClaudeProfileDirs,
  isPlainObject,
  upsertTomlSetting,
  SHELL_START,
  SHELL_END,
};
