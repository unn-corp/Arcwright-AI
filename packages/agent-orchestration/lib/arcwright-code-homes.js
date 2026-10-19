'use strict';

const fs = require('node:fs');
const path = require('node:path');

function resolveHome(value, homeDir, fallback) {
  if (value == null || value.trim() === '') return fallback;
  const trimmed = value.trim();
  const expanded = trimmed === '~' || trimmed.startsWith('~/') || trimmed.startsWith('~\\')
    ? path.join(homeDir, trimmed.slice(1))
    : trimmed;
  return path.resolve(homeDir, expanded);
}

/** Read only provider home fields; never expose settings or parse errors. */
function readArcwrightCodeHomes({ homeDir, settingsPaths = [path.join(homeDir, '.t3', 'userdata', 'settings.json')] }) {
  const result = { status: 'missing', codex: [], claude: [] };
  const unreadable = () => ({ status: 'unreadable', codex: [], claude: [] });
  for (const settingsPath of settingsPaths) {
    let settings;
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      return unreadable();
    }
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return unreadable();
    result.status = 'ok';
    const instances = settings.providerInstances ?? {};
    if (!instances || typeof instances !== 'object' || Array.isArray(instances)) return unreadable();
    for (const [instanceId, instance] of Object.entries(instances)) {
      const driver = instance?.driver;
      if (!['codex', 'claude', 'claudeAgent'].includes(driver)) continue;
      const config = instance.config ?? {};
      if (typeof config !== 'object' || Array.isArray(config)) return unreadable();
      if (config.homePath != null && typeof config.homePath !== 'string') return unreadable();
      if (driver === 'codex') {
        if (config.shadowHomePath != null && typeof config.shadowHomePath !== 'string') return unreadable();
        result.codex.push({
          instanceId,
          sharedHome: resolveHome(config.homePath, homeDir, path.resolve(homeDir, '.codex')),
          shadowHome: resolveHome(config.shadowHomePath, homeDir, null),
        });
      } else {
        result.claude.push({
          instanceId,
          home: resolveHome(config.homePath, homeDir, path.resolve(homeDir, '.claude')),
        });
      }
    }
  }
  return result;
}

module.exports = { readArcwrightCodeHomes };
