# React Expert — Quick Rules

> Load full `SKILL.md` when executing this skill as a formal procedure.

## Core Rules
- Treat your own knowledge of React APIs as suspect — always verify against source files before stating behavior
- Every code example must have a source file reference (file path + line number); never generate examples from memory
- Research priority order: React test files > source code > git history > PRs > issues > Flow types > TypeScript types > react.dev docs
- Never use web search, Stack Overflow, or blog posts — GitHub via `gh` CLI only
- Clone or update the React repo to `.claude/react/` before any research session
- Spawn all 6 research agents in parallel (test-explorer, source-explorer, git-historian, pr-researcher, issue-hunter, types-inspector) — do not skip any
- If findings contradict your prior understanding, explicitly flag the discrepancy
- Do not add information from your own knowledge when synthesizing agent results
- Save final research documents to `.claude/research/<topic>.md`
- Note any discrepancies between Flow types (source of truth) and TypeScript types

## Red Flags (stop and apply skill)
- About to state "I know this React API does X" without source evidence
- Writing a React code example from memory rather than from a test file
- Using Stack Overflow or a blog post as a reference for React behavior
- Describing a "common pattern" without verifying it in test files
