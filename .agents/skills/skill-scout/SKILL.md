---
name: skill-scout
description: Discover agent skills for a codebase by fanning out Sonnet sub-agents to research the internet (skills.sh registry, GitHub, the wider web), rank them against the project's capability gaps, show a review gate for third-party skills, then offer to install the chosen ones GLOBALLY and contribute them back to the Arcwright package (unn-corp/Arcwright-AI) via a PR to the dev branch. Use for "find skills for this project", "what skills should I install", "/skill-scout", or any skill-discovery request.
allowed-tools: Read, Grep, Glob, Bash, Write, WebFetch, WebSearch, Agent
---

# Skill Scout

Discover skills worth having for a codebase and (with consent) install them **globally** and
**contribute them back to the Arcwright package**. The flow is
**profile → research (Sonnet fan-out) → rank → review → install globally → contribute to Arcwright**.

Third-party skills (GitHub, registry, web) are never installed without showing their body first:
a `SKILL.md` carries `allowed-tools` and can run bash, so it is a supply-chain surface.

**Repo this skill contributes to:** `unn-corp/Arcwright-AI` · **contribution base branch:** `dev`
(`main` is the locked release branch — never PR or push to it).

---

## 1. Profile the project (capability gaps)

Reuse `project-context` if not already done this session, then detect the stack and derive a
**gap list** — capabilities the project plausibly needs but has no installed skill for.

```bash
ls .agents/skills/ 2>/dev/null                 # already installed — don't re-recommend
cat package.json 2>/dev/null | grep -E '"(react|next|vue|svelte|express|fastify|prisma|drizzle|socket\.io|redis|pg|tailwind)"'
ls requirements.txt pyproject.toml 2>/dev/null && cat requirements.txt pyproject.toml 2>/dev/null | grep -Ei 'fastapi|django|flask|sqlalchemy|pydantic'
ls go.mod Cargo.toml pom.xml build.gradle 2>/dev/null
```

Produce a short gap list of search terms, e.g. `["react performance", "postgres optimization",
"playwright e2e", "stripe payments"]`. Skip any gap already covered by an installed skill.

---

## 2. Research fan-out (Sonnet sub-agents, in parallel)

Dispatch **one `Agent` sub-agent per gap** via `claude-subagent-protocol`, **model: sonnet**
(sonnet-first — do NOT escalate to opus without explicit user permission). Each sub-agent
researches the internet for skills that fill its gap and returns candidates as
`{name, description, source, sourceType, installRef, installs?, url}`.

Each research sub-agent should sweep all of these (it has `WebSearch`, `WebFetch`, `Bash`/`gh`):

- **skills.sh registry** (JSON API, no auth for public skills):
  ```bash
  curl -s "https://skills.sh/api/v1/skills/search?q=$(printf '%s' "react performance" | jq -sRr @uri)&limit=10" | \
    jq -r '.data[] | "\(.source)/\(.slug)\t\(.name)\t\(.installs) installs\t\(.installUrl)"'
  ```
  `installRef` = `<source>` (e.g. `vercel-labs/agent-skills`); record `slug`. `sourceType: "registry"`.
- **GitHub** — code + repo search for `SKILL.md`:
  ```bash
  gh search code "path:**/SKILL.md <gap terms>" --limit 15 --json repository,path 2>/dev/null
  gh search repos "agent skill <gap terms>" --limit 15 --json fullName,description,stargazersCount 2>/dev/null
  ```
  `installRef` = `owner/repo` (+ subpath to the `SKILL.md` dir). `sourceType: "github"`.
- **The wider web** — `WebSearch` for "<gap> claude agent skill" / "awesome claude skills <gap>",
  then `WebFetch` promising results to extract the repo/registry ref. `sourceType: "web"`.
- **Already on the machine** — global skills the user has but this project lacks:
  ```bash
  for d in "$HOME/.claude/skills" "$HOME/.claude/plugins"/*/skills "$HOME/.arcwright"/**/skills; do
    [ -d "$d" ] && find "$d" -name SKILL.md -maxdepth 2 2>/dev/null
  done
  ```
  `sourceType: "local"` (trusted).

Each sub-agent returns its ranked candidates as structured data (not prose). Collect all.

---

## 3. Rank & dedup

- Drop any candidate already installed in `.agents/skills/` or in `~/.claude/skills/` (global).
- Dedup by normalized name; prefer `local` > `registry` > `github` > `web` when the same skill
  appears in several (more-trusted / more-canonical first).
- Score 0-100 against the gap: relevance to the detected stack, `installs`/stars as a weak
  popularity signal, freshness if available.
- Keep the top ~10. **No silent caps** — state how many were dropped.

---

## 4. Present the shortlist

```
| # | Skill | Source | Gap it fills | Score | Trust |
|---|-------|--------|--------------|-------|-------|
| 1 | react-best-practices | skills.sh (vercel-labs) | react performance | 92 | review |
| 2 | playwright-e2e | github (owner/repo) | e2e testing | 84 | review |
```

Trust: `trusted` (local) installs directly; `review` (registry/github/web) requires the gate in
step 5. Ask the user which numbers they want.

---

## 5. Review gate (registry + GitHub + web)

