'use strict';

// Package Arcwright's locally maintained derivatives. SOURCE.json records their
// origin, not a build dependency: no upstream checkout or Git process is needed.
const fs = require('node:fs');
const path = require('node:path');
const SOURCE = '.agents/skills/matt-pocock';

function safePath(root, relative) {
  const full = path.resolve(root, relative);
  const rel = path.relative(root, full);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error(`Unsafe skill-pack path: ${relative}`);
  }
  let current = root;
  for (const segment of rel.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Refusing symlinked build input: ${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return full;
}

function read(root, relative) {
  return fs.readFileSync(safePath(root, relative));
}

function createPack(projectRoot) {
  projectRoot = fs.realpathSync(projectRoot);
  const source = JSON.parse(read(projectRoot, `${SOURCE}/SOURCE.json`));
  if (!Array.isArray(source.skills) || !source.skills.length) throw new Error('Local skill pack has no catalog.');
  const names = ['matt-pocock', ...source.skills.map(entry => entry.installedName)];
  if (new Set(names).size !== names.length || names.some(name => !/^matt-pocock(?:-[a-z0-9]+)*$/.test(name))) {
    throw new Error('Invalid or duplicate local skill-pack name.');
  }
  const directories = fs.readdirSync(safePath(projectRoot, '.agents/skills')).filter(name => /^matt-pocock(?:-|$)/.test(name));
  if (directories.some(name => !names.includes(name))) throw new Error('Local skill is missing from the skill-pack catalog.');

  const output = new Map();
  const collect = relative => {
    const full = safePath(projectRoot, relative);
    if (fs.statSync(full).isDirectory()) {
      for (const entry of fs.readdirSync(full).sort()) {
        // Retired importer state and runtime caches are never pack source.
        if (entry === '.local-install.json' || entry === '.git' || entry === '__pycache__' || /\.py[co]$/.test(entry)) continue;
        collect(`${relative}/${entry}`);
      }
    } else {
      output.set(relative, fs.readFileSync(full));
    }
  };
  for (const name of names) {
    const base = `.agents/skills/${name}`;
    const skill = read(projectRoot, `${base}/SKILL.md`).toString('utf8');
    if (!new RegExp(`^name: ${name}\\r?$`, 'm').test(skill)) throw new Error(`Local skill name does not match directory: ${name}`);
    read(projectRoot, `${base}/LICENSE`);
    collect(base);
    const command = `.claude/commands/${name}.md`;
    output.set(command, fs.existsSync(safePath(projectRoot, command)) ? read(projectRoot, command) : Buffer.from(
      `---\ndescription: Run the ${name} skill.\n---\n\nLoad and run the \`${name}\` skill (\`.agents/skills/${name}/SKILL.md\`) against $ARGUMENTS. Follow its Arcwright integration instructions.\n`));
    output.set(`.kiro/agents/${name}.json`, Buffer.from(JSON.stringify({
      name, description: `Run the ${name} skill.`,
      prompt: `Read skill://.kiro/skills/${name}/SKILL.md and follow its Arcwright integration instructions for the user's request.`,
      tools: ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'subagent', 'web_search', 'web_fetch'],
      includeMcpJson: true,
      resources: [`skill://.kiro/skills/${name}/SKILL.md`],
    }, null, 2) + '\n'));
  }
  return { output, revision: source.revision, count: source.skills.length };
}

function writePack(pack, destination, { local = false } = {}) {
  // Local maintenance may add command wrappers. Skills are already canonical
  // source and must never be replaced by an importer or an old install manifest.
  const outputs = [...pack.output].filter(([rel]) => !local || rel.startsWith('.claude/commands/'));
  for (const [rel, bytes] of outputs) {
    const dest = safePath(destination, rel);
    if (fs.existsSync(dest) && !fs.readFileSync(dest).equals(bytes)) {
      throw new Error(`Refusing to overwrite existing skill-pack file: ${rel}`);
    }
  }
  for (const [rel, bytes] of outputs) {
    const dest = safePath(destination, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, bytes);
    if (rel.endsWith('.sh')) fs.chmodSync(dest, 0o755);
  }
}

module.exports = { createPack, writePack, SOURCE };

if (require.main === module) {
  if (process.argv.slice(2).join(' ') !== '--local') throw new Error('Usage: node build/matt-pocock.js --local');
  const root = path.resolve(__dirname, '..');
  const pack = createPack(root);
  writePack(pack, root, { local: true });
  console.log(`Verified ${pack.count} local Arcwright skills + router and prepared command wrappers.`);
}
