# Arcwright Migration — bmad to arcwright

Migrate this project from the old bmad naming convention to arcwright.

## Instructions

You are running a migration from the old "bmad" agent framework naming to "arcwright". Follow these steps exactly:

### Step 1: Dry Run

Run the migration script in dry-run mode first to preview all changes:

```bash
npx @arcwright-ai/agent-orchestration migrate --dry-run
```

Report what the script will do. If there are no changes needed, stop here.

### Step 2: Apply Migration

If the dry run looks correct, run the migration:

```bash
npx @arcwright-ai/agent-orchestration migrate
```

### Step 3: Verify — Directory Structure

Check that these renames happened correctly:

- [ ] `_bmad/` no longer exists, `_arcwright/` is present
- [ ] `_bmad-output/` or `_bmad_output/` no longer exists, `_arcwright-output/` is present
- [ ] Inside `_arcwright/`: `bmm/` is now `awm/`, `bmb/` is now `awb/`
- [ ] Inside `_arcwright-output/`: `bmb-creations/` is now `awb-creations/`
- [ ] `_arcwright/_config/` has been removed (no longer used)

Run: `ls _arcwright/ && ls _arcwright-output/ 2>/dev/null`

### Step 4: Verify — Commands

Check `.claude/commands/`:

- [ ] No files starting with `bmad-` remain
- [ ] Track commands are named `arcwright-track-*.md`

Run: `ls .claude/commands/ 2>/dev/null`

### Step 5: Verify — Content References

Grep for any remaining bmad references in the migrated directories:

```bash
grep -ri "bmad" _arcwright/ --include="*.md" --include="*.yaml" --include="*.yml" --include="*.json" -l 2>/dev/null
grep -ri "bmad" _arcwright-output/ --include="*.md" --include="*.yaml" --include="*.yml" --include="*.json" -l 2>/dev/null
grep -ri "_bmad" .claude/ --include="*.md" -l 2>/dev/null
```

If any files still contain "bmad" references, manually review and fix them. Common patterns the script handles:

| Old | New |
|-----|-----|
| `_bmad/` | `_arcwright/` |
| `_bmad-output/` | `_arcwright-output/` |
| `bmm/` | `awm/` |
| `bmb/` | `awb/` |
| `bmb-creations/` | `awb-creations/` |
| `bmad-track-` | `arcwright-track-` |
| `bmad-master` | `arcwright-master` |
| `bmad-quick-flow` | `arcwright-quick-flow` |
| `BMAD Method` | `Arcwright Method` |
| `BMAD Builder` | `Arcwright Builder` |
| `BMM Module` | `AWM Module` |
| `BMB Module` | `AWB Module` |
| `@devo-bmad-custom/*` | `@arcwright-ai/*` |

### Step 6: Verify — Config Files

Read `_arcwright/core/config.yaml` and `_arcwright/awm/config.yaml` (if they exist) and confirm:

- [ ] `output_folder` references `_arcwright-output` not `_bmad-output`
- [ ] Module paths reference `awm/` and `awb/` not `bmm/` and `bmb/`
- [ ] No `_bmad` paths remain

### Step 7: Report

Summarize what was migrated and flag any remaining issues that need manual attention. If the project also has `.cursor/rules/bmad/`, `.gemini/commands/bmad-*`, or other IDE-specific bmad files, note those as needing manual cleanup.
