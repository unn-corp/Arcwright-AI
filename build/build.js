#!/usr/bin/env node
/**
 * build/build.js
 *
 * Arcwright Workshop Build Script
 *
 * Builds the distributable agent-orchestration package from the local
 * workshop source files:
 *
 *   Generic package → packages/agent-orchestration/src/
 *     All _arcwright/{awb,awm,core,_memory} modules.
 *     All .agents/skills/ (SKILL.md already generic — no scrubbing needed).
 *     .claude/commands/arcwright-track-*.md (no transforms).
 *     docs/dev/tmux/ scripts.
 *
 *   Kiro assets → packages/agent-orchestration/src/.kiro/
 *     Skills copied 1:1 → .kiro/skills/
 *     Steering docs generated from agent/workflow manifests.
 *
 * Run: node build/build.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Paths ────────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ARCWRIGHT_SRC     = path.join(PROJECT_ROOT, '_arcwright');
const SKILLS_SRC   = path.join(PROJECT_ROOT, '.agents', 'skills');
const PKG_DIR      = path.join(PROJECT_ROOT, 'packages', 'agent-orchestration');
const PKG_SRC      = path.join(PKG_DIR, 'src');

// ─── Constants ────────────────────────────────────────────────────────────────

const GENERIC_MODULES = ['awb', 'awm', 'core', '_memory'];

/** File path segments that trigger an unconditional skip. */
const EXCLUDE_ALWAYS = [
  '.backup',
  '.bak',
  'session-state-',  // timestamped session snapshots
];

/** Text file extensions — binary files are copied without modification. */
const TEXT_EXTS = new Set(['.md', '.yaml', '.yml', '.json', '.xml', '.csv', '.txt', '.js', '.sh', '.conf', '.py']);

/**
 * Content patterns that indicate Squidhub-specific material leaked into the
 * workshop source. verifyNoLeaks() scans for these and aborts the build if any
 * are found. .html files are skipped (the workflow diagram may contain generic
 * visual references).
 */
const LEAK_PATTERNS = [
  /squidhub/i,
  /unnportal\.io/i,
  /nautilus/i,
  /squid-master/i,
  /UNN-\d+/,
  /mcp__squidhub__/i,
  /SquidAI/,
];


// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Recursively walk a directory, returning [{full, rel}] pairs.
 * rel is relative to baseDir (defaults to dir itself).
 */
function walk(dir, baseDir) {
  if (!baseDir) baseDir = dir;
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel  = path.relative(baseDir, full);
    if (entry.isDirectory()) {
      results.push(...walk(full, baseDir));
    } else {
      results.push({ full, rel });
    }
  }
  return results;
}

function normRel(relPath) {
  return relPath.replace(/\\/g, '/').toLowerCase();
}

function isExcluded(rel) {
  const n = normRel(rel);
  return EXCLUDE_ALWAYS.some(p => n.includes(p));
}

/**
 * Read a file as UTF-8 text if it has a recognised text extension,
 * otherwise return null (binary — will be copyFile'd instead).
 */
function readText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!TEXT_EXTS.has(ext)) return null;
  try { return fs.readFileSync(filePath, 'utf8'); } catch { return null; }
}

function writeFile(dest, content) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}


// ─── Step 1: buildGenericPackage ─────────────────────────────────────────────

function buildGenericPackage() {
  console.log('📦  Building generic package → packages/agent-orchestration/src/');

  // Wipe and recreate src/
  if (fs.existsSync(PKG_SRC)) fs.rmSync(PKG_SRC, { recursive: true });
  fs.mkdirSync(PKG_SRC, { recursive: true });

  let totalCopied  = 0;
  let totalSkipped = 0;

  // ── Copy _arcwright/{awb,awm,core,_memory} ──────────────────────────────────────
  for (const mod of GENERIC_MODULES) {
    const modSrc = path.join(ARCWRIGHT_SRC, mod);
    if (!fs.existsSync(modSrc)) {
      console.log(`  ⚠  Module not found: _arcwright/${mod} — skipping`);
      continue;
    }

    const files = walk(modSrc, modSrc);
    let modCopied = 0;

    for (const { full, rel } of files) {
      const globalRel = path.join(mod, rel);  // e.g. "awm/agents/analyst.md"

      if (isExcluded(globalRel)) {
        totalSkipped++;
        continue;
      }

      const dest    = path.join(PKG_SRC, globalRel);
      const content = readText(full);
      if (content !== null) {
        writeFile(dest, content);
      } else {
        copyFile(full, dest);
      }
      modCopied++;
      totalCopied++;
    }

    console.log(`  ✓  _arcwright/${mod}  (${modCopied} files)`);
  }

  // ── Copy .agents/skills/ ───────────────────────────────────────────────────
  const skillsCopied = copySkillsTo(path.join(PKG_SRC, '.agents', 'skills'), 'packages/agent-orchestration/src/.agents/skills/');
  totalCopied += skillsCopied;

  console.log(`\n  Total: ${totalCopied} files copied, ${totalSkipped} skipped\n`);
}

