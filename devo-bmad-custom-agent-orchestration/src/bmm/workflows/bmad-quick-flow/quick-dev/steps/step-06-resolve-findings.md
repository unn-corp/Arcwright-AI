---
name: 'step-06-resolve-findings'
description: 'Handle review findings interactively, apply fixes, update tech-spec with final status'
---

# Step 6: Resolve Findings

**Goal:** Handle adversarial review findings interactively, apply fixes, finalize tech-spec.

---

## AVAILABLE STATE

From previous steps:

- `{baseline_commit}` - Git HEAD at workflow start
- `{execution_mode}` - "tech-spec" or "direct"
- `{tech_spec_path}` - Tech-spec file (if Mode A)
- Findings table from step-05

---

## RESOLUTION

> 💡 **Agile note — why we do this:** Adversarial review exists to catch what forward-looking implementation misses. Real findings are fixed before commit — this is the quality gate that keeps tech debt from compounding.

**Default behavior: Auto-fix all findings classified as "real", then proceed.**

Execute FIX AUTOMATICALLY section below immediately. Present the fix summary to the user.

After fixing, display options for any remaining findings:

**[W] Walk through** - Discuss remaining/skipped findings individually
**[S] Skip** - Acknowledge remaining findings and proceed to commit

> Only halt if the user invokes [W] or [S] in response to the summary. Silence means proceed.

### EXECUTION RULES:

- **Auto-fix "real" findings immediately** — do not ask permission
- Only halt after presenting fix summary if user wants to walk through or skip remaining
- "Noise" and "uncertain" findings are reported but not auto-fixed

---

## WALK THROUGH [W]

For each finding in order:

1. Present the finding with context
2. Ask: **fix now / skip / discuss**
3. If fix: Apply the fix immediately
4. If skip: Note as acknowledged, continue
5. If discuss: Provide more context, re-ask
6. Move to next finding

After all findings processed, summarize what was fixed/skipped.

---

## FIX AUTOMATICALLY [F]

1. Filter findings to only those classified as "real"
2. Apply fixes for each real finding
3. Report what was fixed:

```
**Auto-fix Applied:**
- F1: {description of fix}
- F3: {description of fix}
...

Skipped (noise/uncertain): F2, F4
```

---

## SKIP [S]

1. Acknowledge all findings were reviewed
2. Note that user chose to proceed without fixes
3. Continue to completion

---

## UPDATE TECH-SPEC (Mode A only)

If `{execution_mode}` is "tech-spec":

1. Load `{tech_spec_path}`
2. Update status to "Completed"
3. Add review notes:
   ```
   ## Review Notes
   - Adversarial review completed
   - Findings: {count} total, {fixed} fixed, {skipped} skipped
   - Resolution approach: {walk-through/auto-fix/skip}
   ```
4. Save changes

---

## COMPLETION OUTPUT

```
**Review complete. Ready to commit.**

**Implementation Summary:**
- {what was implemented}
- Files modified: {count}
- Tests: {status}
- Review findings: {X} addressed, {Y} skipped

{Explain what was implemented based on user_skill_level}
```

---

## WORKFLOW COMPLETE

This is the final step. The Quick Dev workflow is now complete.

User can:

- Commit changes
- Run additional tests
- Start new Quick Dev session

---

## SUCCESS METRICS

- User presented with resolution options
- Chosen approach executed correctly
- Fixes applied cleanly (if applicable)
- Tech-spec updated with final status (Mode A)
- Completion summary provided
- User understands what was implemented

## FAILURE MODES

- Not presenting resolution options
- Auto-fixing "noise" or "uncertain" findings
- Not updating tech-spec after resolution (Mode A)
- No completion summary
- Leaving user unclear on next steps
