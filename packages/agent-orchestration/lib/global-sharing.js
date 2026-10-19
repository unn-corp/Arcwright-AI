'use strict';
const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { PROVIDERS, slugValid, discoverAccountEnvironments, launcherContent } = require('./account-environments');
const { snapshot, equal, safeParents, readState, applySharingPlan, planRestore, restoreSharing } = require('./sharing-state');
const START = '<!-- arcwright-agent-start -->';
const END = '<!-- arcwright-agent-end -->';
const RETIRED = '<!-- arcwright-claude-imports: retired -->';
const MANAGED_BLOCK = /<!-- arcwright-(?:agent|instructions|orchestration|proactive|tmux)-start -->[\s\S]*?<!-- arcwright-(?:agent|instructions|orchestration|proactive|tmux)-end -->/g;
// Only complete, known installer blocks confer ownership.
function personalText(text) {
  return text.replace(MANAGED_BLOCK, '').trim();
}
function removePersonalSections(text, approved) {
  const parts = text.split(new RegExp(`(${MANAGED_BLOCK.source})`, 'g'));
  const personal = parts.filter((_, index) => index % 2 === 0).join('');
  const ranges = approved.map(section => {
    const start = personal.indexOf(section);
    return [start, start + section.length];
  }).filter(([start]) => start >= 0).sort((a, b) => b[0] - a[0]);
  let offset = 0;
  return parts.map((part, index) => {
    if (index % 2) return part;
    const start = offset;
    offset += part.length;
    // Remove reviewed personal spans, leaving managed blocks to the host's policy.
    for (const [from, to] of ranges) part = part.slice(0, Math.max(0, from - start)) + part.slice(Math.max(0, to - start));
    return part;
  }).join('');
}
function sections(text) {
  const result = [];
  for (const part of personalText(text).split(/(?=^#{1,6} )/m)) {
    if (part.trim()) result.push({ heading: part.match(/^#{1,6} (.+)/m)?.[1] || '(unheaded rules)', text: part, lines: part.split('\n').length, hash: crypto.createHash('sha256').update(part).digest('hex') });
  }
  return result;
}
function validatePreferences(sharing) {
  if (!sharing || sharing.schemaVersion !== 1 || !['all', 'custom', 'none'].includes(sharing.mode)) throw new Error('Invalid sharing configuration: schemaVersion 1 and mode all|custom|none required');
  if (sharing.codexSelfHeal !== undefined && typeof sharing.codexSelfHeal !== 'boolean') throw new Error('codexSelfHeal must be boolean');
  if (sharing.credentialCopyCheck !== undefined && !['local', 'off'].includes(sharing.credentialCopyCheck)) throw new Error('credentialCopyCheck must be local|off');
  for (const [provider, value] of Object.entries(sharing.providers || {})) {
    if (!PROVIDERS[provider]) throw new Error(`Sharing provider ${provider}: not yet supported`);
    for (const item of [value, ...Object.values(value.accounts || {})]) {
      for (const key of ['instructions', 'skills']) if (item[key] !== undefined && typeof item[key] !== 'boolean') throw new Error(`${provider}.${key} must be boolean`);
    }
    for (const [home, account] of Object.entries(value.accounts || {})) {
      if (!path.isAbsolute(home)) throw new Error('Account paths must be absolute');
      if (provider === 'opencode') throw new Error('OpenCode multi-account setup is not yet supported');
      if (account.create && !slugValid(account.name)) throw new Error('New account names must be short words matching [a-z][a-z0-9-]*');
    }
  }
  return sharing;
}
async function resolveSharingPreferences({ saved, options = {}, discovery }) {
  const { sharing: mode, sharingConfig, codexSelfHeal, credentialCopyCheck } = options;
  if (mode !== undefined && !['all', 'custom', 'none'].includes(mode)) throw new Error('--sharing must be all|custom|none');
  if (codexSelfHeal !== undefined && !['on', 'off'].includes(codexSelfHeal)) throw new Error('--codex-self-heal must be on|off');
  if (credentialCopyCheck !== undefined && !['local', 'off'].includes(credentialCopyCheck)) throw new Error('--credential-copy-check must be local|off');
  if (sharingConfig !== undefined && mode !== 'custom') throw new Error('--sharing-config requires --sharing custom');
  if (mode === 'none' && (codexSelfHeal === 'on' || credentialCopyCheck === 'local')) throw new Error('--sharing none contradicts enabled health options');
  let next = saved ? structuredClone(saved) : undefined;
  if (mode === 'custom') {
    if (sharingConfig === undefined && options.yes) throw new Error('Unattended custom sharing requires --sharing-config <json>');
    if (sharingConfig !== undefined) {
      let supplied;
      try { supplied = typeof sharingConfig === 'string' ? JSON.parse(sharingConfig) : structuredClone(sharingConfig); } catch { throw new Error('Invalid --sharing-config JSON'); }
      if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied)) throw new Error('Invalid --sharing-config JSON object');
      next = { ...next, ...supplied, schemaVersion: 1, mode: 'custom', offered: true };
    } else next = { schemaVersion: 1, mode: 'custom', offered: true, providers: {} };
  } else if (mode === 'all') {
    next = { ...next, schemaVersion: 1, mode, offered: true, providers: {} };
    for (const home of discovery.homes) {
      const provider = next.providers[home.provider] ||= { instructions: true, skills: true, accounts: {} };
      if (!home.main) provider.accounts[home.path] = { ...(saved?.providers?.[home.provider]?.accounts?.[home.path] || {}), instructions: true, skills: true };
    }
  } else if (mode === 'none') {
    next = { ...next, schemaVersion: 1, mode, offered: true, providers: {}, codexSelfHeal: false, credentialCopyCheck: 'off' };
  }
  if (codexSelfHeal !== undefined || credentialCopyCheck !== undefined) next ||= { schemaVersion: 1, mode: 'none', offered: true, providers: {} };
  if (next) {
    if (codexSelfHeal !== undefined) next.codexSelfHeal = codexSelfHeal === 'on';
    if (credentialCopyCheck !== undefined) next.credentialCopyCheck = credentialCopyCheck;
    next.adoptedPersonalItems ||= [];
    validatePreferences(next);
  }
  return next;
}
function choiceFor(sharing, home) {
  if (!sharing || sharing.mode === 'none') return {};
  const provider = sharing.providers?.[home.provider];
  return home.main ? provider || {} : provider?.accounts?.[home.path] || {};
}
async function personalCandidates({ homeDir, discovery, managedPaths = [] }) {
  const items = [];
  for (const home of discovery.homes.filter(home => home.main && !home.shadow)) {
    const file = path.join(home.path, PROVIDERS[home.provider].instructions);
    if ((await snapshot(file)).type === 'file') {
      for (const section of sections(await fs.readFile(file, 'utf8'))) {
        if (section.text.includes(RETIRED)) continue;
        items.push({ kind: 'section', path: file, provider: home.provider, heading: section.heading, lines: section.lines, hash: section.hash });
      }
    }
  }
  const roots = [path.join(homeDir, '.claude', 'skills'), path.join(homeDir, '.agents', 'skills'), path.join(homeDir, '.codex', 'skills'), path.join(homeDir, '.grok', 'skills')];
  for (const root of roots) {
    if (discovery.homes.some(home => home.shadow && [home.path, home.realPath].some(shadow => shadow && root.startsWith(shadow + path.sep)))) continue;
    if (!await safeParents(path.join(root, '_probe'))) continue;
    for (const name of await fs.readdir(root).catch(() => [])) {
      if (name.startsWith('.')) continue;
      const full = path.join(root, name);
      if ((await snapshot(full)).type !== 'directory' || !await fs.pathExists(path.join(full, 'SKILL.md'))) continue;
      if (managedPaths.some(managed => managed === full || managed.startsWith(full + path.sep))) continue;
      // Plugin bundles stay with their lifecycle, including linked plugin bundles.
      if (await fs.pathExists(path.join(full, '.claude-plugin')) || await fs.pathExists(path.join(full, 'plugin.json'))) continue;
      items.push({ kind: 'skill', path: full, name, fingerprint: await snapshot(full) });
    }
  }
  return items;
}


function protectCodeRestores(plan, discovery) {
  const roots = discovery.homes.filter(home => home.shadow).flatMap(home => [home.path, home.realPath]).filter(Boolean);
  plan.operations = plan.operations.filter(record => {
    const blocked = discovery.codeHomes.status === 'unreadable' || roots.some(root => record.path === root || record.path.startsWith(root + path.sep));
    if (blocked) plan.pending.push(`${record.path}: Arcwright Code shadow or unknown ownership; restore pending`);
    return !blocked;
  });
  return plan;
}

async function buildSharingPlan({ homeDir, sharing, discovery, rules = '## Arcwright\n\nArcwright is installed in ~/.arcwright/.', personalApprovals = [], unattended = false, platform = process.platform }) {
  if (sharing) validatePreferences(sharing);
  const state = await readState(homeDir);
  const plan = { homeDir, state, operations: [], pending: [], notices: [...discovery.unsupported] };
  if (platform === 'win32') return plan;
  if (!sharing) return plan;
  if (sharing.mode === 'none') return { ...protectCodeRestores(await planRestore({ homeDir, state }), discovery), notices: plan.notices };
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`;
  const runDir = path.join(homeDir, '.arcwright', 'backups', 'sharing', runId);
  const canonical = path.join(homeDir, '.arcwright', 'AGENTS.md');
  const store = path.join(homeDir, '.arcwright', 'skills');
  const planned = new Map();
  const shadowRoots = discovery.homes.filter(home => home.shadow).flatMap(home => [home.path, home.realPath]).filter(Boolean);
  async function add(operation) {
    if (shadowRoots.some(root => operation.path === root || operation.path.startsWith(root + path.sep))) { plan.pending.push(`${operation.path}: Arcwright Code owns this shadow; no writes`); return; }
    if (planned.has(operation.path)) {
      const existing = planned.get(operation.path);
      if (existing.action === 'write' && operation.action === 'write') existing.content = operation.content;
      return;
    }
    if (!await safeParents(operation.path)) { plan.pending.push(`${operation.path}: unsafe parent; left unchanged`); return; }
    const before = await snapshot(operation.path);
    if (operation.action === 'link' && before.type === 'link' && path.resolve(path.dirname(operation.path), before.target) === operation.target) return;
    if (operation.action === 'write' && before.type === 'file' && before.hash === crypto.createHash('sha256').update(operation.content).digest('hex')) return;
    if (operation.action === 'mkdir' && before.type === 'directory') return;
    if (operation.action === 'remove' && before.type === 'absent') return;
    const index = plan.operations.length;
    const op = { ...operation, before, backup: path.join(runDir, `${index}.preimage`), record: path.join(runDir, `${index}.json`) };
    plan.operations.push(op); planned.set(op.path, op);
  }
  async function link(file, target, allowManaged = false, allowAdopt = false) {
    if (planned.has(file)) return;
    if (!await safeParents(target)) { plan.pending.push(`${file}: shared target has an unsafe parent`); return; }
    const before = await snapshot(file);
    if (before.type === 'link' && path.resolve(path.dirname(file), before.target) === target) return;
    const owned = state.operations.some(record => record.path === file && !record.restored && equal(record.applied, before));
    if (before.type !== 'absent' && !owned && !allowAdopt && !(allowManaged && before.type === 'file' && !personalText(await fs.readFile(file, 'utf8')))) {
      plan.pending.push(`${file}: existing personal content or foreign link; left unchanged`); return;
    }
    await add({ action: 'link', path: file, target, requires: [target] });
  }
  const enrolled = discovery.homes.filter(home => {
    const choice = choiceFor(sharing, home);
    return choice.instructions || choice.skills;
  });
  for (const [provider, selection] of Object.entries(sharing.providers || {})) {
    for (const [home, choice] of Object.entries(selection.accounts || {})) {
      if (!discovery.homes.some(item => item.provider === provider && item.path === home)) plan.pending.push(`${home}: enrolled home not found; no writes`);
      if (choice.create && home !== path.join(homeDir, `${PROVIDERS[provider].dir}-${choice.name}`)) throw new Error('New account home must match its provider and name');
    }
  }
  const blockedShared = new Set();
  for (const home of discovery.homes.filter(home => home.shadow)) {
    const shared = discovery.homes.find(item => (item.path === home.sharedHome || item.realPath === home.sharedRealPath) && item.provider === home.provider && !item.shadow);
    const left = choiceFor(sharing, home), right = shared ? choiceFor(sharing, shared) : {};
    if (left.instructions || left.skills || right.instructions || right.skills) {
      plan.notices.push(`${home.path}: Arcwright Code owns this shadow; inherits from ${home.sharedHome}. No shadow writes.`);
      if (!!left.instructions !== !!right.instructions || !!left.skills !== !!right.skills) {
        plan.pending.push(`${home.path}: shadow choices require matching shared-home enrollment`);
        if (shared) blockedShared.add(shared.path);
      }
    }
  }
  const active = enrolled.filter(home => {
    if (home.shadow) return false;
    if (blockedShared.has(home.path)) { plan.pending.push(`${home.path}: shared-home writes blocked by shadow selection dependency`); return false; }
    if (home.ownershipUnknown || discovery.codeHomes.status === 'unreadable') { plan.pending.push(`${home.path}: Arcwright Code ownership unreadable; no writes`); return false; }
    return true;
  });
  let canonicalText = (await snapshot(canonical)).type === 'file' ? await fs.readFile(canonical, 'utf8') : '';
  const canonicalType = (await snapshot(canonical)).type;
  if (!['file', 'absent'].includes(canonicalType)) plan.pending.push(`${canonical}: canonical file must be a real file`);
  let sharedText = canonicalText;
  const block = `${START}\n${rules}\n${END}`;
  if (active.some(home => choiceFor(sharing, home).instructions)) {
    sharedText = canonicalText.includes(START) && canonicalText.includes(END)
      ? canonicalText.replace(new RegExp(`${START}[\\s\\S]*?${END}`), block)
      : `${canonicalText}${canonicalText ? '\n\n' : ''}${block}\n`;
  }
  const adoptedFiles = new Set();
  const adoptedSections = new Map();
  const adoptedSkills = [];
  if (!unattended) for (const approval of personalApprovals) {
    if (approval.kind === 'section') {
      if (!active.some(home => choiceFor(sharing, home).instructions && approval.path === path.join(home.path, PROVIDERS[home.provider].instructions))) continue;
      if (!await safeParents(approval.path) || (await snapshot(approval.path)).type !== 'file') continue;
      const text = await fs.readFile(approval.path, 'utf8');
      const selected = sections(text).find(section => section.hash === approval.hash);
      if (!selected) { plan.pending.push(`${approval.path}: section changed since review`); continue; }
      if (!sharedText.includes(selected.text)) sharedText += `\n${selected.text}\n`;
      adoptedFiles.add(approval.path);
      if (!adoptedSections.has(approval.path)) adoptedSections.set(approval.path, []);
      adoptedSections.get(approval.path).push(selected.text);
    } else if (approval.kind === 'skill') {
      if ([...blockedShared].some(root => approval.path.startsWith(root + path.sep))) { plan.pending.push(`${approval.path}: source sharing group is pending; bundle retained`); continue; }
      if (!active.some(home => choiceFor(sharing, home).skills)) continue;
      if (!/^[a-z][a-z0-9-]*$/.test(approval.name) || !await safeParents(approval.path)) continue;
      if (!equal(await snapshot(approval.path), approval.fingerprint)) { plan.pending.push(`${approval.path}: bundle changed since review`); continue; }
      const target = path.join(store, approval.name);
      const conflicts = [];
      for (const root of [path.join(homeDir, '.claude', 'skills'), path.join(homeDir, '.agents', 'skills'), path.join(homeDir, '.codex', 'skills'), path.join(homeDir, '.grok', 'skills')]) {
        const candidate = path.join(root, approval.name);
        const snap = await snapshot(candidate);
        if (candidate !== approval.path && snap.type !== 'absent' && !(snap.type === 'link' && path.resolve(path.dirname(candidate), snap.target) === target)) conflicts.push(candidate);
      }
      if ((await snapshot(target)).type !== 'absent' || conflicts.length) { plan.pending.push(`${approval.path}: same-name bundle exists; left unchanged`); continue; }
      // Never adopt trees containing redirects or plugin metadata.
      async function portable(dir) {
        for (const item of await fs.readdir(dir, { withFileTypes: true })) {
          if (item.isSymbolicLink() || ['.claude-plugin', 'plugin.json'].includes(item.name)) return false;
          if (item.isDirectory() && !await portable(path.join(dir, item.name))) return false;
        }
        return true;
      }
      if (!await portable(approval.path)) { plan.pending.push(`${approval.path}: plugin or linked content stays local`); continue; }
      await add({ action: 'adopt', path: target, source: approval.path, sourceBefore: approval.fingerprint, canonical: true });
      await link(approval.path, target, false, true);
      adoptedSkills.push(approval.name);
    }
  }
  // A host becomes a link only when every remaining personal section was approved.
  const approvedHosts = new Set();
  for (const file of adoptedFiles) {
    const all = sections(await fs.readFile(file, 'utf8'));
    if (all.every(section => personalApprovals.some(approval => approval.path === file && approval.hash === section.hash))) approvedHosts.add(file);
    else if (!active.some(home => home.provider === 'claude' && home.main && file === path.join(home.path, PROVIDERS.claude.instructions) && !sharedText.includes(RETIRED))) {
      plan.pending.push(`${file}: remaining personal sections prevent a shared host link; reviewed sections copied to canonical, original host retained`);
    }
  }
  if (sharedText !== canonicalText && ['file', 'absent'].includes(canonicalType)) await add({ action: 'write', path: canonical, content: sharedText, canonical: true });
  const personalNames = new Set([...adoptedSkills, ...await fs.readdir(store).catch(() => [])]);
  for (const home of active) {
    const spec = PROVIDERS[home.provider], choice = choiceFor(sharing, home);
    const mainHome = path.join(homeDir, spec.dir);
    const accountPreference = sharing.providers?.[home.provider]?.accounts?.[home.path];
    if (home.exists && accountPreference?.create && !state.operations.some(record => record.path === home.path && record.action === 'mkdir' && !record.restored)) {
      plan.pending.push(`${home.path}: new account name collides with an existing unowned home`);
      continue;
    }
    if (!home.exists) await add({ action: 'mkdir', path: home.path });
    const providerChoice = sharing.providers?.[home.provider] || {};
    if (!home.main && ((choice.instructions && !providerChoice.instructions) || (choice.skills && !providerChoice.skills))) {
      plan.pending.push(`${home.path}: selected account items require the same items in its provider main home`);
      continue;
    }
    if (choice.skills && !home.main) {
      const skillsRoot = path.join(mainHome, 'skills');
      const current = await snapshot(skillsRoot);
      if (current.type === 'absent') await add({ action: 'mkdir', path: skillsRoot });
      else if (current.type !== 'directory') plan.pending.push(`${skillsRoot}: main skills root must be a real directory`);
    }
    if (choice.instructions && ['file', 'absent'].includes(canonicalType) && await safeParents(canonical)) {
      const file = path.join(home.path, spec.instructions);
      if (home.provider === 'codex' && await fs.pathExists(path.join(home.path, 'AGENTS.override.md'))) plan.notices.push(`${home.path}/AGENTS.override.md takes precedence over shared AGENTS.md`);
      if (home.provider === 'claude' && home.main) {
        if (sharedText.includes(RETIRED)) {
          plan.notices.push(`${file}: Claude imports retired; no new import`);
          if ((await snapshot(file)).type === 'file') {
            const text = await fs.readFile(file, 'utf8');
            const remaining = text.replace(/<!-- arcwright-(?:agent|instructions|orchestration|proactive|tmux)-start -->[\s\S]*?<!-- arcwright-(?:agent|instructions|orchestration|proactive|tmux)-end -->/g, '');
            if (remaining !== text) await add(remaining.trim() ? { action: 'write', path: file, content: remaining } : { action: 'remove', path: file });
          }
        } else if ((await snapshot(file)).type === 'absent' || (await snapshot(file)).type === 'file') {
          let text = planned.get(file)?.content ?? await fs.readFile(file, 'utf8').catch(() => '');
          if (approvedHosts.has(file)) text = '';
          else if (adoptedSections.has(file)) text = removePersonalSections(text, adoptedSections.get(file));
          text = text.replace(/<!-- arcwright-(?:agent|instructions)-start -->[\s\S]*?<!-- arcwright-(?:agent|instructions)-end -->/g, '');
          const relative = path.relative(home.path, canonical).replace(/ /g, '\\ ');
          await add({ action: 'write', path: file, requires: [canonical], content: `${text.trimEnd()}${text.trim() ? '\n\n' : ''}<!-- arcwright-instructions-start -->\n@${relative}\n<!-- arcwright-instructions-end -->\n` });
        } else plan.pending.push(`${file}: foreign link; left unchanged`);
      } else {
        const target = home.main ? canonical : path.join(mainHome, spec.instructions);
        if (!home.main && plan.pending.some(reason => reason.startsWith(`${target}:`))) plan.pending.push(`${file}: main instructions sharing is pending`);
        else await link(file, target, true, approvedHosts.has(file));
      }
    }
    if (choice.skills && !home.main) {
      const target = path.join(mainHome, 'skills');
      if (['directory', 'absent'].includes((await snapshot(target)).type)) await link(path.join(home.path, 'skills'), target);
      else plan.pending.push(`${home.path}/skills: main skills root is not a real directory`);
    }
    if (choice.skills) {
      const root = path.join(homeDir, home.provider === 'claude' ? '.claude' : '.agents', 'skills');
      for (const name of personalNames) {
        const target = path.join(store, name);
        if (adoptedSkills.includes(name) || (await snapshot(target)).type === 'directory') await link(path.join(root, name), target);
      }
    }
    const launcherName = accountPreference?.name || home.label;
    if (!home.main && spec.command && slugValid(launcherName)) {
      const file = path.join(homeDir, '.local', 'bin', `${spec.command}-${launcherName}`);
      const current = await snapshot(file);
      const owned = state.operations.some(record => record.path === file && !record.restored && equal(record.applied, current));
      if (current.type !== 'absent' && !owned) plan.pending.push(`${file}: foreign launcher; left unchanged`);
      else await add({ action: 'write', path: file, content: launcherContent(home.provider, home.path), mode: 0o700 });
    }
  }
  if (active.some(home => choiceFor(sharing, home).skills && home.provider !== 'claude')) plan.notices.push(`Codex, Grok and OpenCode discover ~/.agents/skills together. Provider exclusions do not isolate that shared loader. Affected homes: ${discovery.homes.filter(home => ['codex', 'grok', 'opencode'].includes(home.provider)).map(home => home.path).join(', ')}`);
  // Partial selection changes detach only previous owned operations no longer desired.
  const keepPaths = new Set(plan.operations.map(op => op.path));
  const adoptedSources = new Map(state.operations.filter(record => record.action === 'adopt' && record.canonical).map(record => [record.source, record.path]));
  for (const record of state.operations) {
    if (record.canonical) continue;
    if ([...blockedShared].some(root => record.path === root || record.path.startsWith(root + path.sep))) keepPaths.add(record.path);
    if (active.some(home => {
      const choice = choiceFor(sharing, home), spec = PROVIDERS[home.provider];
      return record.path === home.path || (choice.instructions && record.path === path.join(home.path, spec.instructions))
        || (choice.skills && (record.path === path.join(home.path, 'skills') || record.path.startsWith(path.join(homeDir, home.provider === 'claude' ? '.claude' : '.agents', 'skills') + path.sep)
          || (record.action === 'link' && adoptedSources.get(record.path) === record.target && path.dirname(record.path) === path.join(home.path, 'skills'))))
        || (!home.main && record.path === path.join(homeDir, '.local', 'bin', `${spec.command}-${sharing.providers?.[home.provider]?.accounts?.[home.path]?.name || home.label}`));
    })) keepPaths.add(record.path);
  }
  plan.detach = protectCodeRestores(await planRestore({ homeDir, state, keepPaths }), discovery);
  return plan;
}
function formatSharingPlan(plan) {
  return [
    ...plan.operations.map(op => plan.restore ? `Restore ${op.path} from ${op.backup || 'absent preimage'}` : `${op.action} ${op.path}${op.target ? ` -> ${op.target}` : ''}; backup ${op.before.type === 'absent' ? '(new object)' : op.backup}; record ${op.record}`),
    ...(plan.detach?.operations || []).map(op => `Restore excluded ${op.path} from ${op.backup || 'absent preimage'}`),
    ...(plan.notices || []).map(line => `Notice: ${line}`),
    ...[...plan.pending, ...(plan.detach?.pending || [])].map(line => `Pending: ${line}`),
  ];
}
async function applyGlobalSharing(plan, options = {}) {
  if (plan.restore) return restoreSharing(plan, options);
  // Rebuild after detach because restoration updates receipts.
  if (!options.dryRun && plan.detach?.operations.length) {
    const detached = await restoreSharing(plan.detach);
    plan.pending.push(...detached.pending);
    plan.state = await readState(plan.homeDir);
  }
  return applySharingPlan(plan, options);
}
module.exports = { resolveSharingPreferences, validatePreferences, choiceFor, personalCandidates, buildSharingPlan, formatSharingPlan, applyGlobalSharing, sections, personalText, protectCodeRestores };