/**
 * Walk SKILLS_SRC and copy all skill directories to destBase.
 * Returns count of files copied.
 */
function copySkillsTo(destBase, logLabel) {
  if (!fs.existsSync(SKILLS_SRC)) {
    console.log(`  ⚠  .agents/skills/ not found — skipping`);
    return 0;
  }

  const skills = fs.readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  let copied = 0;
  for (const skill of skills) {
    const skillSrcDir = path.join(SKILLS_SRC, skill);
    const files = walk(skillSrcDir, skillSrcDir);

    for (const { full, rel } of files) {
      if (isExcluded(rel)) continue;
      const dest    = path.join(destBase, skill, rel);
      const content = readText(full);
      if (content !== null) {
        writeFile(dest, content);
      } else {
        copyFile(full, dest);
      }
      copied++;
    }
  }

  console.log(`  ✓  .agents/skills/  (${skills.length} skills, ${copied} files)  → ${logLabel}`);
  return copied;
}

// ─── Step 2: buildKiroAssets ──────────────────────────────────────────────────

function buildKiroAssets() {
  console.log('🟣  Building Kiro assets → .kiro/');

  // 2a. Copy .agents/skills/ → src/.kiro/skills/ (1:1 — SKILL.md already Kiro-compatible)
  const kiroSkillsDest = path.join(PKG_SRC, '.kiro', 'skills');
  const skillsCopied   = copySkillsTo(kiroSkillsDest, 'src/.kiro/skills/');

  // 2b. Generate steering docs in src/.kiro/steering/
  const steeringDir = path.join(PKG_SRC, '.kiro', 'steering');
  fs.mkdirSync(steeringDir, { recursive: true });

  generateAgentsSteering(steeringDir);
  generateWorkflowsSteering(steeringDir);

  // 2c. Create placeholder hooks directory
  const hooksDir = path.join(PKG_SRC, '.kiro', 'hooks');
  fs.mkdirSync(hooksDir, { recursive: true });
  console.log(`  ✓  .kiro/hooks/ (placeholder created)`);

  console.log('');
}

/**
 * Extract agent name + description from core/agents/*.md agent files and
 * write a steering doc listing all available agents.
 */
