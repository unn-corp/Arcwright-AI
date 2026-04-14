#!/usr/bin/env node
/**
 * @arcwright-ai/agent-orchestration — lib/migrate.js
 *
 * Migration script: renames bmad → arcwright across a project.
 *
 * Renames directories, files, and content references from the old bmad
 * naming convention to the new arcwright convention.
 *
 * Usage:
 *   node migrate.js [--dry-run] [--project-root /path/to/project]
 *
 * What it does:
 *   1. Renames directories:  _bmad → _arcwright, _bmad-output → _arcwright-output,
 *      _bmad_output → _arcwright-output, bmm → awm, bmb → awb, bmb-creations → awb-creations
 *   2. Renames files:  bmad-track-*.md → arcwright-track-*.md in .claude/commands/
 *   3. Deletes obsolete .claude/commands/ (bmad-agent-*, bmad-bmm-*, bmad-bmb-*, bmad-help.md, etc.)
 *   4. Replaces content references in config/yaml/md files
 *   5. Removes _arcwright/_config/ (no longer used); preserves *.customize.yaml overlays
 *
 * Always run with --dry-run first to preview changes.
 *
 * Known limitation (#6): Custom agents under _bmad/agents/ that users created themselves
 * may need manual path fixes after migration. The migration only rewrites stock bmad paths.
 * If your agent's `id:` frontmatter referenced `_bmad/agents/yourname/yourname.md`, update
 * it post-migration to the appropriate _arcwright/ location.
 */
'use strict';

const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const DIR_RENAMES = [
  // Order matters — rename inner dirs after outer dirs are renamed
  // Top-level directories
  { from: '_bmad-output', to: '_arcwright-output' },
  { from: '_bmad_output', to: '_arcwright-output' },
  { from: '_bmad',        to: '_arcwright' },
  // Module directories (inside _arcwright after rename)
  { from: '_arcwright/bmm', to: '_arcwright/awm' },
  { from: '_arcwright/bmb', to: '_arcwright/awb' },
  // Output subdirectories
  { from: '_arcwright-output/bmb-creations', to: '_arcwright-output/awb-creations' },
  // Workflow directories
  { from: '_arcwright/awm/workflows/bmad-quick-flow', to: '_arcwright/awm/workflows/arcwright-quick-flow' },
];

/**
 * Returns true if the .claude/commands/ file should be deleted during migration.
 * Deletes ALL bmad-*.md files EXCEPT track commands (which get renamed, not deleted).
 * Also deletes orchestration-master.* which has no bmad- prefix.
 */
function shouldDeleteCommand(filename) {
  // Non-bmad files that are still obsolete
  if (/^orchestration-master\./.test(filename)) return true;
  // All bmad-* except track commands (those get renamed)
  if (!/^bmad-/.test(filename)) return false;
  if (/^bmad-track-/.test(filename)) return false; // renamed, not deleted
  return true;
}

/** @deprecated kept for reference only — shouldDeleteCommand() is used instead */
const COMMANDS_TO_DELETE = [
  /^bmad-agent-/,
  /^bmad-bmm-/,
  /^bmad-bmb-/,
  /^bmad-adversarial-/,
  /^bmad-editorial-/,
  /^bmad-index-/,
  /^bmad-review-/,
  /^bmad-help\./,
  /^bmad-brainstorming\./,
  /^bmad-shard-doc\./,
  /^bmad-party-/,
  /^orchestration-master\./,
];

/** .claude/commands/ files to RENAME (track commands) */
const COMMANDS_TO_RENAME = [
  { from: 'bmad-track-compact.md',  to: 'arcwright-track-compact.md' },
  { from: 'bmad-track-extended.md', to: 'arcwright-track-extended.md' },
  { from: 'bmad-track-large.md',    to: 'arcwright-track-large.md' },
  { from: 'bmad-track-medium.md',   to: 'arcwright-track-medium.md' },
  { from: 'bmad-track-nano.md',     to: 'arcwright-track-nano.md' },
  { from: 'bmad-track-rv.md',       to: 'arcwright-track-rv.md' },
  { from: 'bmad-track-small.md',    to: 'arcwright-track-small.md' },
];

