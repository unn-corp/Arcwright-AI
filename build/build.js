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
 *     .claude/commands/*.md (no transforms).
 *     model-launcher templates.
 *
 *   Kiro assets → packages/agent-orchestration/src/.kiro/
 *     Steering docs generated from agent/workflow manifests.
 *     Agent configuration is generated from the generic source. Skills are
 *     adapted from the generic skill tree when Kiro is installed.
 *
 * Run: node build/build.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { adaptKiroContent } = require('../packages/agent-orchestration/lib/kiro-adapter');
const { description: metadataDescription, body: metadataBody, gate: metadataGate } = require('../.agents/skills/arcwright/scripts/skill-metadata.cjs');
const { SKILL_POLICY } = require('../packages/agent-orchestration/lib/skill-policy');
const { createPack: createMattPocockPack, writePack: writeMattPocockPack } = require('./matt-pocock');

// Robustly remove a directory tree. Recursive rmSync can race to ENOTEMPTY on
// reused CI workspaces (self-hosted runners, overlay filesystems); retry with a
// backoff, then fall back to `rm -rf`, before failing the build.
function wipeSrc(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
    if (!fs.existsSync(dir)) return;
  } catch { /* fall through to rm -rf */ }
  try {
    if (process.platform !== 'win32') execSync(`rm -rf "${dir}"`, { stdio: 'ignore' });
  } catch { /* fall through to a final throwing attempt */ }
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ARCWRIGHT_SRC     = path.join(PROJECT_ROOT, '_arcwright');
const SKILLS_SRC   = path.join(PROJECT_ROOT, '.agents', 'skills');
const PKG_DIR      = path.join(PROJECT_ROOT, 'packages', 'agent-orchestration');
const PKG_SRC      = path.join(PKG_DIR, 'src');
const PROJECT_ROOT_REAL = fs.realpathSync(PROJECT_ROOT);

// ─── Constants ────────────────────────────────────────────────────────────────

const GENERIC_MODULES = ['awb', 'awm', 'core', '_memory', 'aws-infra', 'unnamed-pm'];

/** File path segments that trigger an unconditional skip. */
const EXCLUDE_ALWAYS = [
  '.backup',
  '.bak',
  'session-state-',  // timestamped session snapshots
  '__pycache__',     // compiled bytecode — version-specific, useless to consumers
  '.pyc',
];

/** Text file extensions — binary files are copied without modification. */
const TEXT_EXTS = new Set(['.md', '.yaml', '.yml', '.json', '.xml', '.csv', '.txt', '.js', '.sh', '.conf', '.py']);

/**
 * Extensions verifyNoLeaks() will NOT read. Everything else is scanned.
 *
 * This is a denylist on purpose. It used to reuse TEXT_EXTS (an allowlist), so
 * 41 shipped files were silently exempt from the hard gate — including .ts,
 * .ps1, .dot, .svg, .excalidraw and the extensionless LICENSE files — while the
 * build still printed "✓ No leaks found (N files scanned)", which reads as full
 * coverage. With a denylist, a new text format is covered by default; the worst
 * case is a harmless read of an unlisted binary rather than a silent gap.
 */
const LEAK_SCAN_SKIP_EXTS = new Set([
  '.html',  // workflow diagram may carry generic visual references
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.bmp',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.zip', '.gz', '.tgz', '.bz2', '.xz', '.7z', '.tar',
  '.pdf', '.mp4', '.mp3', '.wav', '.mov', '.webm',
  '.pyc', '.pyo', '.so', '.dylib', '.dll', '.exe', '.bin', '.wasm',
]);

/**
 * Content patterns that indicate Squidhub-specific material leaked into the
 * workshop source. verifyNoLeaks() scans for these and aborts the build if any
 * are found. .html files are skipped (the workflow diagram may contain generic
 * visual references).
 *
 * Defined in ./leak-patterns.js so the per-edit advisory gate
 * (.claude/arcwright-hooks/gate-leak.js) shares one definition with this
 * build-time hard gate instead of hand-mirroring it.
 */
const { LEAK_PATTERNS } = require('./leak-patterns');
const { buildInvocationCatalog, verifyModelInvocation, loadSkillAliases } = require('./invocation');

/** Slash command files to ship. Shared by bundleKiroAgents() and bundleTrackCommands(). */
const SHIPPED_COMMANDS = [
  /^arcwright-migrate\.md$/,
  /^herdr\.md$/,
  /^edge-case-hunter\.md$/,
  /^gsudo\.md$/,
  /^team\.md$/,
  /^dry\.md$/,
  /^dry-loop\.md$/,
  /^ux-audit\.md$/,
  /^ux-loop\.md$/,
  /^security-review\.md$/,
  /^security-scan\.md$/,
  /^sec-loop\.md$/,
  /^design\.md$/,
  /^playwright\.md$/,
  /^audit-site\.md$/,
  /^diagram\.md$/,
  /^triage\.md$/,
  /^skill-scout\.md$/,
  /^docker-check\.md$/,
  /^ci-gates\.md$/,
  /^drift\.md$/,
  /^dotnet\.md$/,
  /^electron\.md$/,
  /^tauri\.md$/,
  /^strands\.md$/,
  /^aws-infra\.md$/,
  /^unnamed-pm\.md$/,
  /^unnamed-dev-mcp\.md$/,
  /^react\.md$/,
  /^typescript\.md$/,
  /^nextjs\.md$/,
  /^nextjs-app-router\.md$/,
  /^python\.md$/,
  /^python-perf\.md$/,
  /^python-api\.md$/,
  /^java\.md$/,
  /^java-perf\.md$/,
  /^postgres\.md$/,
  /^redis\.md$/,
  /^websocket\.md$/,
  /^responsive\.md$/,
  /^secure\.md$/,
  /^debug\.md$/,
  /^clean-code\.md$/,
  /^caveman\.md$/,
  /^correct-course\.md$/,
  /^hookify\.md$/,
  /^handoff\.md$/,
  /^claude-md\.md$/,
  /^commit\.md$/,
  /^commit-push-pr\.md$/,
  /^clean-gone\.md$/,
  /^grill\.md$/,
  /^explain-mode\.md$/,
  /^pr-review\.md$/,
  /^code-graph\.md$/,
  /^tasks\.md$/,
  /^lsp\.md$/,
];


