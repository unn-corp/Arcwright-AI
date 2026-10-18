---
name: session-handoff
description: >
  Use when deliberately ending a session and handing off to a fresh agent or worktree —
  compresses the current session into a structured continuation artifact. Triggers on
  "/handoff", "write a handoff", "hand this off", or before closing a long session.
allowed-tools: Read, Write, Bash, Glob
---

# Session handoff

Write a compact continuation artifact that lets a fresh agent resume without the
transcript. Use known decisions and actual evidence; ask only for consequential
missing information. Do not require an extra compression skill for ordinary
handoff writing.

## Gather and record

Reuse current project context and inspect relevant changed files, source identity,
active tasks, and evidence. A repository-wide diff includes other sessions' work;
identify task-owned changes rather than claiming every dirty file. Read tracker
context only when its use was explicitly authorized.

Include these fields, omitting empty optional detail:

| Field | Required content |
| --- | --- |
| Goal/state | Requested outcome; done, in progress, blocked |
| Workspace/source | Actual checkout, commit plus relevant uncommitted state |
| Changes | Meaningful task-owned paths and a short reason; `none` when applicable |
| Decisions/authority | Binding choices, existing authorization, unresolved boundaries |
| Tasks/evidence | Actual task IDs/status, executed checks and source, unrun gates, accessible artifacts |
| Capabilities | Relevant installed skill names and actual paths, finder, actual tool limits; suggestions are nonexclusive |
| Next action | Prioritized open items and one immediately actionable first step |

Reuse an existing capability brief until task, workspace, or installation changes.
When needed, use the installed `arcwright` helper per the shared
[handoff contract](../subagent-protocol/guide-07-7-handoff-context-contract.md).
Do not preload a catalog or every suggested skill. A receiver can read relevant
`SKILL.md` paths directly without a native Skill tool. A prior task ID must be
reconciled before reuse; T3 review rounds require fresh delegated tasks.

## Save and return

Prefer host-managed evidence storage when available. Otherwise write a unique
`_arcwright/_memory/skill-runs/session-handoff-<run-id>/handoff.md` under the active
project. Keep installed bundles read-only and do not overwrite another handoff.
Honor an explicit user-designated destination for a permanent deliverable.

Return the artifact path, current status, and next action. Keep content concrete;
reference accessible artifacts instead of pasting transcripts or raw logs. Record
unknown usage and missing evidence honestly. Preserve required source/license
credits and omit AI/model attribution. Creating a handoff does not authorize
starting a new top-level conversation, publishing, or tracker synchronization.
