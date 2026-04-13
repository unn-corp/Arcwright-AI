---
name: prepare-to-merge
description: Final pre-merge checklist — validates type safety, runs a full build, confirms the PR description is complete, and ensures the branch is merge-ready. Invoke after user approval at the end of any workflow track.
version: 1.0.0
author: arcwright
tags: [git, pr, merge, quality, ci]
---

# Prepare to Merge

## When to Use

Run this skill after the user gives explicit `[approve]` following the final QA gate. It is the last step before the branch is merged.

**Never auto-run.** Always wait for explicit user approval before executing.

## Steps

Execute each step in order. Stop and report if any step fails — do not proceed past a failure.

### 1. Type Check

Run the project's type checking command. For TypeScript projects this is typically:

```
pnpm run type-check
```

Or the equivalent for your project's toolchain (`npm run type-check`, `tsc --noEmit`, etc.).

**Pass condition:** Zero type errors.

### 2. Full Build Validation

Run a full production build to catch bundler and compilation errors that type-check alone may miss:

```
pnpm run build
```

Or the equivalent for your project (`npm run build`, `yarn build`, etc.).

**Pass condition:** Build exits with code 0 and produces output artefacts.

### 3. PR Description

Verify the PR description is complete. It must contain:
- [ ] Branch name referenced
- [ ] Summary of what changed and why
- [ ] Any linked issues or tickets
- [ ] Notes on how to test (if non-obvious)

If using a Git host CLI (e.g. `gh pr view`), check the current PR description and update if incomplete.

### 4. Final Checklist

Before declaring ready:
- [ ] All review gate findings resolved (no 🔴 Critical items outstanding)
- [ ] All tests passing
- [ ] Type check passed (Step 1)
- [ ] Build validated (Step 2)
- [ ] PR description complete (Step 3)
- [ ] No uncommitted changes on the branch

### 5. Report Back

Output a one-line summary:

```
✅ Branch ready to merge — type-check ✓ · build ✓ · PR description ✓
```

Or, if anything failed:

```
🔴 Prepare-to-merge blocked: [reason] — fix and re-run
```