/** Content replacements applied to text files inside _arcwright/ and _arcwright-output/ */
const CONTENT_REPLACEMENTS = [
  // Directory/path references (order: longer patterns first to avoid partial matches)
  { pattern: /_bmad-output/g,         replacement: '_arcwright-output' },
  { pattern: /_bmad_output/g,         replacement: '_arcwright-output' },
  { pattern: /bmb-creations/g,        replacement: 'awb-creations' },
  { pattern: /bmb_creations/g,        replacement: 'awb_creations' },
  // Module paths
  { pattern: /\/_bmad\//g,            replacement: '/_arcwright/' },
  { pattern: /\\_bmad\\/g,            replacement: '\\_arcwright\\' },
  { pattern: /"_bmad\//g,             replacement: '"_arcwright/' },
  { pattern: /\/bmm\//g,              replacement: '/awm/' },
  { pattern: /\/bmb\//g,              replacement: '/awb/' },
  // Config header comments
  { pattern: /BMM Module/g,           replacement: 'AWM Module' },
  { pattern: /BMB Module/g,           replacement: 'AWB Module' },
  { pattern: /BMAD installer/g,       replacement: 'Arcwright installer' },
  { pattern: /BMAD Method/g,          replacement: 'Arcwright Method' },
  { pattern: /BMAD Builder/g,         replacement: 'Arcwright Builder' },
  // Config key names
  { pattern: /bmb_creations_output_folder/g, replacement: 'awb_creations_output_folder' },
  // Workflow directory name
  { pattern: /bmad-quick-flow/g,      replacement: 'arcwright-quick-flow' },
  // Dead slash command references — rewrite to stub agent names or workflow file pointers (must come before generic bmad-track- rule)
  { pattern: /\/bmad-agent-bmm-(\w[\w-]*)/g,  replacement: '/arcwright-$1' },
  { pattern: /\/bmad-agent-bmb-(\w[\w-]*)/g,  replacement: '/arcwright-$1' },
  { pattern: /\/bmad-agent-bmad-master/g,      replacement: '/arcwright-master' },
  { pattern: /\/bmad-bmm-(\w[\w-]*)/g,         replacement: 'awm workflow _arcwright/awm/workflows/$1/' },
  { pattern: /\/bmad-bmb-(\w[\w-]*)/g,         replacement: 'awb workflow _arcwright/awb/workflows/$1/' },
  // Package/command references
  { pattern: /bmad-track-/g,          replacement: 'arcwright-track-' },
  { pattern: /\/bmad-track-/g,        replacement: '/arcwright-track-' },
  // npx references
  { pattern: /@devo-bmad-custom\/tmux/g,                  replacement: '@arcwright-ai/tmux-setup' },
  { pattern: /@devo-bmad-custom\/agent-orchestration/g,    replacement: '@arcwright-ai/agent-orchestration' },
  { pattern: /devo-bmad-custom-agent-orchestration/g,      replacement: '@arcwright-ai/agent-orchestration' },
  { pattern: /devo-bmad-custom-tmux/g,                     replacement: '@arcwright-ai/tmux-setup' },
  // Generic bmad → arcwright (last, most general — lowercase only to avoid false positives)
  { pattern: /bmad-master/g,          replacement: 'arcwright-master' },
];

/** Text file extensions — only these get content replacement */
const TEXT_EXTS = new Set(['.md', '.yaml', '.yml', '.json', '.xml', '.csv', '.txt', '.js', '.sh', '.conf', '.py', '.mdc', '.toml']);

/** Directories to never descend into */
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist']);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isTextFile(filePath) {
  return TEXT_EXTS.has(path.extname(filePath).toLowerCase());
}

function walkFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

// ─── Migration Steps ─────────────────────────────────────────────────────────

function renameDirectories(root, dryRun) {
  const actions = [];

  for (const { from, to } of DIR_RENAMES) {
    const srcPath = path.join(root, from);
    const destPath = path.join(root, to);

    if (!fs.existsSync(srcPath)) continue;

    if (fs.existsSync(destPath)) {
      actions.push({ type: 'skip', reason: `Target already exists: ${to}`, path: srcPath });
      continue;
    }

    actions.push({ type: 'rename-dir', from: from, to: to });
    if (!dryRun) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.renameSync(srcPath, destPath);
    }
  }

  return actions;
}

function migrateCommands(root, dryRun) {
  const commandsDir = path.join(root, '.claude', 'commands');
  const actions = [];

  if (!fs.existsSync(commandsDir)) return actions;

  const files = fs.readdirSync(commandsDir);

  // Delete obsolete commands
  for (const file of files) {
    if (shouldDeleteCommand(file)) {
      actions.push({ type: 'delete', path: `.claude/commands/${file}` });
      if (!dryRun) {
        fs.unlinkSync(path.join(commandsDir, file));
      }
    }
  }

  // Rename track commands
  for (const { from, to } of COMMANDS_TO_RENAME) {
    const srcPath = path.join(commandsDir, from);
    const destPath = path.join(commandsDir, to);

    if (!fs.existsSync(srcPath)) continue;

    actions.push({ type: 'rename-file', from: `.claude/commands/${from}`, to: `.claude/commands/${to}` });
    if (!dryRun) {
      fs.renameSync(srcPath, destPath);
    }
  }

  return actions;
}

function replaceContent(root, dryRun) {
  const actions = [];

  // Scan _arcwright/ and _arcwright-output/ for content replacements
  const dirsToScan = [
    path.join(root, '_arcwright'),
    path.join(root, '_arcwright-output'),
    path.join(root, '.claude', 'commands'),
    path.join(root, '.claude'),
    path.join(root, '.cursor', 'rules'),
    path.join(root, '.gemini', 'commands'),
  ];

  // Also scan top-level config files
  const topLevelFiles = ['CLAUDE.md', 'GEMINI.md', '.windsurfrules', '.clinerules']
    .map(f => path.join(root, f))
    .filter(f => fs.existsSync(f));

  const allFiles = [];
  for (const dir of dirsToScan) {
    allFiles.push(...walkFiles(dir));
  }
  allFiles.push(...topLevelFiles);

  for (const filePath of allFiles) {
    if (!isTextFile(filePath)) continue;

    let content;
    try { content = fs.readFileSync(filePath, 'utf8'); } catch { continue; }

    let modified = content;
    const appliedPatterns = [];

    for (const { pattern, replacement } of CONTENT_REPLACEMENTS) {
      // Reset lastIndex for global regexes
      pattern.lastIndex = 0;
      if (pattern.test(modified)) {
        pattern.lastIndex = 0;
        modified = modified.replace(pattern, replacement);
        appliedPatterns.push(pattern.source);
      }
    }

    if (modified !== content) {
      const rel = path.relative(root, filePath);
      actions.push({
        type: 'content-replace',
        path: rel,
        patterns: appliedPatterns,
      });
      if (!dryRun) {
        fs.writeFileSync(filePath, modified, 'utf8');
      }
    }
  }

  return actions;
}

function cleanupConfig(root, dryRun) {
  const actions = [];
  const configDir = path.join(root, '_arcwright', '_config');

  if (!fs.existsSync(configDir)) return actions;

  // Preserve *.customize.yaml overlays before deleting the config dir
  const customizeFiles = [];
  function findCustomize(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { findCustomize(full); }
      else if (entry.name.endsWith('.customize.yaml')) { customizeFiles.push(full); }
    }
  }
  try { findCustomize(configDir); } catch {}

  if (customizeFiles.length > 0) {
    const overlayDest = path.join(root, '_arcwright', 'overlays', 'customize-agents');
    actions.push({ type: 'preserve-overlays', count: customizeFiles.length, dest: '_arcwright/overlays/customize-agents/' });
    if (!dryRun) {
      fs.mkdirSync(overlayDest, { recursive: true });
      for (const src of customizeFiles) {
        const destFile = path.join(overlayDest, path.basename(src));
        fs.copyFileSync(src, destFile);
      }
      console.log(`  ⚠️  Preserved ${customizeFiles.length} customize.yaml overlay${customizeFiles.length !== 1 ? 's' : ''} → _arcwright/overlays/customize-agents/`);
    }
  }

  // Only delete if no unrecognized files remain after preservation
  const KNOWN_GENERATED = new Set(['manifest.yaml', 'files-manifest.csv']);
  let hasUnknown = false;
  function checkUnknown(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'agents') continue; // known generated subdir
        checkUnknown(full);
      } else if (!KNOWN_GENERATED.has(entry.name) && !entry.name.endsWith('.customize.yaml')) {
        hasUnknown = true;
      }
    }
  }
  try { checkUnknown(configDir); } catch {}

  if (!hasUnknown) {
    actions.push({ type: 'delete-dir', path: '_arcwright/_config/' });
    if (!dryRun) {
      fs.rmSync(configDir, { recursive: true });
    }
  } else {
    actions.push({ type: 'skip', reason: 'Skipped _arcwright/_config/ deletion — unknown files present', path: configDir });
    if (!dryRun) {
      console.log(`  ⚠️  _arcwright/_config/ not deleted — contains unknown files. Review manually.`);
    }
  }

  return actions;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function migrate(projectRoot, dryRun) {
  const root = path.resolve(projectRoot || process.cwd());
  const allActions = [];

  console.log(`\n${ dryRun ? '🔍 DRY RUN' : '🔄 MIGRATING'} — bmad → arcwright`);
  console.log(`   Project: ${root}\n`);

  // Check if there's anything to migrate
  const hasBmad = fs.existsSync(path.join(root, '_bmad'))
    || fs.existsSync(path.join(root, '_bmad-output'))
    || fs.existsSync(path.join(root, '_bmad_output'));

  if (!hasBmad) {
    console.log('   No _bmad/ or _bmad-output/ directory found. Nothing to migrate.\n');
    return { actions: [], root };
  }

  // Step 1: Rename directories
  console.log('── Step 1: Rename directories ──');
  const dirActions = renameDirectories(root, dryRun);
  for (const a of dirActions) {
    if (a.type === 'rename-dir') console.log(`   📁 ${a.from} → ${a.to}`);
    else if (a.type === 'skip') console.log(`   ⏭  ${a.reason}`);
  }
  if (!dirActions.length) console.log('   (no directory renames needed)');
  allActions.push(...dirActions);

  // Step 2: Migrate .claude/commands/
  console.log('\n── Step 2: Migrate .claude/commands/ ──');
  const cmdActions = migrateCommands(root, dryRun);
  for (const a of cmdActions) {
    if (a.type === 'delete') console.log(`   🗑  ${a.path}`);
    else if (a.type === 'rename-file') console.log(`   📄 ${a.from} → ${a.to}`);
  }
  if (!cmdActions.length) console.log('   (no command changes needed)');
  allActions.push(...cmdActions);

  // Step 3: Replace content in text files
  console.log('\n── Step 3: Replace content references ──');
  const contentActions = replaceContent(root, dryRun);
  for (const a of contentActions) {
    console.log(`   ✏️  ${a.path}  (${a.patterns.length} pattern${a.patterns.length > 1 ? 's' : ''})`);
  }
  if (!contentActions.length) console.log('   (no content changes needed)');
  allActions.push(...contentActions);

  // Step 4: Cleanup
  console.log('\n── Step 4: Cleanup ──');
  const cleanActions = cleanupConfig(root, dryRun);
  for (const a of cleanActions) {
    console.log(`   🗑  ${a.path}`);
  }
  if (!cleanActions.length) console.log('   (nothing to clean up)');
  allActions.push(...cleanActions);

  // Summary
  const total = allActions.filter(a => a.type !== 'skip').length;
  console.log(`\n── Summary ──`);
  console.log(`   ${total} action${total !== 1 ? 's' : ''} ${dryRun ? 'would be taken' : 'completed'}`);

  if (dryRun && total > 0) {
    console.log(`\n   Run without --dry-run to apply these changes.`);
  }

  // Post-migration audit: report files that still contain /bmad- references
  if (!dryRun) {
    const dirsToAudit = [
      path.join(root, '_arcwright'),
      path.join(root, '_arcwright-output'),
      path.join(root, '.claude', 'commands'),
    ];
    const auditFiles = [];
    for (const dir of dirsToAudit) auditFiles.push(...walkFiles(dir));
    const dangling = auditFiles.filter(f => {
      if (!isTextFile(f)) return false;
      try { return /\/bmad-/.test(fs.readFileSync(f, 'utf8')); } catch { return false; }
    });
    if (dangling.length > 0) {
      console.log(`\n   ⚠️  ${dangling.length} file${dangling.length !== 1 ? 's' : ''} still contain /bmad-* references — review manually:`);
      for (const f of dangling) console.log(`      ${path.relative(root, f)}`);
    }
  }

  console.log('');
  return { actions: allActions, root };
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const rootIdx = args.indexOf('--project-root');
  const projectRoot = rootIdx >= 0 ? args[rootIdx + 1] : process.cwd();

  migrate(projectRoot, dryRun);
}

module.exports = { migrate };
