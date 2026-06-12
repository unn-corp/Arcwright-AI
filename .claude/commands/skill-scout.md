---
description: Discover and install agent skills for the current project. Profiles the stack, searches skills.sh, GitHub, local global skills, and the Arcwright catalog, ranks candidates against capability gaps, shows a review gate for third-party skills, and installs the chosen ones into .agents/skills/ (mirrored to .kiro/skills/ when present).
handoffs:
  - security-review (vet a third-party SKILL.md flagged at the review gate)
  - writing-skills (author a new skill when no existing one fills the gap)
---

# /skill-scout — Discover & Install Project Skills

Find skills worth having on this project and install them at project level.

## Instructions

1. Load `.agents/skills/skill-scout/SKILL.md` for the full protocol.
2. Run the project profile (Section 1) to build the capability gap list. Reuse
   `project-context` if it hasn't run this session.
3. Fan out the four-source search (Section 2). For multi-gap runs, dispatch one
   in-process Agent sub-agent per source via `claude-subagent-protocol` (sonnet-first).
4. Rank & dedup (Section 3), then present the ranked shortlist (Section 4) and ask
   which to install.
5. For registry/GitHub picks, run the review gate (Section 5) — show the SKILL.md body
   and its `allowed-tools`/bash/network usage before any copy.
6. Install the chosen skills at project level (Section 6) and report (Section 7).

## Arguments

`$ARGUMENTS`:
- *(empty)* — auto-profile the project and recommend across all four sources
- `<term>` — scope discovery to a specific capability (e.g. `stripe payments`)
- `--source registry|github|local|arcwright` — limit to one source
- `--install <name|ref>` — skip discovery and install a known skill (still gated if third-party)
- `--no-gate` — only valid for `trusted` (arcwright/local) sources