// ─── Helpers ─────────────────────────────────────────────────────────────────

function isWithinProjectRoot(filePath) {
  const relative = path.relative(PROJECT_ROOT_REAL, filePath);
  return relative === '' || (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

/**
 * Validate a build input before any filesystem operation can dereference it.
 * Source links are rejected even when they resolve back into the checkout;
 * canonicalization also catches a symlinked parent directory.
 */
function assertSafeBuildInput(filePath) {
  let stat;
  try {
    stat = fs.lstatSync(filePath);
  } catch (error) {
    if (error?.code === 'ENOENT') return filePath;
    throw error;
  }

  if (stat.isSymbolicLink()) {
    throw new Error(`Refusing symlinked build input: ${filePath}`);
  }

  const realPath = fs.realpathSync(filePath);
  if (!isWithinProjectRoot(realPath)) {
    throw new Error(`Build input resolves outside PROJECT_ROOT: ${filePath} -> ${realPath}`);
  }
  return realPath;
}

function sourceExists(filePath) {
  let safePath;
  try {
    safePath = assertSafeBuildInput(filePath);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return false;
    throw error;
  }
  return fs.existsSync(safePath);
}

function readSourceDirectory(dir, options, skipEntry) {
  const safeDir = assertSafeBuildInput(dir);
  if (!fs.existsSync(safeDir)) return [];
  const entries = fs.readdirSync(safeDir, options)
    .filter(entry => !skipEntry || !skipEntry(typeof entry === 'string' ? entry : entry.name));
  for (const entry of entries) {
    const name = typeof entry === 'string' ? entry : entry.name;
    assertSafeBuildInput(path.join(safeDir, name));
  }
  return entries;
}

/**
 * Recursively walk a directory, returning [{full, rel}] pairs.
 * rel is relative to baseDir (defaults to dir itself).
 */
function walk(dir, baseDir, skipRelative) {
  if (!baseDir) baseDir = dir;
  const results = [];
  const safeDir = assertSafeBuildInput(dir);
  if (!fs.existsSync(safeDir)) return results;
  const skipEntry = skipRelative && (name => skipRelative(path.relative(baseDir, path.join(safeDir, name))));
  for (const entry of readSourceDirectory(safeDir, { withFileTypes: true }, skipEntry)) {
    const full = path.join(safeDir, entry.name);
    const rel  = path.relative(baseDir, full);
    if (entry.isDirectory()) {
      results.push(...walk(full, baseDir, skipRelative));
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
  // Local workflow state must never become reusable package source.
  if (n.startsWith('_memory/skill-runs/')) return true;
  return EXCLUDE_ALWAYS.some(p => n.includes(p));
}

/**
 * Read a file as UTF-8 text if it has a recognised text extension,
 * otherwise return null (binary — will be copyFile'd instead).
 */
function readText(filePath) {
  const safePath = assertSafeBuildInput(filePath);
  const ext = path.extname(filePath).toLowerCase();
  if (!TEXT_EXTS.has(ext)) return null;
  try { return fs.readFileSync(safePath, 'utf8'); } catch { return null; }
}

function readSourceText(filePath) {
  return fs.readFileSync(assertSafeBuildInput(filePath), 'utf8');
}

function writeFile(dest, content) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
}

function copyFile(src, dest) {
  const safeSrc = assertSafeBuildInput(src);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(safeSrc, dest);
}


/**
 * Full adaptation for agent prompts (extends the shared Kiro rewrite with
 * $ARGUMENTS handling).
 */
function adaptPromptForKiro(body) {
  let p = adaptKiroContent(body);
  p = p.replace(
    /`?\$ARGUMENTS`?/g,
    '(the user\'s request — provided in their message)'
  );
  return p;
}


// ─── Step 1: buildGenericPackage ─────────────────────────────────────────────

function buildGenericPackage() {
  console.log('📦  Building generic package → packages/agent-orchestration/src/');

  // Wipe and recreate src/. On reused CI workspaces (self-hosted runners) a
  // recursive rmSync can race to ENOTEMPTY on nested dirs. Retry, and fall back
  // to `rm -rf` which tolerates the race, before giving up.
  wipeSrc(PKG_SRC);
  fs.mkdirSync(PKG_SRC, { recursive: true });

  let totalCopied  = 0;
  let totalSkipped = 0;

  // ── Copy _arcwright/{awb,awm,core,_memory} ──────────────────────────────────────
  for (const mod of GENERIC_MODULES) {
    const modSrc = path.join(ARCWRIGHT_SRC, mod);
    if (!sourceExists(modSrc)) {
      console.log(`  ⚠  Module not found: _arcwright/${mod} — skipping`);
      continue;
    }

    // Runtime fixtures may contain symlinks and private reports. Prune them
    // before traversing; other module inputs retain the existing link checks.
    const skipRuntime = mod === '_memory' && (rel => normRel(rel) === 'skill-runs');
    const files = walk(modSrc, modSrc, skipRuntime);
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

  // The optional pack is ordinary Arcwright source. Build it without Git,
  // upstream checkouts, or a network fetch.
  if (sourceExists(path.join(SKILLS_SRC, 'matt-pocock', 'SKILL.md'))) {
    const pack = createMattPocockPack(PROJECT_ROOT);
    writeMattPocockPack(pack, PKG_SRC);
    totalCopied += pack.output.size;
    console.log(`  ✓  Arcwright local Matt Pocock pack (${pack.count} skills + router)`);
  }

  console.log(`\n  Total: ${totalCopied} files copied, ${totalSkipped} skipped\n`);
}

/**
 * Walk SKILLS_SRC and copy all skill directories to destBase.
 * Returns count of files copied.
 */
function copySkillsTo(destBase, logLabel) {
  if (!sourceExists(SKILLS_SRC)) {
    console.log(`  ⚠  .agents/skills/ not found — skipping`);
    return 0;
  }

  const skills = readSourceDirectory(SKILLS_SRC, { withFileTypes: true })
    .filter(e => e.isDirectory() && !/^matt-pocock(?:-|$)/.test(e.name))
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

  // Skills link to these shared provenance/license notices. Keeping them only
  // in the workshop leaves installed copies with missing source information.
  for (const entry of readSourceDirectory(SKILLS_SRC, { withFileTypes: true })) {
    if (!/^(?:SOURCES-|VENDORED-)/.test(entry.name) || entry.isDirectory()) continue;
    const full = path.join(SKILLS_SRC, entry.name);
    const content = readSourceText(full);
    writeFile(path.join(destBase, entry.name), content);
    copied++;
  }

  console.log(`  ✓  .agents/skills/  (${skills.length} skills, ${copied} files)  → ${logLabel}`);
  return copied;
}

// ─── Step 2: buildKiroAssets ──────────────────────────────────────────────────

function buildKiroAssets() {
  console.log('🟣  Building Kiro assets → .kiro/');

  // Generate steering docs in src/.kiro/steering/. Kiro skill files are
  // adapted from src/.agents/skills/ at installation time to avoid shipping a
  // second 10 MB skill tree in every package.
  const steeringDir = path.join(PKG_SRC, '.kiro', 'steering');
  fs.mkdirSync(steeringDir, { recursive: true });

  generateAgentsSteering(steeringDir);
  generateWorkflowsSteering(steeringDir);

  console.log('');
}

/**
 * Extract agent name + description from core/agents/*.md agent files and
 * write a steering doc listing all available agents.
 */
function generateAgentsSteering(steeringDir) {
  const agentsDir = path.join(ARCWRIGHT_SRC, 'core', 'agents');
  if (!sourceExists(agentsDir)) {
    console.log('  ⚠  core/agents/ not found — skipping agents steering doc');
    return;
  }

  const agentFiles = readSourceDirectory(agentsDir)
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
    const content = readSourceText(path.join(agentsDir, fname));
    const name    = extractName(content);
    const title   = extractTitle(content);
    const desc    = extractDescription(content);
    agents.push({ file: fname, name: name || fname.replace('.md', ''), title, desc });
  }

  const lines = [
    '---',
    'inclusion: always',
    'name: arcwright-core',
    'description: Arcwright agent registry and usage reference',
    '---',
    '',
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
  lines.push('Slash commands in `.claude/commands/*.md` activate the corresponding agent or skill directly.');
  lines.push('');

  // Native skill resources already expose the catalog. Keep always-loaded
  // steering compact instead of duplicating every skill description here.
  lines.push('## Skill discovery');
  lines.push('');
  lines.push('Use the native skill catalog to select a matching skill. Read its compact rules or entrypoint, then only the references needed for the current task. Do not scan or preload the whole skill library. Project skills take precedence over global copies.');
  lines.push('');
  lines.push('For a command or specialist unavailable as a native host entrypoint, use the `arcwright` skill to find and execute its installed procedure. A supplied task runs directly; menus are optional navigation.');
  lines.push('');
  lines.push(SKILL_POLICY);

  const dest = path.join(steeringDir, 'arcwright-core.md');
  writeFile(dest, lines.join('\n'));
  console.log(`  ✓  .kiro/steering/arcwright-core.md  (${agents.length} agents catalogued)`);
}

/**
 * Generate a workflows steering doc. The track-based content previously
 * emitted here has been removed in stage 1; stage 4 fills the placeholder
 * with workflow-router / ultracode / /goal guidance for Kiro.
 */
function generateWorkflowsSteering(steeringDir) {
  const content = `---
inclusion: auto
name: arcwright-workflows
description: Arcwright task routing, scoped delegation, and verification.
---

# Arcwright workflows

Execute a clear supplied task directly. Use the installed triage or arcwright
router when workflow selection is needed; do not require another slash command
or menu selection. A small task can run inline. Delegate substantial independent
work only when authorized by the user or invoked workflow.

For a selected team preset, load subagent-protocol and its shared team
procedure. Give each task scoped ownership, source identity, acceptance evidence,
a small capability brief with actual installed skill paths, and a finder for
additional discovery. Suggestions are nonexclusive; read selected skills directly
without a Skill tool. Reuse context and briefs instead of preloading catalogs.

Inherit the user's provider, model, effort, permissions, and budget. Discover
actual host tools and live model IDs when an override is needed. Reuse native
agents only when supported and live. In Arcwright Code/T3, each review round uses
a fresh delegate_task with prior findings and current evidence; retain taskId and
use task_status/task_cancel. Separate worktrees start from the parent local
commit without uncommitted edits. Do not create top-level threads or recurring
schedules unless explicitly requested.

Use actual host concurrency limits and disjoint ownership. Inspect returned
artifacts and require each preset's independent sign-offs. Run focused tests
then required repository gates; repeat only for changes, failures, unresolved
risk, or explicit requirements. Budget exhaustion is incomplete, not approval.
Keep installed bundles read-only. Put working artifacts in the active project's
_arcwright/_memory/skill-runs/<workflow>-<run>/, or host-managed evidence storage.

Herdr visibility is optional when requested and its environment is available.
Use the installed herdr procedure without duplicating the underlying task.
Kiro subagent/DAG fields apply only when exposed by that host. Optional runtime
names and old provider-specific examples do not override current host policy.
`;
  const dest = path.join(steeringDir, 'arcwright-workflows.md');
  writeFile(dest, content);
  console.log('  ✓  .kiro/steering/arcwright-workflows.md  (shared task routing and delegation)');
}

/**
 * Read each .claude/commands/*.md and write a Kiro-compatible agent JSON file
 * at src/.kiro/agents/{name}.json. Also generates specialist agent stubs from
 * _arcwright/awm/agents/ so the subagent tool's `role` field can reference them.
 */
function bundleKiroAgents() {
  const commandsSrc  = path.join(PROJECT_ROOT, '.claude', 'commands');
  const agentsDest   = path.join(PKG_SRC, '.kiro', 'agents');

  if (!sourceExists(commandsSrc)) {
    console.log('  ⚠  .claude/commands/ not found — skipping Kiro agents');
    return;
  }

  fs.mkdirSync(agentsDest, { recursive: true });

  const cmdFiles = readSourceDirectory(commandsSrc)
    .filter(f => SHIPPED_COMMANDS.some(re => re.test(f)))
    .sort();

  if (!cmdFiles.length) {
    console.log('  ⚠  No slash command files found — skipping Kiro agents');
    return;
  }

  /** Parse YAML frontmatter from a markdown file. */
  const parseFrontmatter = content => ({ description: metadataDescription(content, ''), body: metadataBody(content) });

  /**
   * Kiro CLI tool names. These are the actual tool identifiers Kiro recognises.
   */
  const KIRO_TOOLS_BY_PATTERN = {
    'team':               ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code', 'subagent', 'knowledge'],
    'arcwright-migrate':  ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob'],
    'dry':                ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'ux-audit':           ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code', 'web_search', 'web_fetch'],
    'ux-loop':            ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code', 'web_search', 'web_fetch'],
    'security-review':    ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'security-scan':      ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'sec-loop':           ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'design':             ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'web_search', 'web_fetch'],
    'playwright':         ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob'],
    'audit-site':         ['fs_read', 'fs_write', 'execute_bash', 'web_search', 'web_fetch'],
    'diagram':            ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob'],
    'triage':             ['fs_read', 'grep', 'glob', 'code'],
    'skill-scout':        ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'subagent', 'web_search', 'web_fetch'],
    'docker-check':       ['fs_read', 'execute_bash', 'grep'],
    'ci-gates':           ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'drift':              ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'dotnet':             ['fs_read', 'execute_bash', 'grep'],
    'electron':           ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'tauri':              ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'strands':            ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'aws-infra':          ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code', 'web_fetch'],
    'unnamed-pm':         ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'unnamed-dev-mcp':    ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'herdr':              ['fs_read', 'fs_write', 'execute_bash'],
    'edge-case-hunter':   ['fs_read', 'execute_bash', 'grep', 'glob'],
    'gsudo':              ['execute_bash'],
    // Coding / best-practice skill commands
    'react':              ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'typescript':         ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'nextjs':             ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code', 'web_search', 'web_fetch'],
    'python':             ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'python-perf':        ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'python-api':         ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'java':               ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'java-perf':          ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'postgres':           ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'redis':              ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'websocket':          ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'responsive':         ['fs_read', 'fs_write', 'grep', 'glob', 'code', 'web_search', 'web_fetch'],
    'secure':             ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'debug':              ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'clean-code':         ['fs_read', 'fs_write', 'grep', 'glob', 'code'],
    'caveman':            ['fs_read', 'fs_write', 'grep', 'glob'],
    'correct-course':     ['fs_read', 'fs_write', 'grep', 'glob', 'code'],
    'hookify':            ['fs_read', 'fs_write', 'execute_bash'],
    'handoff':            ['fs_read', 'fs_write', 'execute_bash', 'glob'],
    'claude-md':          ['fs_read', 'fs_write', 'execute_bash'],
    'commit-push-pr':     ['execute_bash'],
    'commit':             ['execute_bash'],
    'clean-gone':         ['execute_bash'],
    'grill':              ['fs_read', 'execute_bash', 'grep', 'glob'],
    'explain-mode':       ['fs_read'],
    'pr-review':          ['fs_read', 'execute_bash', 'grep', 'glob', 'subagent', 'web_fetch'],
    'code-graph':         ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob'],
    'tasks':              ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'subagent'],
    'lsp':                ['fs_read', 'fs_write', 'execute_bash'],
  };

  function resolveTools(name) {
    for (const [pattern, toolList] of Object.entries(KIRO_TOOLS_BY_PATTERN)) {
      if (name.startsWith(pattern) || name === pattern) return toolList;
    }
    return ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'];
  }

  const isTeam = (name) => name === 'team';

  /** Specialist agent names for toolsSettings.crew */
  const SPECIALIST_AGENTS = [
    'arcwright-analyst', 'arcwright-architect', 'arcwright-dev', 'arcwright-pm',
    'arcwright-qa', 'arcwright-quick-flow-solo-dev', 'arcwright-review-orchestrator',
    'arcwright-sm', 'arcwright-tech-writer', 'arcwright-ux-designer',
    'arcwright-aws-infra', 'arcwright-unnamed-pm', 'arcwright-verifier',
  ];

  /** Kiro CLI addendum appended to team/team-style agent prompts. */
  // Default is the in-process `subagent` tool (DAG pipeline with `stages` and
  // `depends_on`). Herdr panes are opt-in visibility only — see the `herdr` skill.
  const KIRO_ORCHESTRATION_ADDENDUM = `

## Kiro delegation adapter

Use the selected team recipe and shared subagent-protocol procedure.
When this Kiro host exposes subagent/DAG execution, inspect its actual schema
and map roles and dependencies to availableAgents. Inherit the selected model
and permissions; do not add a model override or broad trust flag by default.
Give every stage a small capability brief, scope, source identity, and evidence
requirements. Sequence dependent stages and keep conditional consultation and
review loops in the coordinator when a static DAG cannot express them.

For Arcwright Code/T3 delegated work, discover live targets, retain task IDs,
and create a fresh delegated task per review round with prior findings. Do not
substitute a top-level thread or childThreadId messaging. Use host completion
and status tools, actual concurrency limits, and proportionate verification.

Visible panes require explicit user preference and an available Herdr runtime.
Load the installed herdr skill for that adapter; preserve the same task ownership
and required sign-offs. Omit unavailable optional viewing surfaces.
`;

  let generated = 0;
  for (const fname of cmdFiles) {
    const srcPath  = path.join(commandsSrc, fname);
    const name     = fname.replace(/\.md$/, '');
    const raw      = readSourceText(srcPath);
    const { description, body } = parseFrontmatter(raw);

    let desc = description;
    if (!desc) {
      const headingMatch = body.match(/^##?\s+(.+)/m);
      desc = headingMatch ? headingMatch[1].trim() : `Arcwright command: ${name}`;
    }

    const tools = resolveTools(name);
    let prompt = adaptPromptForKiro(body.trim());

    // Append the in-process orchestration + Herdr pane-visibility addendum to team agents
    if (isTeam(name)) {
      prompt += KIRO_ORCHESTRATION_ADDENDUM;
    }

    const agent = { name, description: desc, prompt, tools };

    // Every command agent needs skill access, not just teams. adaptPromptForKiro()
    // rewrites .agents/skills/ → .kiro/skills/ in the prompt, so a command whose
    // whole job is "load skill X and follow it" (/dry, /debug, /ci-gates, …) ends
    // up pointing at a path Kiro will not read without this grant. Scoping the
    // resource to teams left 54 agents instructed to load a skill they could not
    // open, which fails silently — the agent simply proceeds without the skill.
    agent.resources = ['skill://.kiro/skills/**/SKILL.md'];

    // Team agents additionally get read-only tools auto-approved, the master
    // orchestrator persona, and crew config.
    if (isTeam(name)) {
      agent.allowedTools = ['fs_read', 'grep', 'glob', 'code', 'knowledge', 'web_search', 'web_fetch'];
      agent.resources.push('file://_arcwright/core/agents/arcwright-master.md');
      agent.toolsSettings = {
        crew: {
          availableAgents: SPECIALIST_AGENTS,
        },
      };
    }

    // Kiro agent actions can call MCP tools only when the generated agent opts
    // into the project's mcp.json. The two Unnamed agents are the only agents
    // that require this capability; keep every other generated agent scoped.
    if (name === 'unnamed-dev-mcp' || name === 'unnamed-pm') {
      agent.includeMcpJson = true;
    }

    writeFile(path.join(agentsDest, `${name}.json`), JSON.stringify(agent, null, 2) + '\n');
    generated++;
  }

  // ── Generate specialist agent stubs from module agent dirs ────────────────
  // awm/agents/ always; aws-infra/agents/ and unnamed-pm/agents/ are optional
  // modules (gated at install time) but their stubs are always built into the
  // package — the installer decides whether to copy them.
  const specialistAgentDirs = [
    path.join(ARCWRIGHT_SRC, 'awm', 'agents'),
    path.join(ARCWRIGHT_SRC, 'aws-infra', 'agents'),
    path.join(ARCWRIGHT_SRC, 'unnamed-pm', 'agents'),
  ].filter(d => sourceExists(d));
  let specialists = 0;
  if (specialistAgentDirs.length) {
    const agentFiles = [];
    for (const d of specialistAgentDirs) {
      (function collectMd(dir) {
        for (const entry of readSourceDirectory(dir, { withFileTypes: true })) {
          if (entry.isDirectory()) collectMd(path.join(dir, entry.name));
          else if (entry.name.endsWith('.md')) agentFiles.push(path.join(dir, entry.name));
        }
      })(d);
    }

    /**
     * Map an array of Claude Code tool names to Kiro CLI tool identifiers.
     * Always appends 'code' and 'knowledge' if not already present.
     * Deduplicates the result (Edit + Write both → fs_write).
     */
    function mapClaudeToolsToKiro(claudeTools) {
      const CLAUDE_TO_KIRO = {
        'read':          'fs_read',
        'write':         'fs_write',
        'edit':          'fs_write',
        'bash':          'execute_bash',
        'grep':          'grep',
        'glob':          'glob',
        'webfetch':      'web_fetch',
        'websearch':     'web_search',
        'agent':         'subagent',
        'notebookedit':  'fs_write',
      };
      const kiroTools = new Set();
      for (const tool of claudeTools) {
        const mapped = CLAUDE_TO_KIRO[tool.trim().toLowerCase()];
        if (mapped) kiroTools.add(mapped);
      }
      kiroTools.add('code');
      kiroTools.add('knowledge');
      return Array.from(kiroTools);
    }

    /**
     * Parse the 'tools:' frontmatter field from a specialist agent .md file.
     * Handles quoted strings and comma-separated lists.
     * Returns null if no tools field is found.
     */
    function parseAgentTools(raw) {
      // Match: tools: "Read, Edit, Write" or tools: Read, Edit, Write
      // Also handles YAML block lists (tools:\n  - Read\n  - Write)
      const inlineMatch = raw.match(/^---[\s\S]*?^tools:\s*["']?([^"'\n]+?)["']?\s*$/m);
      if (inlineMatch) {
        return inlineMatch[1].split(',').map(t => t.trim()).filter(Boolean);
      }
      // YAML list form
      const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (fmMatch) {
        const fmBlock = fmMatch[1];
        const blockMatch = fmBlock.match(/^tools:\s*\n((?:[ \t]+-[^\n]+\n?)+)/m);
        if (blockMatch) {
          return blockMatch[1].split('\n')
            .map(l => l.replace(/^[ \t]+-\s*/, '').trim())
            .filter(Boolean);
        }
      }
      return null;
    }

    /** Default allowedTools when a specialist has no 'tools:' frontmatter. */
    const DEFAULT_SPECIALIST_ALLOWED = ['fs_read', 'grep', 'glob', 'code', 'knowledge'];

    for (const agentPath of agentFiles) {
      const raw = readSourceText(agentPath);
      const slug = path.basename(agentPath, '.md');
      const kiroName = `arcwright-${slug}`;

      const descMatch = raw.match(/^---[\s\S]*?description:\s*["']?(.+?)["']?\s*$/m);
      const desc = descMatch ? descMatch[1].trim() : `Arcwright ${slug} agent`;

      const relFromArcwright = path.relative(ARCWRIGHT_SRC, agentPath).replace(/\\/g, '/');

      const claudeTools = parseAgentTools(raw);
      const allowedTools = claudeTools
        ? mapClaudeToolsToKiro(claudeTools)
        : DEFAULT_SPECIALIST_ALLOWED;

      const agent = {
        name: kiroName,
        description: desc,
        prompt: `file://_arcwright/${relFromArcwright}`,
        tools: allowedTools,
        allowedTools,
        resources: ['skill://.kiro/skills/**/SKILL.md'],
      };

      writeFile(path.join(agentsDest, `${kiroName}.json`), JSON.stringify(agent, null, 2) + '\n');
      specialists++;
    }
  }

  console.log(`  ✓  .kiro/agents/  (${generated} command agents + ${specialists} specialist agents) → src/.kiro/agents/`);
  console.log('');
}

// ─── Step 3: bundleTrackCommands ─────────────────────────────────────────────

/**
 * Slash commands that exist in .claude/commands/ but are deliberately NOT
 * published. Add an entry here (with the reason) rather than just leaving a
 * command out of SHIPPED_COMMANDS — see verifyCommandCoverage().
 */
const UNSHIPPED_COMMANDS = {
  // 'example.md': 'why it stays local',
};

/**
 * Generated installer launchers may be present in a maintainer checkout. They
 * are accounted for by bundleSkillCommands() or bundleSpecialistCommands(),
 * not the curated SHIPPED_COMMANDS list. Only accept the generated shape when
 * its referenced source still exists so a typo or stale launcher remains a
 * hard coverage failure.
 */
function isGeneratedCommandLauncher(commandsSrc, fileName) {
  const content = readSourceText(path.join(commandsSrc, fileName));
  const skillMatch = content.match(
    /Load and run the `[^`]+` skill \(`\.agents\/skills\/([^/]+)\/SKILL\.md`\)/
  );
  if (skillMatch) {
    return sourceExists(path.join(SKILLS_SRC, skillMatch[1], 'SKILL.md'));
  }

  const agentMatch = content.match(
    /(?:LOAD the FULL agent file from|Resolve) (?:\{project-root\}\/)?_arcwright\/([A-Za-z0-9_./-]+\.md)/
  );
  return Boolean(agentMatch && sourceExists(path.join(ARCWRIGHT_SRC, agentMatch[1])));
}

/**
 * SHIPPED_COMMANDS is a hand-maintained allowlist, so a new command silently
 * fails to publish if someone forgets the command registration step in docs/dev/kiro-integration.md. That
 * already happened once: /security-scan shipped nowhere for its whole life
 * because the commit that added it never touched this list, and nothing
 * complained. Fail the build on an uncovered command instead — being
 * deliberately unpublished now requires saying so out loud.
 */
function verifyCommandCoverage() {
  const commandsSrc = path.join(PROJECT_ROOT, '.claude', 'commands');
  if (!sourceExists(commandsSrc)) return;

  const files = readSourceDirectory(commandsSrc).filter(f => f.endsWith('.md'));
  const uncovered = files.filter(
    f => !SHIPPED_COMMANDS.some(re => re.test(f))
      && !(f in UNSHIPPED_COMMANDS)
      && !isGeneratedCommandLauncher(commandsSrc, f)
  );
  const dead = SHIPPED_COMMANDS.filter(re => !files.some(f => re.test(f)));

  if (uncovered.length || dead.length) {
    console.error('\n  ❌  COMMAND COVERAGE FAILED\n');
    for (const f of uncovered) {
      console.error(`     ${f} is not published.`);
      console.error(`       Add /^${f.replace(/\./g, '\\.')}$/ to SHIPPED_COMMANDS and a`);
      console.error('       KIRO_TOOLS_BY_PATTERN entry, or list it in UNSHIPPED_COMMANDS.\n');
    }
    for (const re of dead) {
      console.error(`     ${re} in SHIPPED_COMMANDS matches no file (stale entry).\n`);
    }
    process.exit(1);
  }
  console.log(`  ✓  All ${files.length} slash commands accounted for`);
}

function bundleTrackCommands() {
  console.log('🗂️   Bundling slash commands → src/.claude/commands/');

  verifyCommandCoverage();

  const commandsSrc  = path.join(PROJECT_ROOT, '.claude', 'commands');
  const commandsDest = path.join(PKG_SRC, '.claude', 'commands');

  if (!sourceExists(commandsSrc)) {
    console.log('  ⚠  .claude/commands/ not found — skipping');
    return;
  }

  // Bundle all slash commands: arcwright-migrate, herdr, gsudo, and utility commands
  // (track commands removed in stage 1; the function name is kept for continuity)
  const cmdFiles = readSourceDirectory(commandsSrc)
    .filter(f => SHIPPED_COMMANDS.some(re => re.test(f)))
    .sort();

  if (!cmdFiles.length) {
    console.log('  ⚠  No slash command files found — skipping');
    return;
  }

  fs.mkdirSync(commandsDest, { recursive: true });

  for (const fname of cmdFiles) {
    copyFile(path.join(commandsSrc, fname), path.join(commandsDest, fname));
  }

  console.log(`  ✓  ${cmdFiles.length} slash commands copied`);
  console.log('');
}

// ─── Step 3b: bundleSpecialistCommands ───────────────────────────────────────

/**
 * Generate slash command wrappers for each awm/awb specialist agent directly
 * into src/.claude/commands/arcwright-<slug>.md. Each command activates the
 * corresponding specialist agent from _arcwright/{module}/agents/.
 *
 * This mirrors the Kiro specialist stubs generated in bundleKiroAgents() so
 * Claude Code users can invoke specialists via `/arcwright-dev` etc.
 */
function bundleSpecialistCommands() {
  console.log('👤  Generating specialist slash commands → src/.claude/commands/');

  const commandsDest = path.join(PKG_SRC, '.claude', 'commands');
  fs.mkdirSync(commandsDest, { recursive: true });

  const SPECIALIST_MODULES = ['awm', 'awb'];

  // Specialist slash-command names: the `arcwright-` prefix is dropped and
  // abbreviated roles are expanded to their full names. slug -> command name.
  // Slugs not listed keep their slug verbatim (e.g. architect, ux-designer,
  // verifier, agent-builder, module-builder, workflow-builder, review-orchestrator).
  // NOTE: this renames the user-facing SLASH COMMANDS only. The subagent_type
  // identifiers and Kiro agent names stay `arcwright-<slug>` (see SPECIALIST_AGENTS).
  const COMMAND_NAME_MAP = {
    'analyst': 'business-analyst',
    'dev': 'developer',
    'pm': 'product-manager',
    'qa': 'quality-assurance',
    'sm': 'scrum-master',
    'tech-writer': 'technical-writer',
    'quick-flow-solo-dev': 'quick-flow-solo-developer',
  };

  // Short-name aliases for selected specialists. slug -> alias command name.
  // Emits an extra `<alias>.md` alongside the canonical command.
  const SPECIALIST_ALIASES = { 'tech-writer': 'tech-writer' };

  let generated = 0;

  for (const mod of SPECIALIST_MODULES) {
    const agentsDir = path.join(ARCWRIGHT_SRC, mod, 'agents');
    if (!sourceExists(agentsDir)) continue;

    const agentFiles = [];
    (function collectMd(dir) {
      for (const entry of readSourceDirectory(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) collectMd(full);
        else if (entry.name.endsWith('.md')) agentFiles.push(full);
      }
    })(agentsDir);

    for (const agentPath of agentFiles) {
      const raw  = readSourceText(agentPath);
      const slug = path.basename(agentPath, '.md');
      const cmdName = COMMAND_NAME_MAP[slug] || slug;

      // Extract description from frontmatter or XML title tag
      const descMatch    = raw.match(/^description:\s*["']?(.+?)["']?\s*$/m);
      const xmlTitle     = raw.match(/<agent[^>]+title="([^"]+)"/);
      const xmlName      = raw.match(/<agent[^>]+name="([^"]+)"/);
      const desc = (descMatch?.[1] || xmlTitle?.[1] || xmlName?.[1] || `Arcwright ${slug} specialist`).trim();

      // Relative path from _arcwright/ root (handles subdirs like tech-writer/)
      const relFromArcwright = path.relative(ARCWRIGHT_SRC, agentPath).replace(/\\/g, '/');

      const body = [
        '---',
        `name: '${cmdName}'`,
        `description: ${JSON.stringify(desc)}`,
        '---',
        '',
        `Apply the ${slug} specialist role to the supplied task, following user and host instructions.`,
        '',
        '<agent-activation CRITICAL="TRUE">',
        `1. Resolve {project-root}/_arcwright/${relFromArcwright}, falling back to the installed global Arcwright module tree.`,
        '2. Read the profile and shared agent runtime once per task.',
        '3. Reuse the capability brief; load only relevant skills and references.',
        '4. Execute the supplied task immediately; use the relevant workflow without a menu round trip.',
        '5. Show a menu only when there is no actionable task or the user requests one.',
        '</agent-activation>',
        '',
        '$ARGUMENTS',
        '',
      ].join('\n');

      writeFile(path.join(commandsDest, `${cmdName}.md`), body);
      generated++;

      // Emit a short-name alias command if one is defined for this specialist.
      const alias = SPECIALIST_ALIASES[slug];
      if (alias && alias !== cmdName) {
        const aliasBody = body.replace(`name: '${cmdName}'`, `name: '${alias}'`);
        writeFile(path.join(commandsDest, `${alias}.md`), aliasBody);
        generated++;
      }
    }
  }

  console.log(`  ✓  ${generated} specialist slash commands → src/.claude/commands/`);
  console.log('');
}

// ─── Step 5: bundleLauncherTemplates ─────────────────────────────────────────

function bundleLauncherTemplates() {
  console.log('🔀  Bundling model-launcher templates → src/launchers/');

  const templatesSrc = path.join(PKG_DIR, 'lib', 'templates', 'launchers');
  const destDir = path.join(PKG_SRC, 'launchers');

  if (!sourceExists(templatesSrc)) {
    console.log('  ⚠  lib/templates/launchers/ not found — skipping');
    return;
  }

  const files = walk(templatesSrc, templatesSrc);
  let copied = 0;
  for (const { full, rel } of files) {
    if (isExcluded(rel)) continue;
    const dest = path.join(destDir, rel);
    const content = readText(full);
    if (content !== null) {
      writeFile(dest, content);
    } else {
      copyFile(full, dest);
    }
    copied++;
  }

  console.log(`  ✓  lib/templates/launchers/  (${copied} files)  → src/launchers/`);
  console.log('');
}

// ─── Step 6: verifyNoLeaks ────────────────────────────────────────────────────

/**
 * Every `references/…`, `templates/…` or `scripts/…` path a SKILL.md cites must
 * exist in that skill's directory.
 *
 * These are the sidecars a skill tells the agent to open mid-run, so a wrong
 * path fails at execution time, not at build time — which is how
 * excalidraw-diagram-generator shipped a manifest listing three
 * `templates/*.json` files that were actually `.excalidraw`, and python-backend
 * shipped a table pointing at four reference documents that were never written.
 *
 * Deliberately limited to those three directory names. `assets/` and `data/`
 * are excluded because skills legitimately cite paths there that their own
 * pipeline generates (scroll-world names the .webp/.mp4 files it will produce).
 */
function verifySkillReferences() {
  console.log('🔗  Verifying skill sidecar references...');
  const broken = [];
  const skillsBase = path.join(PKG_SRC, '.agents', 'skills');
  if (!sourceExists(skillsBase)) return;

  for (const skill of readSourceDirectory(skillsBase)) {
    const md = path.join(skillsBase, skill, 'SKILL.md');
    if (!sourceExists(md)) continue;
    const src = readSourceText(md);
    const re = /(?:^|[\s(`"'])((?:references|templates|scripts)\/[A-Za-z0-9._/-]+\.[A-Za-z0-9]+)/g;
    for (const m of src.matchAll(re)) {
      const rel = m[1];
      if (rel.includes('*')) continue;
      if (!sourceExists(path.join(skillsBase, skill, rel))) {
        broken.push(`${skill}: ${rel}`);
      }
    }
  }

  // Follow declared Markdown resources in sidecars too, including dependencies
  // on sibling skills. Ignore fenced examples: their paths describe output in
  // the user's project, rather than inputs that the package must provide.
  for (const { full, rel } of walk(skillsBase, skillsBase)) {
    if (!full.endsWith('.md')) continue;
    let fence;
    const prose = readSourceText(full).split(/\r?\n/).map(line => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = undefined;
        return '';
      }
      return fence ? '' : line;
    }).join('\n');
    const links = /!?\[[^\]\n]*\]\(\s*(<[^>\n]+>|[^)\s]+)(?:\s+"[^"\n]*")?\s*\)/g;
    for (const match of prose.matchAll(links)) {
      let target = match[1].replace(/^<|>$/g, '').split(/[?#]/)[0];
      if (!target || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('/') || /[{}<>*`]/.test(target)) continue;
      try { target = decodeURIComponent(target); } catch { /* use literal path */ }
      const resolved = target.startsWith('.agents/skills/')
        ? path.resolve(PKG_SRC, target)
        : path.resolve(path.dirname(full), target);
      const within = path.relative(skillsBase, resolved);
      if (within.startsWith(`..${path.sep}`) || path.isAbsolute(within)) continue;
      if (!sourceExists(resolved)) broken.push(`${rel}: ${target}`);
    }
  }

  const unique = [...new Set(broken)];
  if (unique.length) {
    console.error(`\n  ❌  SKILL REFERENCE CHECK FAILED — ${unique.length} broken path(s):\n`);
    for (const b of unique) console.error(`     ${b}`);
    console.error('\n  Fix the declared resource path or bundle the required dependency.\n');
    process.exit(1);
  }
  console.log('  ✓  All skill sidecar references resolve\n');
}

function verifyNoLeaks() {
  console.log('🔍  Verifying no Squidhub content leaks in src/...');

  const allFiles = walk(PKG_SRC, PKG_SRC);
  const leaks    = [];

  let scanned = 0;
  for (const { full, rel } of allFiles) {
    // Skip known-binary formats; scan everything else (see LEAK_SCAN_SKIP_EXTS).
    const ext = path.extname(full).toLowerCase();
    if (LEAK_SCAN_SKIP_EXTS.has(ext)) continue;

    const safeFull = assertSafeBuildInput(full);
    let content;
    try { content = fs.readFileSync(safeFull, 'utf8'); } catch { continue; }
    scanned++;

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

  // Report what was actually read, not the total walked — the old message
  // counted skipped binaries as "scanned".
  console.log(`  ✓  No leaks found (${scanned} of ${allFiles.length} files scanned; rest are binary)\n`);
}

// ─── Step 5b: bundleSkillCommands ─────────────────────────────────────────────
// Give every skill a /slash-command launcher so it is invocable that way on
// Claude Code, Kiro, and OpenCode. Hermes exposes each skill as /<skill> and
// Codex as $<skill> natively (the skill files themselves), so this only fills
// the gap for the command-file platforms. Hand-authored commands are never
// overwritten. Opt-in module skills (dotnet/electron/tauri/aws/unnamed-pm/docker,
// gated at install time) are skipped so a default install never ships a launcher
// whose skill is absent — those stay reachable via their module command (/dotnet
// etc.) and Hermes/Codex native invocation.
// team-* included: they drop out under --no-teams, so their launchers cannot ship unconditionally.
function bundleSkillCommands() {
  console.log('🎯  Generating per-skill slash-command launchers → src/.claude/commands/ + src/.kiro/agents/');
  const commandsDest   = path.join(PKG_SRC, '.claude', 'commands');
  const kiroAgentsDest = path.join(PKG_SRC, '.kiro', 'agents');
  fs.mkdirSync(commandsDest, { recursive: true });
  fs.mkdirSync(kiroAgentsDest, { recursive: true });

  const existingCmd  = new Set(fs.readdirSync(commandsDest).map(f => f.replace(/\.md$/, '')));
  const existingKiro = new Set(fs.readdirSync(kiroAgentsDest).map(f => f.replace(/\.json$/, '')));
  const aliases = loadSkillAliases(PROJECT_ROOT);

  const skillDirs = readSourceDirectory(SKILLS_SRC, { withFileTypes: true })
    .filter(e => e.isDirectory() && sourceExists(path.join(SKILLS_SRC, e.name, 'SKILL.md')))
    .map(e => e.name);

  let generated = 0;
  for (const skill of skillDirs) {
    if (metadataGate(skill)) continue;
    if (existingCmd.has(skill) && existingKiro.has(skill)) continue;

    const skillMd = readText(path.join(SKILLS_SRC, skill, 'SKILL.md')) || '';
    const commandSource = path.join(PROJECT_ROOT, '.claude', 'commands', `${skill}.md`);
    const maintainedCommand = sourceExists(commandSource) ? readSourceText(commandSource) : null;
    let desc = metadataDescription(maintainedCommand || skillMd, `Run the ${skill} skill.`);
    if (desc.length > 220) desc = desc.slice(0, 217) + '...';
    const needsDelegation = /^(arcwright|full-send|full-stop|review-loop|sol-loop|subagent-protocol|subagent-driven-development|pr-review-panel|agent-evaluation|agent-red-teaming|task-manager)$/.test(skill)
      || /^allowed-tools:.*\b(?:Agent|Task|SendMessage)\b/m.test(skillMd);

    if (!existingCmd.has(skill)) {
      const instruction = aliases[skill] ? 'Follow its Arcwright integration instructions.' : 'Follow the skill exactly.';
      const cmd = maintainedCommand || `---\ndescription: ${JSON.stringify(desc)}\n---\n\nLoad and run the \`${skill}\` skill (\`.agents/skills/${skill}/SKILL.md\`) against $ARGUMENTS. ${instruction}\n`;
      writeFile(path.join(commandsDest, `${skill}.md`), cmd);
    }
    if (!existingKiro.has(skill)) {
      const agent = {
        name: skill,
        description: desc,
        prompt: maintainedCommand
          ? adaptKiroContent(metadataBody(maintainedCommand)).replace(/\$ARGUMENTS\b/g, "the user's message").trim()
          : `Load and run the \`${skill}\` skill (skill://.kiro/skills/${skill}/SKILL.md) against the user's message. Follow the skill exactly.`,
        tools: ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', ...(needsDelegation ? ['subagent'] : []), ...(skill === 'arcwright' ? ['web_search', 'web_fetch'] : [])],
        includeMcpJson: true,
        resources: [`skill://.kiro/skills/${skill}/SKILL.md`],
      };
      writeFile(path.join(kiroAgentsDest, `${skill}.json`), JSON.stringify(agent, null, 2) + '\n');
    }
    generated++;
  }
  console.log(`  ✓  ${generated} skill launchers generated (Hermes /<skill> + Codex $<skill> are native)\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('🔨  Arcwright Build\n');

buildGenericPackage();
buildKiroAssets();
bundleKiroAgents();
bundleTrackCommands();
bundleSpecialistCommands();
bundleSkillCommands();
const invocationCatalog = buildInvocationCatalog(PKG_SRC);
verifyModelInvocation(PKG_SRC);
console.log(`  ✓  ${invocationCatalog.entries.length} command/agent/skill routes available through the portable arcwright skill\n`);
bundleLauncherTemplates();
verifySkillReferences();
verifyNoLeaks();

console.log('✅  Build complete!');
