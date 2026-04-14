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

/** Slash command files to ship. Shared by bundleKiroAgents() and bundleTrackCommands(). */
const SHIPPED_COMMANDS = [
  /^arcwright-track-.*\.md$/,
  /^arcwright-migrate\.md$/,
  /^tmux\.md$/,
  /^gsudo\.md$/,
  /^team\.md$/,
  /^dry\.md$/,
  /^dry-loop\.md$/,
  /^ux-audit\.md$/,
  /^ux-loop\.md$/,
  /^security-review\.md$/,
  /^sec-loop\.md$/,
  /^design\.md$/,
  /^playwright\.md$/,
  /^audit-site\.md$/,
  /^diagram\.md$/,
  /^triage\.md$/,
  /^docker-check\.md$/,
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


// ─── Kiro adaptation helpers (module-scope, shared by buildKiroAssets + bundleKiroAgents) ──

/**
 * Adapt text content for Kiro CLI:
 * - Rewrite .agents/skills/ → .kiro/skills/
 * - Rewrite .claude/commands/ → .kiro/agents/
 * - Replace `claude --dangerously-skip-permissions` with `kiro-cli chat --trust-all-tools --agent`
 * - Strip bare --dangerously-skip-permissions
 */
function adaptContentForKiro(text) {
  let p = text;
  p = p.replace(/\.agents\/skills\//g, '.kiro/skills/');
  p = p.replace(/\.claude\/commands\//g, '.kiro/agents/');
  p = p.replace(
    /claude\s+--dangerously-skip-permissions/g,
    'kiro-cli chat --trust-all-tools --agent'
  );
  p = p.replace(/,?\s*--dangerously-skip-permissions/g, '');
  return p;
}

/**
 * Full adaptation for agent prompts (extends adaptContentForKiro with $ARGUMENTS handling).
 */
function adaptPromptForKiro(body) {
  let p = adaptContentForKiro(body);
  p = p.replace(
    /`?\$ARGUMENTS`?/g,
    '(the user\'s request — provided in their message)'
  );
  return p;
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
 * Optional transform function applied to text content (used for Kiro path adaptation).
 * Returns count of files copied.
 */
function copySkillsTo(destBase, logLabel, transform) {
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
        writeFile(dest, transform ? transform(content) : content);
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

  // 2a. Copy .agents/skills/ → src/.kiro/skills/, rewriting paths/CLI refs for Kiro
  const kiroSkillsDest = path.join(PKG_SRC, '.kiro', 'skills');
  const skillsCopied   = copySkillsTo(kiroSkillsDest, 'src/.kiro/skills/', adaptContentForKiro);

  // 2b. Generate steering docs in src/.kiro/steering/
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
  lines.push('Slash commands in `.claude/commands/arcwright-track-*.md` activate the master orchestrator with a pre-selected workflow track.');
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
 * Walk awm/workflows/ and core/workflows/ subdirectories and generate a
 * reference steering doc. Each subdirectory is a workflow; we read its
 * README.md, workflow.yaml, or first .md file to extract a title.
 */
function generateWorkflowsSteering(steeringDir) {
  const workflowDirs = [
    { label: 'awm/workflows',  dir: path.join(ARCWRIGHT_SRC, 'awm',  'workflows') },
    { label: 'core/workflows', dir: path.join(ARCWRIGHT_SRC, 'core', 'workflows') },
  ];

  const lines = [
    '---',
    'inclusion: auto',
    'name: arcwright-workflows',
    'description: Arcwright workflow tracks, task sizing, and orchestration guidance. Loaded when users ask about workflows, tracks, or task complexity.',
    '---',
    '',
    '# Arcwright — Available Workflows',
    '',
    'Arcwright provides structured workflow tracks for different task scales.',
    '',
  ];

  let total = 0;

  /** Try to extract a human title from a workflow directory. */
  function getWorkflowTitle(workflowDir, dirName) {
    // Try README.md first
    const candidates = ['README.md', 'workflow.yaml', 'workflow.yml'];
    for (const candidate of candidates) {
      const candidatePath = path.join(workflowDir, candidate);
      if (fs.existsSync(candidatePath)) {
        const content = fs.readFileSync(candidatePath, 'utf8');
        const heading  = content.match(/^#\s+(.+)/m);
        if (heading) return heading[1].trim();
        const yamlName = content.match(/^name:\s*["']?([^"'\n]+)/m);
        if (yamlName) return yamlName[1].trim();
        const yamlTitle = content.match(/^title:\s*["']?([^"'\n]+)/m);
        if (yamlTitle) return yamlTitle[1].trim();
        const yamlDesc = content.match(/^description:\s*["']?([^"'\n]+)/m);
        if (yamlDesc) return yamlDesc[1].trim();
      }
    }
    // Fallback: try the first .md file in the directory
    const mdFiles = fs.readdirSync(workflowDir).filter(f => f.endsWith('.md')).sort();
    if (mdFiles.length > 0) {
      const content = fs.readFileSync(path.join(workflowDir, mdFiles[0]), 'utf8');
      const heading = content.match(/^#\s+(.+)/m);
      if (heading) return heading[1].trim();
    }
    // Last resort: title-case the directory name
    return dirName.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  for (const { label, dir } of workflowDirs) {
    if (!fs.existsSync(dir)) {
      lines.push(`## ${label}`, '', '_Directory not found._', '');
      continue;
    }

    // List subdirectories — each is a workflow
    const subdirs = fs.readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .sort();

    lines.push(`## ${label}`);
    lines.push('');

    if (!subdirs.length) {
      lines.push('_No workflow directories found._');
      lines.push('');
      continue;
    }

    for (const dirName of subdirs) {
      const workflowDir = path.join(dir, dirName);
      const title = getWorkflowTitle(workflowDir, dirName);
      lines.push(`- **\`${dirName}/\`** — ${title}`);
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
    'arcwright-track':    ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code', 'web_search', 'web_fetch', 'subagent', 'knowledge'],
    'team':               ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code', 'subagent', 'knowledge'],
    'arcwright-migrate':  ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob'],
    'dry':                ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'ux-audit':           ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code', 'web_search', 'web_fetch'],
    'ux-loop':            ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code', 'web_search', 'web_fetch'],
    'security-review':    ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'sec-loop':           ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'],
    'design':             ['fs_read', 'fs_write', 'grep', 'glob', 'web_search', 'web_fetch'],
    'playwright':         ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob'],
    'audit-site':         ['fs_read', 'fs_write', 'execute_bash', 'web_search', 'web_fetch'],
    'diagram':            ['fs_read', 'fs_write', 'grep', 'glob'],
    'triage':             ['fs_read', 'grep', 'glob', 'code'],
    'docker-check':       ['fs_read', 'execute_bash', 'grep'],
    'tmux':               ['fs_read', 'fs_write', 'execute_bash'],
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
  };

  function resolveTools(name) {
    for (const [pattern, toolList] of Object.entries(KIRO_TOOLS_BY_PATTERN)) {
      if (name.startsWith(pattern) || name === pattern) return toolList;
    }
    return ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code'];
  }

  const isTrackOrTeam = (name) =>
    name.startsWith('arcwright-track') || name === 'team';

  /** Specialist agent names for toolsSettings.crew */
  const SPECIALIST_AGENTS = [
    'arcwright-analyst', 'arcwright-architect', 'arcwright-dev', 'arcwright-pm',
    'arcwright-qa', 'arcwright-quick-flow-solo-dev', 'arcwright-review-orchestrator',
    'arcwright-sm', 'arcwright-tech-writer', 'arcwright-ux-designer',
  ];

  /** Kiro-specific tmux addendum appended to track/team agent prompts */
  const KIRO_TMUX_ADDENDUM = `

## Kiro CLI — Split-Pane Mode (tmux)

When \`$TMUX\` is set, Kiro CLI can orchestrate split-pane agent workflows via \`execute_bash\`.

**Spawning a Kiro agent in a new tmux pane:**
\`\`\`bash
SPAWNER_PANE=$(tmux display-message -p "#{pane_id}")
tmux split-window -h -c "#{pane_current_path}" \\
  "kiro-cli chat --trust-all-tools --agent arcwright-dev 'Your task: <task description>. Master pane: $SPAWNER_PANE. Report back with: tmux send-keys -t $SPAWNER_PANE \\"AGENT_SIGNAL::TASK_DONE::<role>::<task_id>::<status>::<summary>\\" Enter'"
sleep 8
NEW_PANE=$(tmux list-panes -F "#{pane_id}" | tail -1)
tmux select-layout tiled
\`\`\`

**Key differences from Claude Code split-pane mode:**
- Use \`kiro-cli chat --trust-all-tools --agent <agent-name>\` instead of \`claude --dangerously-skip-permissions\`
- Agent names reference \`.kiro/agents/*.json\` configs (e.g. \`arcwright-dev\`, \`arcwright-qa\`)
- Skills are at \`.kiro/skills/\` not \`.agents/skills/\`
- The AGENT_SIGNAL protocol, message delivery verification, and pane close sequence from the \`tmux-protocol\` skill all apply identically

**When \`$TMUX\` is NOT set:** Use the \`subagent\` tool for in-process multi-agent pipelines instead. See the Non-tmux Variant section in each track skill.
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

    // Append tmux addendum to track and team agents
    if (isTrackOrTeam(name)) {
      prompt += KIRO_TMUX_ADDENDUM;
    }

    const agent = { name, description: desc, prompt, tools };

    // Track and team agents get read-only tools auto-approved, skill resources, and crew config
    if (isTrackOrTeam(name)) {
      agent.allowedTools = ['fs_read', 'grep', 'glob', 'code', 'knowledge', 'web_search', 'web_fetch'];
      agent.resources = [
        'skill://.kiro/skills/**/SKILL.md',
        'file://_arcwright/core/agents/arcwright-master.md',
      ];
      agent.toolsSettings = {
        crew: {
          availableAgents: SPECIALIST_AGENTS,
        },
      };
    }

    writeFile(path.join(agentsDest, `${name}.json`), JSON.stringify(agent, null, 2) + '\n');
    generated++;
  }

  // ── Generate specialist agent stubs from _arcwright/awm/agents/ ───────────
  const awmAgentsDir = path.join(ARCWRIGHT_SRC, 'awm', 'agents');
  let specialists = 0;
  if (fs.existsSync(awmAgentsDir)) {
    const agentFiles = [];
    (function collectMd(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) collectMd(path.join(dir, entry.name));
        else if (entry.name.endsWith('.md')) agentFiles.push(path.join(dir, entry.name));
      }
    })(awmAgentsDir);

    for (const agentPath of agentFiles) {
      const raw = fs.readFileSync(agentPath, 'utf8');
      const slug = path.basename(agentPath, '.md');
      const kiroName = `arcwright-${slug}`;

      const descMatch = raw.match(/^---[\s\S]*?description:\s*["']?(.+?)["']?\s*$/m);
      const desc = descMatch ? descMatch[1].trim() : `Arcwright ${slug} agent`;

      const relFromArcwright = path.relative(ARCWRIGHT_SRC, agentPath).replace(/\\/g, '/');

      const agent = {
        name: kiroName,
        description: desc,
        prompt: `file://_arcwright/${relFromArcwright}`,
        tools: ['fs_read', 'fs_write', 'execute_bash', 'grep', 'glob', 'code', 'web_search', 'web_fetch', 'knowledge'],
        allowedTools: ['fs_read', 'grep', 'glob', 'code', 'knowledge'],
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

function bundleTrackCommands() {
  console.log('🗂️   Bundling slash commands → src/.claude/commands/');

  const commandsSrc  = path.join(PROJECT_ROOT, '.claude', 'commands');
  const commandsDest = path.join(PKG_SRC, '.claude', 'commands');

  if (!fs.existsSync(commandsSrc)) {
    console.log('  ⚠  .claude/commands/ not found — skipping');
    return;
  }

  // Bundle all slash commands: arcwright-track-*, arcwright-migrate, tmux, gsudo, and utility commands
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

// ─── Step 4: bundleTmuxSetup ──────────────────────────────────────────────────

function bundleTmuxSetup() {
  console.log('⌨️   Bundling tmux setup → src/tmux/');

  // Single source of truth: packages/tmux-setup/src/tmux/
  const tmuxSrc = path.join(PROJECT_ROOT, 'packages', 'tmux-setup', 'src', 'tmux');
  const destDir = path.join(PKG_SRC, 'tmux');

  if (!fs.existsSync(tmuxSrc)) {
    console.log('  ⚠  packages/tmux-setup/src/tmux/ not found — skipping tmux bundle');
    return;
  }

  const files = walk(tmuxSrc, tmuxSrc);
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

  console.log(`  ✓  packages/tmux-setup/src/tmux/  (${copied} files)  → src/tmux/`);
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
bundleKiroAgents();
bundleTrackCommands();
bundleTmuxSetup();
verifyNoLeaks();

console.log('✅  Build complete!');
