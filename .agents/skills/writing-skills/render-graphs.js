#!/usr/bin/env node

/**
 * Render graphviz diagrams from a skill's SKILL.md to SVG files.
 *
 * Usage:
 *   node render-graphs.js <skill-directory> --project-root <project>
 *   node render-graphs.js <skill-directory> --project-root <project> --combine
 *   --output-dir may select a directory under the project Arcwright skill-runs area.
 *
 * Extracts all ```dot blocks from SKILL.md and renders to SVG.
 * Useful for helping your human partner visualize the process flows.
 *
 * Requires: graphviz (dot) installed on system
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function extractDotBlocks(markdown) {
  const blocks = [];
  const regex = /```dot\r?\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(markdown)) !== null) {
    const content = match[1].trim();

    // Extract digraph name
    const nameMatch = content.match(/digraph\s+(\w+)/);
    const name = nameMatch ? nameMatch[1] : `graph_${blocks.length + 1}`;

    blocks.push({ name, content });
  }

  return blocks;
}

function extractGraphBody(dotContent) {
  // Extract just the body (nodes and edges) from a digraph
  const match = dotContent.match(/digraph\s+\w+\s*\{([\s\S]*)\}/);
  if (!match) return '';

  let body = match[1];

  // Remove rankdir (we'll set it once at the top level)
  body = body.replace(/^\s*rankdir\s*=\s*\w+\s*;?\s*$/gm, '');

  return body.trim();
}

function combineGraphs(blocks, skillName) {
  const bodies = blocks.map((block, i) => {
    const body = extractGraphBody(block.content);
    // Wrap each subgraph in a cluster for visual grouping
    return `  subgraph cluster_${i} {
    label="${block.name}";
    ${body.split('\n').map(line => '  ' + line).join('\n')}
  }`;
  });

  return `digraph ${skillName}_combined {
  rankdir=TB;
  compound=true;
  newrank=true;

${bodies.join('\n\n')}
}`;
}

function renderToSvg(dotContent) {
  try {
    return execFileSync('dot', ['-Tsvg'], {
      input: dotContent,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
  } catch (err) {
    console.error('Error running dot:', err.message);
    if (err.stderr) console.error(err.stderr.toString());
    return null;
  }
}

const RUNS_PATH = path.join('_arcwright', '_memory', 'skill-runs');

function within(parent, child) {
  const rel = path.relative(parent, child);
  return !rel || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
}

function installedSkillPath(directory) {
  const parts = directory.split(path.sep).map(part => part.toLowerCase());
  const hosts = new Set(['.agents', '.agent', '.claude', '.codex', '.kiro', '.hermes', '.grok', '.opencode']);
  if (parts.some((part, i) => part === 'skills' && hosts.has(parts[i - 1]))
    || parts.some((part, i) => part === 'skills' && parts[i - 1] === '_memory' && parts[i - 2] === '_arcwright')) return true;
  for (let current = directory; ; current = path.dirname(current)) {
    if (fs.existsSync(path.join(current, 'SKILL.md'))) return true;
    if (path.dirname(current) === current) return false;
  }
}

function projectRoot(explicit, skillDir) {
  const working = fs.realpathSync(process.cwd());
  if (!explicit && (installedSkillPath(working) || within(skillDir, working))) {
    throw new Error('Run from the active project or pass --project-root; a skill installation is read-only.');
  }
  let root = explicit ? path.resolve(explicit) : working;
  if (!explicit && !fs.existsSync(path.join(root, '_arcwright')) && !fs.existsSync(path.join(root, '.git'))) {
    throw new Error('Pass --project-root for a new project or when running outside its root. Parent directories are not inferred.');
  }
  root = fs.realpathSync(root);
  if (!fs.statSync(root).isDirectory() || installedSkillPath(root) || within(skillDir, root)) {
    throw new Error('--project-root must be an application project, outside the read-only skill installation.');
  }
  return root;
}

function ensureDirectory(root, directory) {
  if (!within(root, directory)) throw new Error('Output escapes the active project.');
  let current = root;
  for (const part of path.relative(root, directory).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try { fs.mkdirSync(current); } catch (err) { if (err.code !== 'EEXIST') throw err; }
    const stat = fs.lstatSync(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error(`Refusing symlink or non-directory in output path: ${current}`);
    }
  }
}

function outputDirectory(root, requested) {
  const base = path.join(root, RUNS_PATH);
  const selected = requested ? path.resolve(root, requested) : null;
  if (selected && !within(base, selected)) {
    throw new Error(`--output-dir must be inside ${base}; skill directories are read-only.`);
  }
  ensureDirectory(root, selected || base);
  if (selected) return selected;
  const run = fs.mkdtempSync(path.join(base, 'writing-skills-'));
  const diagrams = path.join(run, 'diagrams');
  fs.mkdirSync(diagrams);
  return diagrams;
}

function writeArtifact(directory, filename, content) {
  const destination = path.join(directory, filename);
  // Exclusive creation also refuses existing symlinks instead of following them.
  fs.writeFileSync(destination, content, { encoding: 'utf8', flag: 'wx' });
}

function main() {
  const args = process.argv.slice(2);
  let combine = false;
  let skillDirArg;
  let explicitRoot;
  let requestedOutput;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--combine') combine = true;
    else if (arg === '--project-root' || arg === '--output-dir') {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      if (arg === '--project-root') explicitRoot = value;
      else requestedOutput = value;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: node render-graphs.js <skill-directory> [--project-root <project>] [--output-dir <Arcwright-run-directory>] [--combine]');
      return;
    } else if (arg.startsWith('-') || skillDirArg) throw new Error(`Unexpected argument: ${arg}`);
    else skillDirArg = arg;
  }
  if (!skillDirArg) throw new Error('Usage: node render-graphs.js <skill-directory> [--project-root <project>] [--output-dir <Arcwright-run-directory>] [--combine]');

  const skillDir = fs.realpathSync(path.resolve(skillDirArg));
  const skillFile = path.join(skillDir, 'SKILL.md');
  const skillName = path.basename(skillDir)
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/^([0-9])/, '_$1');
  const root = projectRoot(explicitRoot, skillDir);
  if (!fs.existsSync(skillFile)) throw new Error(`Error: ${skillFile} not found`);
  // Validate overrides even when there are no graphs to render.
  if (requestedOutput && !within(path.join(root, RUNS_PATH), path.resolve(root, requestedOutput))) {
    throw new Error(`--output-dir must be inside ${path.join(root, RUNS_PATH)}.`);
  }

  // Probe the binary directly; native Windows shells do not provide `which`.
  try {
    execFileSync('dot', ['-V'], { stdio: 'ignore' });
  } catch {
    console.error('Error: graphviz (dot) not found. Install with:');
    console.error('  brew install graphviz    # macOS');
    console.error('  apt install graphviz     # Linux');
    process.exit(1);
  }

  const markdown = fs.readFileSync(skillFile, 'utf-8');
  const blocks = extractDotBlocks(markdown);

  if (blocks.length === 0) {
    console.log('No ```dot blocks found in', skillFile);
    process.exit(0);
  }

  console.log(`Found ${blocks.length} diagram(s) in ${path.basename(skillDir)}/SKILL.md`);

  const outputDir = outputDirectory(root, requestedOutput);

  let failed = false;
  if (combine) {
    // Combine all graphs into one
    const combined = combineGraphs(blocks, skillName);
    const svg = renderToSvg(combined);
    if (svg) {
      const outputPath = path.join(outputDir, `${skillName}_combined.svg`);
      writeArtifact(outputDir, path.basename(outputPath), svg);
      console.log(`  Rendered: ${skillName}_combined.svg`);

      // Also write the dot source for debugging
      const dotPath = path.join(outputDir, `${skillName}_combined.dot`);
      writeArtifact(outputDir, path.basename(dotPath), combined);
      console.log(`  Source: ${skillName}_combined.dot`);
    } else {
      console.error('  Failed to render combined diagram');
      failed = true;
    }
  } else {
    // Render each separately
    for (const block of blocks) {
      const svg = renderToSvg(block.content);
      if (svg) {
        const outputPath = path.join(outputDir, `${block.name}.svg`);
        writeArtifact(outputDir, path.basename(outputPath), svg);
        console.log(`  Rendered: ${block.name}.svg`);
      } else {
        console.error(`  Failed: ${block.name}`);
        failed = true;
      }
    }
  }

  console.log(`\nOutput: ${outputDir}/`);
  if (failed) process.exitCode = 1;
}

try { main(); } catch (err) {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
}
