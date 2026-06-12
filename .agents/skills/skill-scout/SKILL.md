---
name: skill-scout
description: Discover and install agent skills for the current project. Profiles the stack, then fans out across four sources (skills.sh registry, GitHub, local global skills, the Arcwright catalog), ranks candidates against detected capability gaps, shows a review gate for third-party skills, and installs the chosen ones at project level into .agents/skills/ (mirrored to .kiro/skills/ when present). Use for "find skills for this project", "what skills should I install", "/skill-scout", or any skill-discovery request.
allowed-tools: Read, Grep, Glob, Bash, Write, WebFetch, Agent
---

# Skill Scout

Discover skills worth having on a project and install them at project level. Treats
skills.sh as a package registry and adds three more sources: GitHub, local global
skills already on the machine, and the Arcwright bundled catalog.

The flow is **profile → search → rank → review → install**. Third-party skills (GitHub,
registry) are never installed without showing their body first — a `SKILL.md` carries
`allowed-tools` and can run bash, so it is a supply-chain surface.

---

## 1. Profile the project (capability gaps)

Reuse `project-context` if not already done this session, then detect the stack and
derive a gap list — capabilities the project plausibly needs but has no installed skill for.

```bash
# What is already installed (don't re-recommend these)
ls .agents/skills/ 2>/dev/null

# Stack signals
cat package.json 2>/dev/null | grep -E '"(react|next|vue|svelte|express|fastify|prisma|drizzle|socket\.io|redis|pg|tailwind)"'
ls requirements.txt pyproject.toml 2>/dev/null && cat requirements.txt pyproject.toml 2>/dev/null | grep -Ei 'fastapi|django|flask|sqlalchemy|pydantic'
ls go.mod Cargo.toml pom.xml build.gradle 2>/dev/null
```

Produce a short **gap list** of search terms, e.g. `["react performance", "postgres
optimization", "playwright e2e", "stripe payments"]`. Each gap drives the searches below.
Skip any gap already covered by an installed skill.

---

## 2. Fan-out search (all four sources, in parallel)

Run the four source queries concurrently. For non-trivial gap lists, dispatch one
`Agent` sub-agent per source via the `claude-subagent-protocol` (sonnet-first); each
returns candidates as `{name, description, source, sourceType, installRef, installs?}`.
For a single gap you can run them inline.

### Source A — skills.sh registry (JSON API)

Real search endpoint, no auth needed for public skills:

```bash
# one call per gap term; q must be >= 2 chars, limit 1-200
curl -s "https://skills.sh/api/v1/skills/search?q=$(printf '%s' "react performance" | jq -sRr @uri)&limit=10" | \
  jq -r '.data[] | "\(.source)/\(.slug)\t\(.name)\t\(.installs) installs\t\(.installUrl)"'
```

Response shape: `{ data: [{ id, slug, name, source, installs, sourceType, installUrl, url }], ... }`.
`installRef` = `<source>` (e.g. `expo/skills`); record `slug` to identify the specific skill.

### Source B — GitHub

```bash
gh search repos "agent skill SKILL.md" --limit 15 --json fullName,description,stargazersCount 2>/dev/null
gh search code "path:**/SKILL.md react performance" --limit 15 --json repository,path 2>/dev/null
```

`installRef` = `owner/repo` (+ subpath to the `SKILL.md` dir). `sourceType: "github"`.

### Source C — local global skills already on the machine

Promote skills the user already has globally but hasn't added to this project:

```bash
for d in "$HOME/.claude/skills" "$HOME/.claude/plugins"/*/skills; do
  [ -d "$d" ] && find "$d" -name SKILL.md -maxdepth 2 2>/dev/null
done
```

For each, read the `name`/`description` frontmatter. `installRef` = absolute dir path.
`sourceType: "local"`.

### Source D — Arcwright bundled catalog

The 54+ skills shipped with Arcwright. Recommend ones relevant to the gaps that aren't
installed in *this* project. Source of truth is the installed global package or this repo's
`.agents/skills/`:

```bash
ls "$HOME/.arcwright"/**/skills 2>/dev/null; ls .agents/skills/ 2>/dev/null
```

`installRef` = the catalog skill dir. `sourceType: "arcwright"`.

---

## 3. Rank & dedup

- Drop any candidate whose `name` matches an already-installed skill in `.agents/skills/`.
- Dedup across sources by normalized name; prefer `arcwright` > `local` > `registry` > `github`
  when the same skill appears in several (trusted-first).
- Score each remaining candidate 0-100 against the gap it answers: relevance to detected
  stack, `installs`/stars as a weak popularity signal, and freshness if available.
- Keep the top ~10. Note anything dropped so the count isn't silently truncated.

---

## 4. Present the shortlist

Markdown table, ranked, with source + one-line rationale:

```
| # | Skill | Source | Gap it fills | Score | Trust |
|---|-------|--------|--------------|-------|-------|
| 1 | react-best-practices | skills.sh (vercel-labs) | react performance | 92 | review |
| 2 | postgresql-optimization | arcwright catalog | postgres tuning | 88 | trusted |
```

Trust column: `trusted` (arcwright/local) installs directly; `review` (registry/github)
requires the gate in step 5. Ask the user which numbers to install.

---

## 5. Review gate (registry + GitHub only)

Before copying any third-party skill, fetch and show its `SKILL.md` body so the user sees
what tools it grants and what bash it runs:

```bash
# registry: resolve to its repo, then the raw SKILL.md
# github: gh api repos/<owner>/<repo>/contents/<path> --jq '.content' | base64 -d
```

Surface, explicitly:
- the `allowed-tools` frontmatter line,
- any `Bash`/`execute_bash` usage or piped `curl ... | sh`,
- network calls and credential reads.

If anything looks unsafe, flag it (lean on `security-review`) and require explicit
confirmation. Skip the gate for `trusted` sources.

---

## 6. Install at project level

Route by `sourceType`. All installs land in `.agents/skills/<name>/` (the dual-format
source for Claude Code + Kiro). If `.kiro/skills/` exists in the project, mirror the dir
there too, unchanged.

```bash
mkdir -p .agents/skills

# A) registry
npx skills add <installRef>          # e.g. npx skills add vercel-labs/agent-skills
#    if it lands outside .agents/skills/, move the skill dir in.

# B) github  (after review gate)
tmp=$(mktemp -d); git clone --depth 1 https://github.com/<owner>/<repo> "$tmp"
cp -r "$tmp/<path-to-skill-dir>" ".agents/skills/<name>"; rm -rf "$tmp"

# C) local global
cp -r "<installRef-dir>" ".agents/skills/<name>"

# D) arcwright catalog
cp -r "<catalog-dir>/<name>" ".agents/skills/<name>"

# mirror to Kiro if the project uses it
[ -d .kiro/skills ] && cp -r ".agents/skills/<name>" ".kiro/skills/<name>"
```

Verify each install: `SKILL.md` present with valid `name`/`description` frontmatter.

---

## 7. Report

Summarize what was installed, from which source, into which paths, plus anything skipped
(failed gate, duplicate, low score). Remind the user that newly added skills are picked
up next session, and that they can re-run `/skill-scout` after the stack changes.

## Notes

- **No silent caps** — if a search returns more than the kept top-N, say how many were dropped.
- Frontmatter contract for portability: every installed skill must keep `name`, `description`,
  and (if it uses tools) `allowed-tools` so it works in both Claude Code and Kiro.
- This skill discovers and installs; it does not author skills — use `writing-skills` for that.