Before copying any third-party skill, fetch and show its `SKILL.md` body so the user sees what it
grants and runs:

```bash
# github: gh api repos/<owner>/<repo>/contents/<path> --jq '.content' | base64 -d
# registry/web: WebFetch the raw SKILL.md URL
```

Surface explicitly: the `allowed-tools` line, any `Bash`/`execute_bash` or piped `curl ... | sh`,
network calls, and credential reads. **Check the license** — note whether it permits
redistribution (MIT/Apache = yes; no license = all-rights-reserved, do NOT vendor into the
Arcwright package; global install for personal use only). If anything looks unsafe, flag it (lean
on `security-review`) and require explicit confirmation. Skip the gate for `local` (trusted).

---

## 6. Install — GLOBAL (offer first)

After the user picks skills, ask: **"Install these globally?"** If yes, stage each chosen skill
into `.agents/skills/<name>/` of a temp staging dir first (fetch by `sourceType`: `npx skills add`
for registry, `git clone --depth 1` for github/web, `cp -r` for local), verify `SKILL.md` has
valid `name`/`description` frontmatter, then install to **both** global targets:

```bash
# A) user-level Claude skills (available in every project)
mkdir -p "$HOME/.claude/skills"
cp -r "<staged>/<name>" "$HOME/.claude/skills/<name>"
# mirror to Kiro if present
[ -d "$HOME/.kiro/skills" ] && cp -r "<staged>/<name>" "$HOME/.kiro/skills/<name>"

# B) the global Arcwright install (if present) so it's part of the managed package set
[ -d "$HOME/.arcwright" ] && { mkdir -p "$HOME/.arcwright/.agents/skills"; \
  cp -r "<staged>/<name>" "$HOME/.arcwright/.agents/skills/<name>"; }
```

(Project-only install is still available on request: copy into `./.agents/skills/<name>` and mirror
to `./.kiro/skills/` if the project uses Kiro.)

---

## 7. Contribute back to the Arcwright package (offer second)

After (or instead of) the global install, ask: **"Add these to the Arcwright package so everyone
gets them?"** Only offer skills whose license permits redistribution (see step 5). If yes, open a
contribution **against the `dev` branch** of `unn-corp/Arcwright-AI` — never `main`.

```bash
REPO=unn-corp/Arcwright-AI
# 1. Can the user push to the repo?
CAN_PUSH=$(gh api repos/$REPO --jq '.permissions.push' 2>/dev/null)

work=$(mktemp -d)
if [ "$CAN_PUSH" = "true" ]; then
  gh repo clone "$REPO" "$work" -- --depth 1 --branch dev
  REMOTE=origin
else
  # No write access: fork, then work on the fork
  gh repo fork "$REPO" --clone=false 2>/dev/null
  ME=$(gh api user --jq .login)
  gh repo clone "$ME/Arcwright-AI" "$work" -- --depth 1
  git -C "$work" remote add upstream "https://github.com/$REPO.git"
  REMOTE=origin
fi

branch="skill-scout/add-$(printf '%s' '<name>' | tr ' /' '--')"
git -C "$work" checkout -b "$branch" 2>/dev/null || git -C "$work" checkout -b "$branch" dev

# Add each skill into the package source of truth
for n in <chosen names>; do
  cp -r "<staged>/$n" "$work/.agents/skills/$n"
done

git -C "$work" add .agents/skills/
git -C "$work" commit -m "feat(skills): add <names> via skill-scout"
git -C "$work" push -u "$REMOTE" "$branch"

# PR ALWAYS targets dev (main is locked)
gh pr create --repo "$REPO" --base dev --head "$(gh api user --jq .login):$branch" \
  --title "feat(skills): add <names>" \
  --body "Discovered by /skill-scout for <gap>. Source: <sourceType/installRef>. License: <license>. Review gate: passed."
rm -rf "$work"
```

Rules for this step:
- **Base branch is always `dev`.** `main` is the locked release branch; do not push or PR to it.
- If `CAN_PUSH=true`: push the branch to the repo and PR `dev` <- branch.
- If not: fork, push to the fork, PR `unn-corp/Arcwright-AI:dev` <- `fork:branch`.
- Do NOT contribute skills that have no redistribution license — those are global-install-only.
- A maintainer still reviews the PR; after it merges to `dev` (and later to `main`), the skill ships
  in the package and lands in managed installs on the next `arcwright update`.

---

## 8. Report

Summarize: discovered (per source), installed globally (paths), contributed (PR URLs / branch),
and anything skipped (failed gate, no license, duplicate, low score). Remind the user that globally
installed skills are picked up next session, and that merged package PRs reach everyone on the next
`arcwright update`.

## Notes

- **Sonnet-first.** Research sub-agents run on sonnet; ask before escalating any to opus.
- **No silent caps** — if a search returns more than the kept top-N, say how many were dropped.
- **License gates the package contribution**, not the personal global install.
- Frontmatter contract for portability: every installed skill keeps `name`, `description`, and (if
  it uses tools) `allowed-tools` so it works in both Claude Code and Kiro.
- This skill discovers and installs; it does not author skills — use `writing-skills` for that.
