'use strict';

// Shared by source audits, installed discovery, and the package installer.
// Keep this dependency-free so portable helpers need only Node.
const MODULES = {
  teams: { names: /^team(?:-|$)/, installed: /^team-/, flag: 'resolvedTeams', labels: ['team-*'] },
  docker: { names: /^(?:docker-check|docker-type-check)$/, installed: /^docker-type-check$/, flag: 'resolvedDockerCheck', labels: ['docker-type-check'] },
  dotnet: { names: /^dotnet(?:-|$)/, installed: /^dotnet-/, flag: 'resolvedDotnet', labels: ['dotnet-*'] },
  electron: { names: /^electron(?:-|$)/, installed: /^electron-/, flag: 'resolvedElectron', labels: ['electron-*'] },
  tauri: { names: /^tauri(?:-|$)/, installed: /^tauri-/, flag: 'resolvedTauri', labels: ['tauri-*'] },
  strands: { names: /^strands(?:-|$)/, installed: /^strands-/, flag: 'resolvedStrands', labels: ['strands-*'] },
  'matt-pocock': { names: /^matt-pocock(?:-|$)/, installed: /^matt-pocock(?:-|$)/, flag: 'resolvedMattPocock', labels: ['matt-pocock-*'] },
  'aws-infra': { names: /^(?:aws-infra|aws-serverless-cdk)$/, installed: /^aws-serverless-cdk$/, flag: 'resolvedAwsInfra', labels: ['aws-serverless-cdk'] },
  'unnamed-pm': { names: /^(?:unnamed-pm|unnamed-pm-sync|unnamed-dev-mcp)$/, installed: /^(?:unnamed-pm-sync|unnamed-dev-mcp)$/, flag: 'resolvedUnnamedPm', labels: ['unnamed-pm-sync', 'unnamed-dev-mcp'] },
};

const frontmatter = text => text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1] || '';
const body = text => text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)\s*/, '');
const skillName = text => frontmatter(text).match(/^name:\s*["']?([a-z0-9-]+)["']?\s*$/m)?.[1];

function description(text, fallback) {
  const lines = frontmatter(text).split(/\r?\n/);
  const index = lines.findIndex(line => /^description:/.test(line));
  if (index < 0) return fallback;
  let value = lines[index].slice('description:'.length).trim();
  if (/^[>|][-+]?$/.test(value)) {
    value = lines.slice(index + 1).join('\n').match(/^(?:[ \t]+[^\n]*(?:\n|$))*/)?.[0].replace(/\s+/g, ' ').trim() || '';
  } else if (value.startsWith('"')) {
    try { value = JSON.parse(value); } catch { value = value.replace(/^"|"$/g, ''); }
  } else value = value.replace(/^'|'$/g, '');
  return value || fallback;
}

const modelInvocable = (text, policy = '') => !/^disable-model-invocation:\s*true\s*(?:#.*)?$/m.test(frontmatter(text))
  && !/^\s*allow_implicit_invocation:\s*false\s*(?:#.*)?$/m.test(policy);
const gate = name => Object.keys(MODULES).find(id => MODULES[id].names.test(name)) || null;
const gateEnabled = (id, installedNames) => !id || Boolean(MODULES[id] && installedNames.some(name => MODULES[id].installed.test(name)));
const gateSelected = (id, flags) => !id || Boolean(MODULES[id] && flags[MODULES[id].flag]);
const filterCommandNames = (files, flags) => files.filter(file => gateSelected(gate(file.replace(/\.md$/, '')), flags));
const filterSkillFiles = (files, flags) => files.filter(file => {
  const relative = file.replace(/\\/g, '/');
  const command = relative.match(/^arcwright\/commands\/([^/]+)\.md$/);
  return gateSelected(gate(command ? command[1] : relative.split('/')[0]), flags);
});
const describeSkippedSkills = flags => Object.values(MODULES).filter(item => !flags[item.flag]).flatMap(item => item.labels);

module.exports = { frontmatter, body, skillName, description, modelInvocable, gate, gateEnabled,
  gateSelected, filterCommandNames, filterSkillFiles, describeSkippedSkills };
