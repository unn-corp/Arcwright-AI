---
name: skill-scout
description: Discover and compare agent skills using live registry popularity, primary source, licenses, project gaps, and context cost. Use for skill discovery, testing-tool guidance, or deciding whether to add a skill or improve an installed equivalent.
allowed-tools: Read, Grep, Glob, Bash, Write, WebFetch, WebSearch, Agent
---

# Skill Scout

Research first. Installation, global changes, and contributions are separate actions governed by the user's current request. Do not turn discovery into an automatic install, fork, push, or PR.

## Profile and research

Inspect the task, installed skill names/descriptions, and relevant project dependencies. Reuse known context; load no full catalog or unrelated source. Identify a small set of actual gaps. Compare existing equivalents before recommending another pack.

Use the host's search/HTTP tools for:

- The live skills.sh registry: `https://skills.sh/api/search?q=<url-encoded-gap>&limit=20`. Verify the response and current endpoint; do not assume historical API shapes.
- Primary GitHub repositories and exact `SKILL.md` bodies, licenses, and required sidecars/scripts. Use immutable revisions for reviewed source when available.
- Wider web searches to discover candidates, then verify claims at their source.
- Relevant installed project/global skills, without reading credentials or private unrelated files.

Follow the user's provider/model choice and host orchestration policy. Use native Codex agents when requested and supported. Delegate bounded independent gaps only when authorized and useful; otherwise research directly. Inherit the active model when no choice is specified. Do not pin Sonnet, escalate providers, spawn recursively, or duplicate active research. Use `subagent-protocol` for authorized orchestration.

## Compare value and cost

Deduplicate installed skills and aliases. Distinguish per-skill installs from repository stars and record the date. Popularity is a signal, not evidence of effectiveness. Prefer primary sources, maintenance, stack fit, specific benefits, redistribution terms, small entrypoints, and conditional references.

For testing skills, evaluate whether they detect real defects through public behavior, reuse existing tests/fixtures, run focused checks first, and stop when risks are covered. Penalize mandatory coverage quotas, duplicated frameworks, excessive mocks, repeated full-suite runs, forced agents, and large always-loaded examples. Entrypoint bytes/words describe context size, not measured token savings.

Keep only candidates that add value. Report how many candidates were reviewed and why others were excluded, including installed overlap. A recommendation to adapt our existing skill is a valid outcome.

## Review and act within scope

Before copying third-party material, make its full body and license reviewable through source links or a local artifact. Inspect tool permissions, network access, process execution, credential use, write paths, and dependencies. Missing `allowed-tools` does not mean a skill cannot run tools. Preserve required licenses, copyright, and source notices. Do not vendor material with unverified redistribution terms.

For requested local maintenance, use `writing-skills` and preserve namespaces, model invocation, native/T3 tools, output boundaries, and existing authorization. Do not add AI attribution. Avoid importing a whole plugin to gain one small procedure.

Only install, update global targets, or publish/contribute when the user has authorized that scope. Resolve routine choices from existing authorization; ask only for a consequential missing decision or authority. For contributions, inspect current repository guidance and actual branches instead of hard-coding a historical base branch.

Report a short table with sources, current popularity, incremental value, costs, and recommendation. State what changed, validation, and limits. Keep temporary research under host evidence storage, otherwise `_arcwright/_memory/skill-runs/skill-scout-<run-id>/`; keep installed bundles read-only during discovery.
