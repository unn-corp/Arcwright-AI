# Skill Scout — Quick Rules

Discover skills for a codebase, then install them globally and contribute them back to the
Arcwright package. Flow: **profile → research (Sonnet fan-out) → rank → review → install globally → contribute to Arcwright**.

- **Profile first:** detect stack, list installed skills (`.agents/skills/`, `~/.claude/skills/`), derive a gap list. Never re-recommend an installed skill.
- **Research = Sonnet sub-agents, one per gap** via `claude-subagent-protocol` (model: sonnet; never escalate to opus without permission). Each sweeps skills.sh (`GET https://skills.sh/api/v1/skills/search`), GitHub (`gh search code/repos ... SKILL.md`), the wider web (`WebSearch`/`WebFetch`), and local global skills. Returns structured candidates, not prose.
- **Rank:** dedup (trust order local > registry > github > web), drop installed, keep top ~10. State anything dropped (no silent caps).
- **Review gate is mandatory** for registry/github/web skills: show the `SKILL.md` body, `allowed-tools`, any bash/`curl|sh`/network/credential use, AND the license. `local` (trusted) skips the gate.
- **Install globally (offer first):** copy to BOTH `~/.claude/skills/<name>/` (mirror `~/.kiro/skills/` if present) AND `~/.arcwright/.agents/skills/<name>/` if a global Arcwright install exists. Project-only install available on request.
- **Contribute to the package (offer second):** repo is `unn-corp/Arcwright-AI`; base branch is ALWAYS `dev` (main is the locked release branch — never push/PR to it). If `gh api repos/<repo> --jq .permissions.push` is true, push a branch + PR to dev; else fork + PR to dev. Only contribute skills whose license permits redistribution.
- Keep `name`/`description`/`allowed-tools` frontmatter intact for Claude+Kiro portability. Authoring new skills is `writing-skills`, not this.
