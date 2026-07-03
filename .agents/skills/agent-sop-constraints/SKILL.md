---
name: agent-sop-constraints
description: Write skill and SOP instructions with explicit constraint strength (MUST / MUST NOT / SHOULD / MAY, RFC 2119 style) so an agent can tell a hard requirement from a suggestion. Use when authoring or reviewing a SKILL.md, a workflow/SOP, or an agent prompt, or when a skill's instructions read as flat prose an agent might treat as optional. Complements writing-skills (which covers the TDD authoring loop).
allowed-tools: Read, Grep, Glob, Edit, Write
version: 1.0.0
author: arcwright
tags: [skill-authoring, sop, constraints, rfc2119, reliability, workflow]
---

# Agent SOP Constraints

Flat prose is ambiguous to an agent. "Run the tests and update the changelog" does not say whether skipping the changelog is a violation or a nicety. Give every instruction a **constraint strength** so compliance is unambiguous. Distilled from AWS Strands Agents' natural-language-SOP discipline (Apache-2.0, see `SOURCES-STRANDS.md`), adapted to Arcwright's SKILL.md format.

## The constraint vocabulary (RFC 2119, adapted)

Mark load-bearing instructions with one of these. Use the keyword in caps so it reads as a signal, not decoration.

| Keyword | Meaning | Example |
|---------|---------|---------|
| **MUST** / **REQUIRED** | A hard requirement. Not doing it is a violation of the skill. | You MUST run the full test suite before reporting success. |
| **MUST NOT** | A hard prohibition, always paired with a reason. | You MUST NOT commit secrets to the repo, because they are unrecoverable once pushed and indexed. |
| **SHOULD** / **RECOMMENDED** | The default; deviate only with a stated, specific reason. | You SHOULD reuse the existing helper rather than write a new one. |
| **SHOULD NOT** | Discouraged; do it only with a stated reason. | You SHOULD NOT add a new dependency for a one-line utility. |
| **MAY** / **OPTIONAL** | Genuinely discretionary. | You MAY add a diagram if it clarifies the flow. |

Rules for using them:
1. Every **MUST NOT** carries a **because** clause. A prohibition without a reason gets rationalized away under pressure. "MUST NOT force-push to main, because it rewrites shared history and breaks every other clone."
2. Reserve **MUST** for real violations. If everything is a MUST, nothing is. Downgrade preferences to SHOULD.
3. Do not stack hedges. "You SHOULD probably usually consider maybe running tests" tells the agent nothing. Pick one keyword and commit.
4. Put the keyword early in the sentence so it is visible when scanning, not buried at the end.

## Parameter acquisition (gather before you act)

Skills that take inputs SHOULD collect them cleanly up front rather than discovering gaps mid-run.

- **Ask for all required parameters in one prompt**, not one at a time. A single "I need A, B, and C" beats three round trips.
- **Accept each parameter three ways**: direct input, a file path to read, or a URL to fetch. Say which are supported.
- **Confirm before proceeding** on anything destructive or expensive: restate the resolved parameters and the action, then act. For a read-only or trivially reversible action, skip the confirmation and proceed (asking permission you do not need is its own friction).
- **State defaults explicitly.** "Region defaults to us-east-1 unless you name another" is a MAY the agent can act on; a silent default is a surprise.

## Applying this to an existing skill

When retrofitting a flat-prose skill:
1. Read the body and find every instruction that is actually load-bearing.
2. Tag each with the weakest keyword that is still true. Most "do X" lines are SHOULD; only the ones whose omission breaks the outcome are MUST.
3. Add a **because** clause to every MUST NOT.
4. Leave narrative, background, and examples unmarked. Constraint keywords are for imperatives, not explanation, over-marking is as noisy as under-marking.

## Self-check

Before shipping a skill or SOP, verify:
- Every imperative that matters has a constraint keyword.
- Every MUST NOT has a reason.
- No sentence stacks more than one strength keyword.
- Required inputs are gathered up front with their accepted forms and defaults named.

## See also

- `writing-skills` — the TDD loop for authoring skills (write failing scenarios, then the skill, then verify). Use it for the process; use this skill for the constraint wording inside the result.
- `SOURCES-STRANDS.md` — attribution for the AWS Strands Agents SOP conventions this distills.
