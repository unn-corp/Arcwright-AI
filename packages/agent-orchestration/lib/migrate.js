#!/usr/bin/env node
/**
 * @arcwright-ai/agent-orchestration — lib/migrate.js
 *
 * Migration script: renames bmad → arcwright across a project.
 *
 * Renames directories, files, and content references from the old bmad
 * naming convention to the new arcwright convention.
 *
 * Note on BMAD lineage: Arcwright's agent roster forked from BMAD around v6.0.x.
 * Upstream BMAD (currently v6.9.0) has since consolidated its QA (Quinn), Scrum
 * Master (Bob), and quick-flow (Barry) personas into a single Dev agent (v6.3.0)
 * and moved to a SKILL.md + TOML activation model (v6.2/v6.4). Arcwright keeps
 * those as distinct in-process sub-agents on purpose — the Session Agent Registry
 * model is a core differentiator — so the roster is an intentional divergence, not
 * stale drift. The rename maps below remain accurate for the old _bmad/ tree.
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
  // Deprecated tracks: medium/extended/large were retired — delete, do not rename
  if (/^bmad-track-(medium|extended|large)\.md$/.test(filename)) return true;
  // All bmad-* except surviving track commands (those get renamed)
  if (!/^bmad-/.test(filename)) return false;
  if (/^bmad-track-/.test(filename)) return false; // renamed, not deleted
  return true;
}

// A COMMANDS_TO_DELETE array used to sit here, marked "@deprecated kept for
// reference only". shouldDeleteCommand() above is a strict superset of it —
// every pattern it listed (bmad-agent-, bmad-bmm-, bmad-bmb-, bmad-adversarial-,
// bmad-editorial-, bmad-index-, bmad-review-, bmad-help., bmad-brainstorming.,
// bmad-shard-doc., bmad-party-, orchestration-master.) is covered by the
// ^bmad- non-track rule or the explicit orchestration-master case. Keeping a
// second, unused list of the same decision is how the two drift apart.

/** .claude/commands/ files to RENAME (track commands) */
const COMMANDS_TO_RENAME = [
  { from: 'bmad-track-compact.md',  to: 'arcwright-track-compact.md' },
  { from: 'bmad-track-nano.md',     to: 'arcwright-track-nano.md' },
  { from: 'bmad-track-rv.md',       to: 'arcwright-track-rv.md' },
  { from: 'bmad-track-small.md',    to: 'arcwright-track-small.md' },
  // medium/extended/large deliberately omitted — deprecated, deleted by shouldDeleteCommand()
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

function isWithinRoot(realRoot, candidate) {
  const relative = path.relative(realRoot, fs.realpathSync(candidate));
  return relative === '' || (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

function resolveVirtualPath(relPath, plannedRenames) {
  let resolved = relPath;
  for (let i = plannedRenames.length - 1; i >= 0; i--) {
    const { from, to } = plannedRenames[i];
    if (resolved === to || resolved.startsWith(`${to}/`)) {
      resolved = from + resolved.slice(to.length);
    } else if (resolved === from || resolved.startsWith(`${from}/`)) {
      return null;
    }
  }
  return resolved;
}

/**
 * Detect BMAD artifacts that this migrator can handle.
 * Returns {present: boolean, signals: string[]} for installer prompts and
 * migration eligibility. Keep this as the single source of truth so the
 * installer cannot record a migration that migrate() would skip.
 */
function detectBmad(projectRoot) {
  const signals = [];
  const check = (rel) => fs.existsSync(path.join(projectRoot, rel));

  if (check('_bmad'))             signals.push('_bmad/');
  if (check('_bmad-output'))      signals.push('_bmad-output/');
  if (check('_bmad_output'))      signals.push('_bmad_output/');
  if (check('_arcwright/bmm'))    signals.push('_arcwright/bmm/ (partial migration)');
  if (check('_arcwright/bmb'))    signals.push('_arcwright/bmb/ (partial migration)');

  const commandsDir = path.join(projectRoot, '.claude', 'commands');
  if (fs.existsSync(commandsDir)) {
    const bmadCommands = fs.readdirSync(commandsDir).filter((file) => /^bmad-/.test(file));
    if (bmadCommands.length > 0) {
      signals.push(`${bmadCommands.length} bmad-*.md command file${bmadCommands.length !== 1 ? 's' : ''} in .claude/commands/`);
    }
  }

  return { present: signals.length > 0, signals };
}

/**
 * Validate every destructive migration decision before the first write.
 * This prevents partial migrations and refuses managed symlinks that escape
 * the selected project root.
 */
function preflightMigration(root) {
  const errors = [];
  const realRoot = fs.realpathSync(root);
  const managedRoots = [
    '_bmad', '_bmad-output', '_bmad_output', '_arcwright', '_arcwright-output',
    '.claude', '.cursor/rules', '.gemini/commands',
    'CLAUDE.md', 'GEMINI.md', '.windsurfrules', '.clinerules',
  ];

  function inspectManagedPath(fullPath, relPath) {
    let stat;
    try { stat = fs.lstatSync(fullPath); } catch { return; }

    if (stat.isSymbolicLink()) {
      try {
        if (!isWithinRoot(realRoot, fullPath)) {
          errors.push(`${relPath} resolves outside the project root`);
        }
      } catch {
        errors.push(`${relPath} is an unresolvable managed symlink`);
      }
      return;
    }

    if (!stat.isDirectory() || SKIP_DIRS.has(path.basename(fullPath))) return;
    for (const entry of fs.readdirSync(fullPath)) {
      inspectManagedPath(path.join(fullPath, entry), path.posix.join(relPath, entry));
    }
  }

  for (const relPath of managedRoots) {
    inspectManagedPath(path.join(root, ...relPath.split('/')), relPath);
  }

  const plannedRenames = [];
  for (const rename of DIR_RENAMES) {
    const sourceRel = resolveVirtualPath(rename.from, plannedRenames);
    if (sourceRel === null || !fs.existsSync(path.join(root, ...sourceRel.split('/')))) continue;

    const targetRel = resolveVirtualPath(rename.to, plannedRenames);
    if (targetRel !== null && fs.existsSync(path.join(root, ...targetRel.split('/')))) {
      errors.push(`${rename.from} -> ${rename.to}: target already exists`);
      continue;
    }
    plannedRenames.push(rename);
  }

  const commandsDir = path.join(root, '.claude', 'commands');
  for (const { from, to } of COMMANDS_TO_RENAME) {
    const sourcePath = path.join(commandsDir, from);
    const targetPath = path.join(commandsDir, to);
    if (fs.existsSync(sourcePath) && fs.existsSync(targetPath)) {
      errors.push(`.claude/commands/${from} -> .claude/commands/${to}: target already exists`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Migration preflight failed:\n  - ${errors.join('\n  - ')}`);
  }
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

  // Deduplicate: dirsToScan lists both .claude/commands and .claude, and the
  // latter contains the former, so every command file was visited twice. In a
  // real run the second visit is a no-op (the first already rewrote the file,
  // so nothing matches), but under --dry-run nothing is written, so the second
  // visit re-matches the original content and reports the same file again.
  // That inflated the preview users read before deciding to migrate.
  const allFiles = [...new Set([
    ...dirsToScan.flatMap(dir => walkFiles(dir)),
    ...topLevelFiles,
  ])];

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

  const bmadDetected = detectBmad(root);
  if (!bmadDetected.present) {
    console.log('   No migratable BMAD artifacts found. Nothing to migrate.\n');
    return { actions: [], root };
  }

  preflightMigration(root);

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

  try {
    migrate(projectRoot, dryRun);
  } catch (error) {
    console.error(`Migration aborted: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { migrate, detectBmad };
