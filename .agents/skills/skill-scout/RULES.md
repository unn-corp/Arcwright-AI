# Skill Scout — Quick Rules

Discover + install agent skills for a project. Flow: **profile → search → rank → review → install**.

- **Four sources:** skills.sh registry (`GET https://skills.sh/api/v1/skills/search?q=&limit=`, JSON),
  GitHub (`gh search repos/code ... SKILL.md`), local global (`~/.claude/skills`, `~/.claude/plugins/*/skills`),
  Arcwright catalog (`~/.arcwright/**/skills`, `.agents/skills/`).
- **Profile first:** detect stack, list installed skills in `.agents/skills/`, derive a gap list of search terms.
  Never re-recommend an already-installed skill.
- **Rank:** dedup across sources (trust order arcwright > local > registry > github), drop installed, keep top ~10, score vs gaps. State anything dropped.
- **Review gate is mandatory** for registry + GitHub skills: show the `SKILL.md` body, the `allowed-tools` line,
  and any bash/`curl|sh`/network/credential use before copying. `trusted` (arcwright/local) skips the gate.
- **Install target:** `.agents/skills/<name>/`; mirror to `.kiro/skills/<name>/` if that dir exists.
  Registry via `npx skills add`; others via clone/copy. Keep `name`/`description`/`allowed-tools` frontmatter intact.
- Discovers + installs only — authoring new skills is `writing-skills`. Multi-gap searches fan out via `claude-subagent-protocol` (sonnet-first).