function generateAgentsSteering(steeringDir) {
  const agentsDir = path.join(ARCWRIGHT_SRC, 'core', 'agents');
  if (!fs.existsSync(agentsDir)) {
    console.log('  ⚠  core/agents/ not found — skipping agents steering doc');
    return;
  }

  const agentFiles = fs.readdirSync(agentsDir)
    .filter(f => f.endsWith('.md'))
    .sort();

  /** Parse `name` from YAML frontmatter or <agent ... name="..."> XML attribute. */
  function extractName(content) {
    // YAML frontmatter: name: "..."
    const fm = content.match(/^---[\s\S]*?name:\s*["']?([^"'\n]+)["']?/m);
    if (fm) return fm[1].trim();
    // XML attribute: name="..."
    const xml = content.match(/<agent[^>]+name="([^"]+)"/);
    if (xml) return xml[1].trim();
    return null;
  }

  /** Parse `description` from YAML frontmatter or <agent ... capabilities="..."> */
  function extractDescription(content) {
    // YAML frontmatter: description: "..."
    const fm = content.match(/^---[\s\S]*?description:\s*["']?([^"'\n]+)["']?/m);
    if (fm) return fm[1].trim();
    // XML attribute: capabilities="..."
    const xml = content.match(/<agent[^>]+capabilities="([^"]+)"/);
    if (xml) return xml[1].trim();
    return null;
  }

  /** Parse `title` from YAML frontmatter or <agent ... title="..."> */
  function extractTitle(content) {
    const xml = content.match(/<agent[^>]+title="([^"]+)"/);
    if (xml) return xml[1].trim();
    return null;
  }

  const agents = [];
  for (const fname of agentFiles) {
    const content = fs.readFileSync(path.join(agentsDir, fname), 'utf8');
    const name    = extractName(content);
    const title   = extractTitle(content);
    const desc    = extractDescription(content);
    agents.push({ file: fname, name: name || fname.replace('.md', ''), title, desc });
  }

  const lines = [
    '# Arcwright — Available Agents',
    '',
    'This project uses Arcwright for structured AI-native development workflows.',
    'The following agents are available in `_arcwright/core/agents/` and `_arcwright/awm/`.',
    '',
    '## Core Agents',
    '',
    '| File | Name | Description |',
    '|------|------|-------------|',
  ];

  for (const { file, name, title, desc } of agents) {
    const displayName = title || name;
    const displayDesc = desc || '_No description_';
    lines.push(`| \`${file}\` | ${displayName} | ${displayDesc} |`);
  }

  lines.push('');
  lines.push('## Usage');
  lines.push('');
  lines.push('Load an agent by reading its `.md` file and following the activation instructions inside the `<agent>` XML block. Agents in `_arcwright/awm/agents/` are specialist workflow agents; those in `_arcwright/core/agents/` are system-level (orchestrator, builder, etc.).');
  lines.push('');
  lines.push('Slash commands in `.claude/commands/arcwright-track-*.md` activate the master orchestrator with a pre-selected workflow track.');
  lines.push('');

  const dest = path.join(steeringDir, 'arcwright-core.md');
  writeFile(dest, lines.join('\n'));
  console.log(`  ✓  .kiro/steering/arcwright-core.md  (${agents.length} agents catalogued)`);
}

/**
 * Walk awm/workflows/ and core/workflows/ and generate a reference steering doc.
 */
