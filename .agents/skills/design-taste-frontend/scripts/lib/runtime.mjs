// Arcwright adapter: installed skills are read-only. Working files belong to
// the active project's Arcwright memory, including history and browser profiles.
import { existsSync, lstatSync, mkdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, parse, relative, resolve, sep } from 'node:path';

const within = (parent, child) => {
  const rel = relative(parent, child);
  return !rel || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
};

function skillDirectory(directory) {
  const parts = directory.split(sep).map(part => part.toLowerCase());
  const hosts = new Set(['.agents', '.agent', '.claude', '.codex', '.kiro', '.hermes', '.grok', '.opencode']);
  if (parts.some((part, i) => part === 'skills' && hosts.has(parts[i - 1]))
    || parts.some((part, i) => part === 'skills' && parts[i - 1] === '_memory' && parts[i - 2] === '_arcwright')) return true;
  for (let current = directory; ; current = dirname(current)) {
    if (existsSync(join(current, 'SKILL.md'))) return true;
    if (dirname(current) === current) return false;
  }
}

function noSymlinks(filename) {
  let current = parse(filename).root;
  for (const part of relative(current, filename).split(sep).filter(Boolean)) {
    current = join(current, part);
    try {
      if (lstatSync(current).isSymbolicLink()) throw new Error(`Refusing symlinked Taste output: ${current}`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

// An explicit exception for host-allocated, retention-managed screenshot storage.
// This does not relax the project boundary for --out, --to, or history.
export function evidenceDirectory(filename) {
  if (typeof filename !== 'string' || !isAbsolute(filename) || skillDirectory(resolve(filename))) {
    throw new Error('--evidence-dir needs an absolute host evidence directory outside installed skills.');
  }
  filename = resolve(filename);
  noSymlinks(filename);
  if (!statSync(filename).isDirectory()) throw new Error('--evidence-dir must already be a directory.');
  return filename;
}

export function runtimePaths(argv) {
  // Consume this option before upstream's own argument parsers run.
  let explicit;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] !== '--project-root' && !argv[i].startsWith('--project-root=')) continue;
    if (explicit !== undefined) throw new Error('Pass --project-root only once.');
    const equals = argv[i].indexOf('=');
    explicit = equals < 0 ? argv[i + 1] : argv[i].slice(equals + 1);
    if (!explicit || explicit.startsWith('--')) throw new Error('--project-root needs a directory.');
    argv.splice(i, equals < 0 ? 2 : 1);
    i--;
  }
  let cached;
  const project = () => {
    if (cached) return cached;
    const root = realpathSync(resolve(explicit || process.cwd()));
    if (!statSync(root).isDirectory() || skillDirectory(root)) {
      throw new Error('Taste needs an active project root, never an installed skill directory.');
    }
    if (!explicit && !['.git', '_arcwright'].some(marker => existsSync(join(root, marker)))) {
      throw new Error('Run from the project root or pass --project-root <project>.');
    }
    cached = root;
    return root;
  };
  const output = filename => {
    if (typeof filename !== 'string' || !filename) throw new Error('Taste output needs a path.');
    const root = project();
    const runs = join(root, '_arcwright', '_memory', 'skill-runs');
    const full = resolve(root, filename);
    if (full === runs || !within(runs, full) || skillDirectory(full)) {
      throw new Error('Taste working output must stay under the project _arcwright/_memory/skill-runs directory.');
    }
    noSymlinks(full);
    return full;
  };
  return {
    get projectRoot() { return project(); },
    get runDir() {
      const run = process.env.TASTE_SKILL_RUN || 'default';
      if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(run)) throw new Error('TASTE_SKILL_RUN must be a simple run name.');
      return output(join('_arcwright', '_memory', 'skill-runs', `taste-${run}`));
    },
    output,
    directory(filename) {
      const full = output(filename);
      mkdirSync(full, { recursive: true });
      return full;
    },
  };
}
