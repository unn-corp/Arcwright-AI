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

  // ── Skill library catalog ─────────────────────────────────────────────────
  // Include skill names + descriptions so the AI knows what's available and
  // can auto-load the right skill when the user's request matches.
  const skillsDir = path.join(PROJECT_ROOT, '.agents', 'skills');
  if (fs.existsSync(skillsDir)) {
    const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();

    const skills = [];
    for (const dir of skillDirs) {
      const skillMd = path.join(skillsDir, dir, 'SKILL.md');
      if (!fs.existsSync(skillMd)) continue;
      const content = fs.readFileSync(skillMd, 'utf8');
      // Extract description — handle single-line and multi-line YAML
      let desc = null;
      const singleLine = content.match(/^---[\s\S]*?description:\s*["']([^"'\n]+)["']/m);
      if (singleLine) { desc = singleLine[1].trim(); }
      else {
        const unquoted = content.match(/^---[\s\S]*?description:\s*([^\n"'][^\n]+)/m);
        if (unquoted) desc = unquoted[1].trim();
      }
      // Multi-line description (indented continuation)
      if (!desc) {
        const multiLine = content.match(/^---[\s\S]*?description:\s*\n((?:\s+[^\n]+\n?)+)/m);
        if (multiLine) desc = multiLine[1].replace(/\n\s*/g, ' ').trim();
      }
      if (desc) skills.push({ name: dir, desc });
    }

    if (skills.length > 0) {
      lines.push('## Skill Library');
      lines.push('');
      lines.push('The following skills are available in `.kiro/skills/` (Kiro) or `.agents/skills/` (Claude Code). Read the SKILL.md file to load a skill when the task matches its description.');
      lines.push('');
      lines.push('| Skill | Description |');
      lines.push('|-------|-------------|');
      for (const { name, desc } of skills) {
        // Truncate long descriptions for the table
        const shortDesc = desc.length > 150 ? desc.substring(0, 147) + '...' : desc;
        lines.push(`| \`${name}\` | ${shortDesc} |`);
      }
      lines.push('');
    }
  }

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
  const lines = [
    '---',
    'inclusion: auto',
    'name: arcwright-workflows',
    'description: Arcwright workflow guidance — triage router, ultracode dynamic workflows, and /goal loops.',
    '---',
    '',
    '# Arcwright — Workflows',
    '',
    'Arcwright has moved off bespoke tracks and pane-based subagent spawning.',
    'Pick the right runtime for the task; the in-process `Agent` tool +',
    '`SendMessage` reuse is the substrate underneath every option below.',
    '',
    '## 1. Triage router (entry point)',
    '',
    '`/triage` is the workflow router. Given a task it recommends one of the',
    'three runtimes below (or, on top of any of them, Herdr opt-in visibility).',
    'See `.agents/skills/triage/SKILL.md` for the full decision tree. Use it',
    'when the user has not named a runtime explicitly.',
    '',
    'Output format: a runtime, the exact trigger to run, a one-sentence',
    'rationale, the default model (`sonnet`), and a "next step" line. The',
    'router does not start the work — the user runs the trigger.',
    '',
    '## 2. The three runtimes',
    '',
    '| Runtime | When | Trigger |',
    '|---------|------|---------|',
    '| Plain in-process agent(s) | 1–10 files, single role or small parallel fan-out, clear deliverable | Direct `Agent` tool spawn (one or a few, in one assistant message) |',
    '| `ultracode` dynamic workflow | 12+ files, multi-stage, unknown-size discovery, or work larger than one context | `ultracode <describe the work>` (or `/effort ultracode` for session default) |',
    '| `/goal` loop | Completion is a verification check ("tests pass", "no type errors", "lint clean") | `/goal <condition>` |',
    '',
    'In-process is the default for every runtime. Herdr is **opt-in visibility**',
    'only — the pane mirrors the in-process session; the in-process flow inside',
    'it is still governed by `.agents/skills/claude-subagent-protocol/`.',
    '',
    '## 3. Herdr opt-in visibility (additive)',
    '',
    'Add Herdr pane visibility only when **all** of these are true:',
    '',
    '- The user has explicitly asked to watch the agents as they work.',
    '- `$HERDR_ENV` is set in the current shell.',
    '- The recommended runtime would benefit from pane-by-pane view (typical',
    '  for `ultracode` and `/goal` over a long duration).',
    '',
    'See `.agents/skills/herdr/SKILL.md`, "Watching agents in panes" section.',
    'The pane is a viewing surface, never the spawn mechanism.',
    '',
    '## 4. Defaults and the permission gate',
    '',
    '- **Model:** `sonnet` for every role. `opus` is opt-in; the orchestrator',
    '  (or skill) must ask the user before escalating. No version-pinned model',
    '  names — use aliases only.',
    '- **Reuse over re-spawn:** the Session Agent Registry in',
    '  `_arcwright-output/sessions/<session-id>/agent-registry.md` records each',
    "  role's `agentId`. Subsequent tasks for the same role use `SendMessage`",
    '  to the existing agent; full prior context is retained.',
    '- **No legacy signals:** `AGENT_SIGNAL`, `STEP COMPLETE`, `PEER_SIGNAL`,',
    '  `STATUS_CHECK`, `$SPAWNER_PANE`, the old `tmux-protocol` skill, and',
    '  `session-state.md` pane tables are all retired. The `Agent` tool return',
    '  value is the sole completion signal.',
    '',
    '## 5. Cross-references',
    '',
    '- `.agents/skills/triage/SKILL.md` — the router (decision tree, output format).',
    '- `.agents/skills/claude-subagent-protocol/SKILL.md` — the in-process protocol underneath every runtime.',
    '- `.agents/skills/herdr/SKILL.md` — pane mechanics and opt-in visibility.',
    '- `docs/dev/claude-code-patterns/ultracode.md` — full ultracode API (hooks, patterns, limits, resume).',
    '- `docs/dev/claude-code-patterns/orchestration.md` — full `/goal` and `/loop` reference.',
    '',
  ];

  const dest = path.join(steeringDir, 'arcwright-workflows.md');
  writeFile(dest, lines.join('\n'));
  console.log(`  ✓  .kiro/steering/arcwright-workflows.md  (workflow-router / ultracode / /goal guidance)`);
}

// ─── Step 2b: bundleKiroAgents ───────────────────────────────────────────────

/**
 * Read each .claude/commands/*.md and write a Kiro-compatible agent JSON file
 * at src/.kiro/agents/{name}.json. Also generates specialist agent stubs from
 * _arcwright/awm/agents/ so the subagent tool's `role` field can reference them.
 */
function bundleKiroAgents() {
  const commandsSrc  = path.join(PROJECT_ROOT, '.claude', 'commands');
  const agentsDest   = path.join(PKG_SRC, '.kiro', 'agents');

  if (!fs.existsSync(commandsSrc)) {
    console.log('  ⚠  .claude/commands/ not found — skipping Kiro agents');
    return;
  }

  fs.mkdirSync(agentsDest, { recursive: true });

  const cmdFiles = fs.readdirSync(commandsSrc)
    .filter(f => SHIPPED_COMMANDS.some(re => re.test(f)))
    .sort();

  if (!cmdFiles.length) {
    console.log('  ⚠  No slash command files found — skipping Kiro agents');
    return;
  }

  /** Parse YAML frontmatter from a markdown file. */
  function parseFrontmatter(content) {
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!fmMatch) return { description: null, body: content };
    const fmBlock = fmMatch[1];
    const body    = fmMatch[2];
    const descMatch = fmBlock.match(/^description:\s*["']?(.*?)["']?\s*$/m);
    return { description: descMatch ? descMatch[1].trim() : null, body };
  }

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
    'design':             ['fs_read', 'fs_write', 'grep', 'glob', 'web_search', 'web_fetch'],
    'playwright':         ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob'],
    'audit-site':         ['fs_read', 'fs_write', 'execute_bash', 'web_search', 'web_fetch'],
    'diagram':            ['fs_read', 'fs_write', 'grep', 'glob'],
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

## Kiro CLI — In-Process Orchestration (default) and Pane Visibility (opt-in)

**Default — in-process via the \`subagent\` tool:**

Kiro CLI's \`subagent\` tool runs agents in-process as a DAG pipeline. This is
the default and is equivalent to Claude Code's \`Agent\` tool + \`SendMessage\`
reuse. For each role in the pipeline, reference a Kiro agent config by name in
the \`role\` field (e.g. \`arcwright-dev\`, \`arcwright-qa\`); available agents
are listed in this agent's \`toolsSettings.crew.availableAgents\`.

\`\`\`json
{
  "name": "subagent",
  "input": {
    "task": "<task description>",
    "stages": [
      { "name": "research", "role": "arcwright-analyst", "prompt_template": "…", "model": "sonnet" },
      { "name": "design",   "role": "arcwright-architect", "prompt_template": "…", "model": "sonnet", "depends_on": ["research"] },
      { "name": "build",    "role": "arcwright-dev",        "prompt_template": "…", "model": "sonnet", "depends_on": ["design"] }
    ]
  }
}
\`\`\`

Stages with no \`depends_on\` run in parallel; dependent stages wait. Default
\`model\` is \`sonnet\` for every stage. Promote to \`opus\` only with explicit
user permission (ask the user before escalating).

**Opt-in — visible panes via Herdr:**

If the user has explicitly asked for split-pane visibility ("spawn", "watch",
"open agent") AND \`$HERDR_ENV\` is set, spawn a Kiro agent into a Herdr pane as
a *viewing surface*. Herdr makes visible agents first-class through
\`herdr agent start\`, so no spawn wrapper is needed. The spawned agent still
uses the in-process \`subagent\` orchestration above; the pane is only a window.

\`\`\`bash
herdr agent start <role> --split right -- \\
  kiro-cli chat --trust-all-tools --agent arcwright-dev '<task description>'
# then, when it needs you:
herdr wait agent-status <role> --status blocked --timeout 600000
herdr pane run <role> '<follow-up>'      # types + Enter (agent send does NOT)
herdr pane close <role>
\`\`\`

**Key differences from Claude Code pane mode (opt-in only):**
- Use \`kiro-cli chat --trust-all-tools --agent <agent-name>\` instead of \`claude --dangerously-skip-permissions\`
- Agent names reference \`.kiro/agents/*.json\` configs (e.g. \`arcwright-dev\`, \`arcwright-qa\`)
- Skills are at \`.kiro/skills/\` not \`.agents/skills/\`
- \`herdr wait agent-status\` replaces all pane polling; there are no AGENT_SIGNAL
  strings to grep. The in-process \`subagent\` tool return value is the completion signal.
- Default to \`sonnet\`. Ask the user before any \`opus\` or effort upgrade.

See the \`herdr\` skill for the full mapping and the send/run Enter trap.
`;

  let generated = 0;
  for (const fname of cmdFiles) {
    const srcPath  = path.join(commandsSrc, fname);
    const name     = fname.replace(/\.md$/, '');
    const raw      = fs.readFileSync(srcPath, 'utf8');
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
  ].filter(d => fs.existsSync(d));
  let specialists = 0;
  if (specialistAgentDirs.length) {
    const agentFiles = [];
    for (const d of specialistAgentDirs) {
      (function collectMd(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
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
      const raw = fs.readFileSync(agentPath, 'utf8');
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
 * SHIPPED_COMMANDS is a hand-maintained allowlist, so a new command silently
 * fails to publish if someone forgets step 2 of the CLAUDE.md procedure. That
 * already happened once: /security-scan shipped nowhere for its whole life
 * because the commit that added it never touched this list, and nothing
 * complained. Fail the build on an uncovered command instead — being
 * deliberately unpublished now requires saying so out loud.
 */
function verifyCommandCoverage() {
  const commandsSrc = path.join(PROJECT_ROOT, '.claude', 'commands');
  if (!fs.existsSync(commandsSrc)) return;

  const files = fs.readdirSync(commandsSrc).filter(f => f.endsWith('.md'));
  const uncovered = files.filter(
    f => !SHIPPED_COMMANDS.some(re => re.test(f)) && !(f in UNSHIPPED_COMMANDS)
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

  if (!fs.existsSync(commandsSrc)) {
    console.log('  ⚠  .claude/commands/ not found — skipping');
    return;
  }

  // Bundle all slash commands: arcwright-migrate, herdr, gsudo, and utility commands
  // (track commands removed in stage 1; the function name is kept for continuity)
  const cmdFiles = fs.readdirSync(commandsSrc)
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
    if (!fs.existsSync(agentsDir)) continue;

    const agentFiles = [];
    (function collectMd(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) collectMd(full);
        else if (entry.name.endsWith('.md')) agentFiles.push(full);
      }
    })(agentsDir);

    for (const agentPath of agentFiles) {
      const raw  = fs.readFileSync(agentPath, 'utf8');
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
        `description: '${desc.replace(/'/g, "\\'")}'`,
        '---',
        '',
        `You must fully embody the ${slug} specialist persona and follow all activation instructions exactly. NEVER break character until given an exit command.`,
        '',
        '<agent-activation CRITICAL="TRUE">',
        `1. LOAD the FULL agent file from {project-root}/_arcwright/${relFromArcwright}`,
        '2. READ its entire contents',
        '3. EXECUTE every critical_action in order (load all sidecar files)',
        '4. PRESENT the agent menu',
        '5. WAIT for user input',
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

  if (!fs.existsSync(templatesSrc)) {
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
  if (!fs.existsSync(SKILLS_SRC)) return;

  for (const skill of fs.readdirSync(SKILLS_SRC)) {
    const md = path.join(SKILLS_SRC, skill, 'SKILL.md');
    if (!fs.existsSync(md)) continue;
    const src = fs.readFileSync(md, 'utf8');
    const re = /(?:^|[\s(`"'])((?:references|templates|scripts)\/[A-Za-z0-9._/-]+\.[A-Za-z0-9]+)/g;
    for (const m of src.matchAll(re)) {
      const rel = m[1];
      if (rel.includes('*')) continue;
      if (!fs.existsSync(path.join(SKILLS_SRC, skill, rel))) {
        broken.push(`${skill}: ${rel}`);
      }
    }
  }

  const unique = [...new Set(broken)];
  if (unique.length) {
    console.error(`\n  ❌  SKILL REFERENCE CHECK FAILED — ${unique.length} broken path(s):\n`);
    for (const b of unique) console.error(`     ${b}`);
    console.error('\n  Fix the path in SKILL.md, or add the missing file.\n');
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

    let content;
    try { content = fs.readFileSync(full, 'utf8'); } catch { continue; }
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
const MODULE_GATED_SKILL = /^(team-|docker-type-check$|dotnet-|electron-|tauri-|strands-|aws-serverless-cdk$|unnamed-pm-sync$|unnamed-dev-mcp$)/;

function extractSkillDescription(skillMd, skill) {
  const fallback = `Load and run the ${skill} skill.`;
  const frontmatter = skillMd.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatter) return fallback;

  const lines = frontmatter[1].split(/\r?\n/);
  const descriptionIndex = lines.findIndex((line) => /^description:\s*/.test(line));
  if (descriptionIndex === -1) return fallback;
  const value = lines[descriptionIndex].replace(/^description:\s*/, '').trim();
  if (['>', '|', '>-', '|-'].includes(value)) {
    const folded = [];
    for (const line of lines.slice(descriptionIndex + 1)) {
      if (!/^\s+/.test(line)) break;
      folded.push(line.trim());
    }
    return folded.join(' ').trim() || fallback;
  }
  return value.replace(/^(?:"|')|(?:"|')$/g, '').trim() || fallback;
}

function bundleSkillCommands() {
  console.log('🎯  Generating per-skill slash-command launchers → src/.claude/commands/ + src/.kiro/agents/');
  const commandsDest   = path.join(PKG_SRC, '.claude', 'commands');
  const kiroAgentsDest = path.join(PKG_SRC, '.kiro', 'agents');
  fs.mkdirSync(commandsDest, { recursive: true });
  fs.mkdirSync(kiroAgentsDest, { recursive: true });

  const existingCmd  = new Set(fs.readdirSync(commandsDest).map(f => f.replace(/\.md$/, '')));
  const existingKiro = new Set(fs.readdirSync(kiroAgentsDest).map(f => f.replace(/\.json$/, '')));

  const skillDirs = fs.readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter(e => e.isDirectory() && fs.existsSync(path.join(SKILLS_SRC, e.name, 'SKILL.md')))
    .map(e => e.name);

  let generated = 0;
  for (const skill of skillDirs) {
    if (MODULE_GATED_SKILL.test(skill)) continue;
    if (existingCmd.has(skill) && existingKiro.has(skill)) continue;

    const skillMd = readText(path.join(SKILLS_SRC, skill, 'SKILL.md')) || '';
    let desc = extractSkillDescription(skillMd, skill);
    if (desc.length > 220) desc = desc.slice(0, 217) + '...';

    if (!existingCmd.has(skill)) {
      const cmd = `---\ndescription: ${JSON.stringify(desc)}\n---\n\nLoad and run the \`${skill}\` skill (\`.agents/skills/${skill}/SKILL.md\`) against $ARGUMENTS. Follow the skill exactly.\n`;
      writeFile(path.join(commandsDest, `${skill}.md`), cmd);
    }
    if (!existingKiro.has(skill)) {
      const agent = {
        name: skill,
        description: desc,
        prompt: `Load and run the \`${skill}\` skill (skill://.kiro/skills/${skill}/SKILL.md) against the user's message. Follow the skill exactly.`,
        tools: ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob'],
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
bundleLauncherTemplates();
verifySkillReferences();
verifyNoLeaks();

console.log('✅  Build complete!');
