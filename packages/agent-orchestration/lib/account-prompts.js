'use strict';
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const yaml = require('yaml');
const { PROVIDERS, slugValid, discoverAccountEnvironments, loginCommand } = require('./account-environments');
const { resolveSharingPreferences, choiceFor, personalCandidates, buildSharingPlan, formatSharingPlan, applyGlobalSharing } = require('./global-sharing');

async function prepareGlobalSharing({ homeDir, saved, options = {}, codeHomes, env, rules, managedPaths = [], prompts, log = console.log, platform = process.platform }) {
  let discovery = await discoverAccountEnvironments({ homeDir, codeHomes, env, saved, platform });
  let sharing = await resolveSharingPreferences({ saved, options, discovery });
  const interactive = !options.yes && !options.dryRun && (options.configure || options.sharing === 'custom' && options.sharingConfig === undefined || !saved?.offered && options.sharing === undefined);
  const approvals = [];
  const abort = () => ({ cancelled: true, sharing: saved, discovery });
  if (interactive && platform !== 'win32') {
    prompts ||= await import('@clack/prompts');
    const ask = async (method, input) => {
      const answer = await prompts[method](input);
      return prompts.isCancel(answer) ? undefined : answer;
    };
    let mode = options.sharing;
    if (!mode || options.configure) mode = await ask('select', { message: 'Share global instructions and personal skills?', options: [{ value: 'all', label: 'All detected supported homes' }, { value: 'custom', label: 'Choose providers, accounts and items' }, { value: 'none', label: 'None (restore owned sharing changes)' }], initialValue: saved?.mode || 'none' });
    if (mode === undefined) return abort();
    sharing = await resolveSharingPreferences({ saved, options: { ...options, sharing: mode }, discovery });
    for (const home of discovery.homes) log(`${home.provider}: ${home.path} (${home.owner}${home.shadow ? `, shadow of ${home.sharedHome}` : ''})`);
    if (mode === 'custom') {
      sharing.providers = {};
      for (const provider of Object.keys(PROVIDERS)) {
        const items = await ask('multiselect', { message: `${provider}: which items?`, required: false, options: [{ value: 'instructions', label: 'Global instructions' }, { value: 'skills', label: 'Personal skills' }], initialValues: ['instructions', 'skills'].filter(key => saved?.providers?.[provider]?.[key]) });
        if (!items) return abort();
        const choice = { instructions: items.includes('instructions'), skills: items.includes('skills'), accounts: {} };
        sharing.providers[provider] = choice;
        for (const home of discovery.homes.filter(item => item.provider === provider && !item.main && items.length)) {
          const accountItems = await ask('multiselect', { message: `${home.path} (${home.owner}): which items?`, required: false,
            options: items.map(value => ({ value, label: value === 'instructions' ? 'Global instructions' : 'Personal skills' })),
            initialValues: items.filter(key => saved?.providers?.[provider]?.accounts?.[home.path]?.[key]) });
          if (!accountItems) return abort();
          if (accountItems.length) choice.accounts[home.path] = { ...(saved?.providers?.[provider]?.accounts?.[home.path] || {}), instructions: accountItems.includes('instructions'), skills: accountItems.includes('skills') };
        }
      }
    }
    if (mode !== 'none') {
      for (const [provider, spec] of Object.entries(PROVIDERS)) {
        if (spec.multiAccount === false || !sharing.providers[provider]?.instructions && !sharing.providers[provider]?.skills) continue;
        const detected = discovery.homes.filter(home => home.provider === provider && !home.shadow);
        const total = await ask('text', { message: `${provider}: total accounts wanted (detected ${detected.length})`, initialValue: String(detected.length), validate: value => /^\d+$/.test(value) && Number(value) >= detected.length && Number(value) <= 50 ? undefined : `Enter ${detected.length} to 50; existing accounts are never deleted` });
        if (total === undefined) return abort();
        for (let index = detected.length; index < Number(total); index++) {
          const name = await ask('text', { message: `${provider}: short full-word name for account ${index + 1}`, validate: value => !slugValid(value) ? 'Use [a-z][a-z0-9-]*, for example work or personal' : fs.existsSync(path.join(homeDir, `${spec.dir}-${value}`)) || sharing.providers[provider].accounts?.[path.join(homeDir, `${spec.dir}-${value}`)] ? 'That account home already exists' : undefined });
          if (name === undefined) return abort();
          sharing.providers[provider].accounts ||= {};
          sharing.providers[provider].accounts[path.join(homeDir, `${spec.dir}-${name}`)] = { create: true, name, instructions: sharing.providers[provider].instructions, skills: sharing.providers[provider].skills };
        }
      }
      for (const item of await personalCandidates({ homeDir, discovery, managedPaths })) {
        const home = discovery.homes.find(home => item.path.startsWith(home.path + path.sep));
        if (item.kind === 'section' && (!home || !choiceFor(sharing, home).instructions)) continue;
        if (item.kind === 'skill' && !Object.values(sharing.providers).some(value => value.skills)) continue;
        const label = item.kind === 'section' ? `section "${item.heading}" (${item.lines} lines) in ${item.path}` : `whole personal bundle ${item.path}`;
        const yes = await ask('confirm', { message: `Adopt ${label} into ~/.arcwright?`, initialValue: false });
        if (yes === undefined) return abort();
        if (yes) approvals.push(item);
      }
      if (options.codexSelfHeal === undefined) {
        const selfHeal = await ask('confirm', { message: 'Enable Codex daemon self-heal on every global install/update?', initialValue: sharing.codexSelfHeal === true });
        if (selfHeal === undefined) return abort();
        sharing.codexSelfHeal = selfHeal;
      }
      if (options.credentialCopyCheck === undefined) {
        const copied = await ask('confirm', { message: 'Enable local-only copied-login checks? No credentials leave this machine.', initialValue: sharing.credentialCopyCheck === 'local' });
        if (copied === undefined) return abort();
        sharing.credentialCopyCheck = copied ? 'local' : 'off';
      }
      sharing.adoptedPersonalItems = [...(saved?.adoptedPersonalItems || []), ...approvals.map(({ text, fingerprint, ...item }) => item)];
    }
    discovery = await discoverAccountEnvironments({ homeDir, codeHomes: discovery.codeHomes, env, saved: sharing, platform });
  }
  // Resolve explicit newly-created accounts supplied by unattended custom configuration too.
  if (sharing && !interactive) discovery = await discoverAccountEnvironments({ homeDir, codeHomes: discovery.codeHomes, env, saved: sharing, platform });
  const plan = await buildSharingPlan({ homeDir, sharing, discovery, rules, personalApprovals: approvals, unattended: !!options.yes, platform });
  if (sharing && approvals.length) {
    const accepted = approvals.filter(item => plan.operations.some(op => item.kind === 'skill'
      ? op.action === 'adopt' && op.source === item.path
      : op.path === path.join(homeDir, '.arcwright', 'AGENTS.md')));
    sharing.adoptedPersonalItems = [...(saved?.adoptedPersonalItems || []), ...accepted.map(({ fingerprint, ...item }) => item)];
  }
  for (const line of formatSharingPlan(plan)) log(line);
  if (sharing?.codexSelfHeal || sharing?.credentialCopyCheck === 'local') log(`Codex home health: self-heal ${sharing.codexSelfHeal ? 'on' : 'off'}, copied-login ${sharing.credentialCopyCheck || 'off'}; backup ${path.join(homeDir, '.arcwright', 'backups', 'codex-home-health')}`);
  if (!options.yes && !options.dryRun && (plan.operations.length || plan.detach?.operations.length || sharing?.mode !== 'none' && JSON.stringify(saved) !== JSON.stringify(sharing))) {
    prompts ||= await import('@clack/prompts');
    const confirmed = await prompts.confirm({ message: 'Apply this sharing plan?', initialValue: false });
    if (prompts.isCancel(confirmed) || !confirmed) return abort();
  }
  return { sharing, discovery, plan, cancelled: false };
}