function generateWorkflowsSteering(steeringDir) {
  const workflowDirs = [
    { label: 'awm/workflows',  dir: path.join(ARCWRIGHT_SRC, 'awm',  'workflows') },
    { label: 'core/workflows', dir: path.join(ARCWRIGHT_SRC, 'core', 'workflows') },
  ];

  const lines = [
    '# Arcwright — Available Workflows',
    '',
    'Arcwright provides structured workflow tracks for different task scales.',
    '',
  ];

  let total = 0;

  for (const { label, dir } of workflowDirs) {
    if (!fs.existsSync(dir)) {
      lines.push(`## ${label}`, '', '_Directory not found._', '');
      continue;
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md') || f.endsWith('.yaml') || f.endsWith('.yml')).sort();
    lines.push(`## ${label}`);
    lines.push('');

    if (!files.length) {
      lines.push('_No workflow files found._');
      lines.push('');
      continue;
    }

    for (const fname of files) {
      const content  = fs.readFileSync(path.join(dir, fname), 'utf8');
      // Extract title from first # heading or YAML title field
      const heading  = content.match(/^#\s+(.+)/m);
      const yamlTitle = content.match(/^title:\s*["']?([^"'\n]+)/m);
      const title    = (heading && heading[1]) || (yamlTitle && yamlTitle[1]) || fname.replace(/\.(md|ya?ml)$/, '');
      lines.push(`- **\`${fname}\`** — ${title.trim()}`);
      total++;
    }

    lines.push('');
  }

  lines.push('## How to Use');
  lines.push('');
  lines.push('Start workflows via the master orchestrator (`/arcwright-master` or `/arcwright-track-*` slash commands). The orchestrator triages your task and routes it to the appropriate workflow track automatically. See `.kiro/steering/arcwright-core.md` for agent details.');
  lines.push('');

  const dest = path.join(steeringDir, 'arcwright-workflows.md');
  writeFile(dest, lines.join('\n'));
  console.log(`  ✓  .kiro/steering/arcwright-workflows.md  (${total} workflows catalogued)`);
}

// ─── Step 3: bundleTrackCommands ─────────────────────────────────────────────

function bundleTrackCommands() {
  console.log('🗂️   Bundling track commands → src/.claude/commands/');

  const commandsSrc  = path.join(PROJECT_ROOT, '.claude', 'commands');
  const commandsDest = path.join(PKG_SRC, '.claude', 'commands');

  if (!fs.existsSync(commandsSrc)) {
    console.log('  ⚠  .claude/commands/ not found — skipping');
    return;
  }

  const trackFiles = fs.readdirSync(commandsSrc)
    .filter(f => f.startsWith('arcwright-track-') && f.endsWith('.md'))
    .sort();

  if (!trackFiles.length) {
    console.log('  ⚠  No arcwright-track-*.md files found — skipping');
    return;
  }

  fs.mkdirSync(commandsDest, { recursive: true });

  for (const fname of trackFiles) {
    copyFile(path.join(commandsSrc, fname), path.join(commandsDest, fname));
  }

  console.log(`  ✓  ${trackFiles.length} arcwright-track-*.md commands copied`);
  console.log('');
}

// ─── Step 4: bundleTmuxSetup ──────────────────────────────────────────────────

function bundleTmuxSetup() {
  console.log('⌨️   Bundling tmux setup → src/tmux/');

  const tmuxBaseSrc = path.join(PROJECT_ROOT, 'docs', 'dev', 'tmux');
  const sharedSrc   = path.join(tmuxBaseSrc, 'shared');
  const destDir     = path.join(PKG_SRC, 'tmux');

  fs.mkdirSync(destDir, { recursive: true });

  // Prefer docs/dev/tmux/shared/ if it exists; fall back to docs/dev/tmux/ flat
  const sharedSource = fs.existsSync(sharedSrc) ? sharedSrc : (fs.existsSync(tmuxBaseSrc) ? tmuxBaseSrc : null);

  if (!sharedSource) {
    console.log('  ⚠  docs/dev/tmux/ not found — skipping tmux bundle');
    return;
  }

  // Copy all files directly in the source directory (non-recursive — subdirs handled below)
  const sharedFiles = fs.readdirSync(sharedSource, { withFileTypes: true })
    .filter(e => e.isFile());

  let sharedCopied = 0;
  for (const e of sharedFiles) {
    const src = path.join(sharedSource, e.name);
    copyFile(src, path.join(destDir, e.name));
    sharedCopied++;
  }
  console.log(`  ✓  tmux/shared  (${sharedCopied} files)  → src/tmux/`);

  // Copy platform-specific subdirs (windows/, linux/) — always include both
  for (const subdir of ['windows', 'linux']) {
    const subdirSrc = path.join(tmuxBaseSrc, subdir);
    if (!fs.existsSync(subdirSrc)) continue;
    const subdirDest = path.join(destDir, subdir);
    fs.mkdirSync(subdirDest, { recursive: true });
    const files = fs.readdirSync(subdirSrc, { withFileTypes: true }).filter(e => e.isFile());
    for (const e of files) {
      copyFile(path.join(subdirSrc, e.name), path.join(subdirDest, e.name));
    }
    console.log(`  ✓  tmux/${subdir}/  (${files.length} files)  → src/tmux/${subdir}/`);
  }

  console.log('');
}

// ─── Step 5: verifyNoLeaks ────────────────────────────────────────────────────

function verifyNoLeaks() {
  console.log('🔍  Verifying no Squidhub content leaks in src/...');

  const allFiles = walk(PKG_SRC, PKG_SRC);
  const leaks    = [];

  for (const { full, rel } of allFiles) {
    // Skip binary files and HTML (workflow diagram may have generic visual refs)
    const ext = path.extname(full).toLowerCase();
    if (ext === '.html') continue;
    if (!TEXT_EXTS.has(ext)) continue;

    let content;
    try { content = fs.readFileSync(full, 'utf8'); } catch { continue; }

    for (const pattern of LEAK_PATTERNS) {
      if (pattern.test(content)) {
        // Find first matching line for context
        const lines = content.split('\n');
        const matchLine = lines.find(l => pattern.test(l)) || '';
        leaks.push({ rel, pattern: pattern.toString(), line: matchLine.trim().slice(0, 120) });
        break;  // one report per file is enough
      }
    }
  }

  if (leaks.length) {
    console.error(`\n  ❌  LEAK CHECK FAILED — ${leaks.length} file(s) contain Squidhub content:\n`);
    for (const { rel, pattern, line } of leaks) {
      console.error(`     ${rel}`);
      console.error(`       pattern : ${pattern}`);
      console.error(`       context : ${line}`);
      console.error('');
    }
    console.error('  Fix the source files and rebuild.\n');
    process.exit(1);
  }

  console.log(`  ✓  No leaks found (${allFiles.length} files scanned)\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('🔨  Arcwright Build\n');

buildGenericPackage();
buildKiroAssets();
bundleTrackCommands();
bundleTmuxSetup();
verifyNoLeaks();

console.log('✅  Build complete!');
