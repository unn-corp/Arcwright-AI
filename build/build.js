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
 * Read each .claude/commands/*.md and write a Kiro-compatible subagent file
 * at src/.kiro/agents/{name}.md with name+description frontmatter.
 * Body is identical to the Claude slash command body.
 */
function bundleKiroAgents() {
  const commandsSrc  = path.join(PROJECT_ROOT, '.claude', 'commands');
  const agentsDest   = path.join(PKG_SRC, '.kiro', 'agents');

  if (!fs.existsSync(commandsSrc)) {
    console.log('  ⚠  .claude/commands/ not found — skipping Kiro agents');
    return;
  }

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
  ];

  const cmdFiles = fs.readdirSync(commandsSrc)
    .filter(f => SHIPPED_COMMANDS.some(re => re.test(f)))
    .sort();

  if (!cmdFiles.length) {
    console.log('  ⚠  No slash command files found — skipping Kiro agents');
    return;
  }

  fs.mkdirSync(agentsDest, { recursive: true });

  /**
   * Parse YAML frontmatter from a markdown file.
   * Returns { description, body } where body is everything after the closing ---.
   */
  function parseFrontmatter(content) {
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!fmMatch) {
      // No frontmatter — body is the whole file
      return { description: null, body: content };
    }
    const fmBlock = fmMatch[1];
    const body    = fmMatch[2];

    // Extract description field (handles quoted and unquoted values)
    const descMatch = fmBlock.match(/^description:\s*["']?(.*?)["']?\s*$/m);
    const description = descMatch ? descMatch[1].trim() : null;

    return { description, body };
  }

  /**
   * Kiro subagent tool declarations (confirmed from https://kiro.dev/docs/chat/subagents/)
   * Kiro does NOT have a "useSubagent" tool. Subagent delegation happens via:
   *   - Direct prompt instruction: "Use the <name> subagent to..."
   *   - Slash command invocation: /<name> [task]
   * The `tools` frontmatter field controls which tools the subagent can access.
   *
   * Track commands need broad access (read, write, shell) since they orchestrate
   * multi-step flows. Utility commands get more restricted access.
   */
  const TOOLS_BY_PATTERN = {
    'arcwright-track':    ['read', 'write', 'shell', 'web', '@builtin'],
    'team':               ['read', 'write', 'shell', '@builtin'],
    'arcwright-migrate':  ['read', 'write', 'shell'],
    'dry':                ['read', 'write', 'shell'],
    'ux-audit':           ['read', 'write', 'shell', 'web'],
    'ux-loop':            ['read', 'write', 'shell', 'web'],
    'security-review':    ['read', 'write', 'shell'],
    'sec-loop':           ['read', 'write', 'shell'],
    'design':             ['read', 'write', 'web'],
    'playwright':         ['read', 'write', 'shell'],
    'audit-site':         ['read', 'write', 'web'],
    'diagram':            ['read', 'write'],
    'triage':             ['read'],
    'docker-check':       ['read', 'shell'],
    'tmux':               ['read', 'write', 'shell'],
    'gsudo':              ['shell'],
  };

  /**
   * Subagent delegation note added to track and team commands.
   * Kiro's delegation model: instruct the model to invoke named subagents
   * via natural language or slash commands — no special tool required.
   */
  const SUBAGENT_DELEGATION_BODY = `
## Subagent Delegation

This agent orchestrates specialist subagents. In Kiro, delegation works by
instructing the model to use a named subagent:

- Type: "Use the arcwright-dev subagent to implement the feature"
- Or use a slash command directly: \`/arcwright-dev [task]\`

Available specialist subagents (installed to \`.kiro/agents/\`):
- \`arcwright-analyst\` — requirements elicitation, research
- \`arcwright-architect\` — system design, technical decisions
- \`arcwright-dev\` — implementation
- \`arcwright-pm\` — product management, PRDs
- \`arcwright-qa\` — testing, validation
- \`arcwright-sm\` — scrum master, sprint management
- \`arcwright-tech-writer\` — documentation
- \`arcwright-ux-designer\` — interface design, accessibility

Delegate each stage of the workflow to the appropriate specialist rather than
doing all work in a single agent context.
`;

  function resolveTools(name) {
    for (const [pattern, toolList] of Object.entries(TOOLS_BY_PATTERN)) {
      if (name.startsWith(pattern) || name === pattern) {
        return toolList;
      }
    }
    return ['read', 'write', 'shell'];
  }

  const isTrackOrTeam = (name) =>
    name.startsWith('arcwright-track') || name === 'team';

  let generated = 0;
  for (const fname of cmdFiles) {
    const srcPath  = path.join(commandsSrc, fname);
    const name     = fname.replace(/\.md$/, '');
    const raw      = fs.readFileSync(srcPath, 'utf8');

    const { description, body } = parseFrontmatter(raw);

    // Fallback: extract description from first heading subtitle (## line)
    let desc = description;
    if (!desc) {
      const headingMatch = body.match(/^##\s+(.+)/m);
      desc = headingMatch ? headingMatch[1].trim() : `Arcwright slash command: ${name}`;
    }

    const tools = resolveTools(name);
    const toolsYaml = `tools: [${tools.join(', ')}]`;
    const delegationSection = isTrackOrTeam(name) ? SUBAGENT_DELEGATION_BODY : '';

    const kiroContent = `---\nname: ${name}\ndescription: ${desc}\n${toolsYaml}\n---\n\n${body.trimStart()}${delegationSection}`;
    writeFile(path.join(agentsDest, fname), kiroContent);
    generated++;
  }

  console.log(`  ✓  .kiro/agents/  (${generated} subagents generated) → src/.kiro/agents/`);
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
  ];

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