async function runGlobalSharing(prepared, { dryRun = false, yes = false, log = console.log, health, platform = process.platform } = {}) {
  if (prepared.cancelled) return prepared;
  const result = await applyGlobalSharing(prepared.plan, { dryRun });
  result.pending = [...new Set([...result.pending, ...(prepared.plan.detach?.pending || [])])];
  if (result.pending.length) {
    for (const reason of result.pending) log(`Pending: ${reason}`);
    if (yes) process.exitCode = 2;
  }
  const sharing = prepared.sharing;
  if (platform !== 'win32' && (sharing?.codexSelfHeal || sharing?.credentialCopyCheck === 'local')) {
    health ||= require('./codex-home-health');
    const report = await health.runCodexHomeHealth({ homeDir: prepared.plan.homeDir, codeHomes: prepared.discovery.codeHomes, policy: { selfHeal: !!sharing.codexSelfHeal, copiedLoginCheck: sharing.credentialCopyCheck || 'off' }, dryRun, backupRoot: path.join(prepared.plan.homeDir, '.arcwright', 'backups', 'codex-home-health'), platform });
    for (const line of health.formatCodexHomeHealth(report)) log(line);
  }
  return result;
}
async function signInWalkthrough({ sharing, discovery }, { yes = false, dryRun = false, prompts, run = spawnSync, log = console.log, env = process.env } = {}) {
  if (yes || dryRun || !sharing || sharing.mode === 'none') return;
  prompts ||= await import('@clack/prompts');
  for (const home of discovery.homes) {
    if (!home.supported || home.shadow || home.ownershipUnknown || discovery.codeHomes.status === 'unreadable' || home.provider === 'opencode') continue;
    const choice = choiceFor(sharing, home);
    if (!choice.instructions && !choice.skills) continue;
    if (!(await fs.stat(home.path).catch(() => null))?.isDirectory()) { log(`${home.path}: setup pending; sign in later`); continue; }
    const login = loginCommand(home.provider, home.path, !env.DISPLAY && !env.WAYLAND_DISPLAY);
    log(`Separate sign-in for ${home.path}: ${login.display}`);
    const now = await prompts.select({ message: `Sign in to ${home.provider} at ${home.path}?`, options: [{ value: 'later', label: 'Later' }, { value: 'now', label: 'Sign in now' }] });
    if (prompts.isCancel(now)) return;
    if (now === 'now') {
      const result = run(login.command, login.args, { stdio: 'inherit', env: { ...env, ...login.env } });
      log(result.status === 0 ? `${home.path}: sign-in command completed` : `${home.path}: sign-in pending`);
    } else log(`${home.path}: sign-in pending`);
  }
}
async function accountsStatus(options = {}) {
  const homeDir = options.homeDir || os.homedir();
  const manifest = await fs.readFile(path.join(homeDir, '.arcwright', '_config', 'manifest.yaml'), 'utf8').then(yaml.parse).catch(() => null);
  const discovery = await discoverAccountEnvironments({ homeDir, env: options.env, codeHomes: options.codeHomes, saved: manifest?.sharing, platform: options.platform });
  const warnings = [];
  for (const home of discovery.homes.filter(home => home.provider === 'codex')) {
    if (await fs.pathExists(path.join(home.path, 'AGENTS.override.md'))) warnings.push(`${home.path}/AGENTS.override.md takes precedence over AGENTS.md`);
  }
  const result = { sharing: manifest?.sharing || null, ...discovery, warnings };
  if (options.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`Sharing: ${manifest?.sharing?.mode || 'legacy (not enrolled)'}`);
    for (const home of discovery.homes) console.log(`${home.provider}: ${home.path} (${home.owner}${home.shadow ? `, shadow inherits ${home.sharedHome}` : ''}); instructions ${!!choiceFor(manifest?.sharing, home).instructions}; skills ${!!choiceFor(manifest?.sharing, home).skills}`);
    for (const line of [...discovery.unsupported, ...warnings]) console.log(line);
  }
  return result;
}
async function configureAccounts(options = {}) {
  const homeDir = options.homeDir || os.homedir();
  const file = path.join(homeDir, '.arcwright', '_config', 'manifest.yaml');
  const manifest = await fs.readFile(file, 'utf8').then(yaml.parse).catch(error => { if (error.code === 'ENOENT') return {}; throw error; });
  const installer = require('./installer');
  const tracked = await installer._internal.readFilesManifest(path.join(homeDir, '.arcwright'));
  const managedPaths = options.managedPaths || tracked.map(entry => installer._internal.resolveInstalledPath(entry.relPath, {
    isGlobal: true, projectRoot: homeDir, effectiveArwDir: path.join(homeDir, '.arcwright'), homes: { linux: homeDir }, platform: options.platform || process.platform,
  })).filter(Boolean);
  const rules = options.rules || require('./installer')._internal.buildArcwrightRulesEntry(manifest.modules || ['core', 'awm', 'awb', '_memory'], !!manifest.unnamedPm);
  const prepared = await prepareGlobalSharing({ homeDir, saved: manifest.sharing, options: { ...options, configure: true }, codeHomes: options.codeHomes, env: options.env, rules, managedPaths, prompts: options.prompts, platform: options.platform });
  if (prepared.cancelled) return prepared;
  const result = await runGlobalSharing(prepared, options);
  if (!options.dryRun && (options.platform || process.platform) !== 'win32' && JSON.stringify(manifest.sharing) !== JSON.stringify(prepared.sharing)) {
    await fs.ensureDir(path.dirname(file), { mode: 0o700 });
    await fs.writeFile(file, yaml.stringify({ ...manifest, sharing: prepared.sharing }), { mode: 0o600 });
  }
  await signInWalkthrough(prepared, options);
  return { ...prepared, result };
}
module.exports = { prepareGlobalSharing, runGlobalSharing, signInWalkthrough, accountsStatus, configureAccounts };
