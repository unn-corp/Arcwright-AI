---
description: Discover agent skills for this codebase by fanning out Sonnet sub-agents to research the internet (skills.sh, GitHub, the web), rank them against the project's capability gaps, review third-party skills at a gate, then offer to install the chosen ones globally and contribute them back to the Arcwright package (unn-corp/Arcwright-AI) via a PR to the dev branch.
handoffs:
  - security-review (vet a third-party SKILL.md flagged at the review gate)
  - writing-skills (author a new skill when no existing one fills the gap)
---

# /skill-scout — Discover, Install Globally & Contribute Skills

Find skills worth having for this codebase, install them globally, and (with consent) contribute
them back to the Arcwright package.

## Instructions

1. Load `.agents/skills/skill-scout/SKILL.md` for the full protocol.
2. Run the project profile (Section 1) to build the capability gap list. Reuse `project-context`
   if it hasn't run this session.
3. **Fan out Sonnet sub-agents — one per gap** (Section 2) via `claude-subagent-protocol`
   (model: sonnet). Each researches the internet (skills.sh, GitHub, the wider web, local global)
   and returns structured candidates. Do not escalate to opus without explicit permission.
4. Rank & dedup (Section 3), present the ranked shortlist (Section 4), and ask which to install.
5. For registry/github/web picks, run the review gate (Section 5) — show the SKILL.md body, its
   `allowed-tools`/bash/network usage, AND its license before any copy.
6. **Offer to install globally** (Section 6): copy to `~/.claude/skills/` (+ `~/.kiro/skills/`
   mirror) AND the global Arcwright install if present.
7. **Offer to contribute to the Arcwright package** (Section 7): for redistribution-licensed
   skills, open a PR against the **`dev`** branch of `unn-corp/Arcwright-AI` (never `main`). Push a
   branch directly if the user has write access, otherwise fork + PR.
8. Report (Section 8): installed paths + PR URLs + anything skipped.

## Arguments

`$ARGUMENTS`:
- *(empty)* — auto-profile the project and research across all sources
- `<term>` — scope discovery to a specific capability (e.g. `stripe payments`)
- `--source registry|github|web|local` — limit research to one source
- `--global-only` — install globally but skip the package-contribution offer
- `--contribute` — go straight to the package-contribution flow for a chosen skill
- `--install <name|ref>` — skip discovery and install a known skill (still gated if third-party)
- `--no-gate` — only valid for `local` (trusted) sources
