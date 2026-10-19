'use strict';

const fs = require('fs-extra');
const path = require('path');
const { readArcwrightCodeHomes } = require('./arcwright-code-homes');
const { readState } = require('./sharing-state');

const PROVIDERS = {
  claude: { dir: '.claude', instructions: 'CLAUDE.md', env: 'CLAUDE_CONFIG_DIR', command: 'claude', markers: ['CLAUDE.md', 'settings.json', '.credentials.json', 'skills', 'projects'] },
  codex: { dir: '.codex', instructions: 'AGENTS.md', env: 'CODEX_HOME', command: 'codex', markers: ['AGENTS.md', 'config.toml', 'auth.json', 'skills', 'sessions'] },
  grok: { dir: '.grok', instructions: 'AGENTS.md', env: 'GROK_HOME', command: 'grok', markers: ['AGENTS.md', 'settings.json', 'config.json', 'auth.json', '.credentials.json', 'credentials.json', 'skills', 'sessions'] },
  opencode: { dir: '.config/opencode', instructions: 'AGENTS.md', multiAccount: false, markers: [] },
};
const slugValid = name => /^[a-z][a-z0-9-]*$/.test(name) && !['main', 'default', 'backup', 'backups'].includes(name);
const quote = value => `'${String(value).replace(/'/g, `'\\''`)}'`;

async function discoverAccountEnvironments({ homeDir, env = process.env, codeHomes, saved, platform = process.platform }) {
  codeHomes ||= await readArcwrightCodeHomes({ homeDir });
  const entries = await fs.readdir(homeDir).catch(() => []);
  const state = await readState(homeDir);
  const identity = async file => file ? fs.realpath(file).catch(() => path.resolve(file)) : null;
  const codeRefs = await Promise.all((codeHomes.codex || []).map(async item => ({ ...item, sharedRealPath: await identity(item.sharedHome), shadowRealPath: await identity(item.shadowHome) })));
  const claudeRefs = await Promise.all((codeHomes.claude || []).map(async item => ({ ...item, realPath: await identity(item.home) })));
  const homes = [];
  for (const [provider, spec] of Object.entries(PROVIDERS)) {
    const main = path.join(homeDir, spec.dir);
    const candidates = [main];
    if (spec.multiAccount !== false) {
      const re = new RegExp(`^\\${spec.dir}(?:${provider === 'claude' ? '-' : '[-_]'}).+`);
      candidates.push(...entries.filter(name => re.test(name) && !/(?:backup|archive|\.bak(?:$|[.-]))/i.test(name)).map(name => path.join(homeDir, name)));
      if (env[spec.env]) candidates.push(path.resolve(env[spec.env]));
      candidates.push(...Object.keys(saved?.providers?.[provider]?.accounts || {}));
      if (provider === 'codex') for (const item of codeHomes.codex || []) candidates.push(item.sharedHome, item.shadowHome);
      if (provider === 'claude') for (const item of codeHomes.claude || []) candidates.push(item.home);
    }
    const seen = new Set();
    for (const candidate of candidates.filter(Boolean)) {
      const full = path.resolve(candidate);
      if (/backup|archive/i.test(path.basename(full))) continue;
      const stat = await fs.stat(full).catch(() => null);
      if (stat && !stat.isDirectory()) continue;
      if (!stat && full !== main && !saved?.providers?.[provider]?.accounts?.[full]?.create) continue;
      const real = await identity(full);
      const code = provider === 'codex' && (codeRefs.find(item => item.shadowRealPath === real) || codeRefs.find(item => item.sharedRealPath === real));
      const claudeCode = provider === 'claude' && claudeRefs.find(item => item.realPath === real);
      if (full !== main && stat && !code && !claudeCode && !saved?.providers?.[provider]?.accounts?.[full] && !(await Promise.all(spec.markers.map(marker => fs.pathExists(path.join(full, marker))))).some(Boolean)) continue;
      if (seen.has(real)) continue;
      seen.add(real);
      const account = saved?.providers?.[provider]?.accounts?.[full];
      homes.push({ provider, path: full, label: full === main ? 'main' : path.basename(full).replace(/^\.(?:claude|codex|grok)[-_]/, ''),
        main: full === main, exists: !!stat, realPath: real, owner: code || claudeCode ? 'arcwright-code' : state.operations.some(record => record.path === full && record.action === 'mkdir' && !record.restored) || !stat && account?.create ? 'installer' : 'external',
        shadow: !!code && code.shadowRealPath === real, sharedHome: code?.sharedHome || null, sharedRealPath: code?.sharedRealPath || null,
        supported: platform !== 'win32', ownershipUnknown: codeHomes.status === 'unreadable' && full !== main });
    }
  }
  const unsupported = [];
  for (const provider of ['hermes', 'cursor']) if (await fs.pathExists(path.join(homeDir, `.${provider}`))) unsupported.push(`${provider}: not yet supported`);
  if (platform === 'win32') unsupported.push('Native Windows: not yet supported; no writes');
  return { homes, codeHomes, unsupported };
}

function launcherContent(provider, home) {
  const spec = PROVIDERS[provider];
  return `#!/bin/sh\n# arcwright-account-launcher: v1\nexport ${spec.env}=${quote(home)}\nexec ${spec.command} "$@"\n`;
}

function loginCommand(provider, home, headless = !process.env.DISPLAY) {
  const spec = PROVIDERS[provider];
  const args = provider === 'claude' ? ['auth', 'login'] : provider === 'codex' ? ['login', ...(headless ? ['--device-auth'] : [])] : ['login', headless ? '--device-auth' : '--oauth'];
  return { command: spec.command, args, env: { [spec.env]: home }, display: `${spec.env}=${quote(home)} ${spec.command} ${args.join(' ')}` };
}

module.exports = { PROVIDERS, slugValid, discoverAccountEnvironments, launcherContent, loginCommand };
