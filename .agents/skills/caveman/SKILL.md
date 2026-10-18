---
name: caveman
description: "Compress a documentation artifact or use an explicitly requested caveman writing mode. Preserve technical details and the user's readability requirements."
---

# Caveman — Concise Output Discipline

Write terse like smart caveman. All technical substance stay. Only fluff die.

Arcwright agents generate many artifacts that later get re-read into context (specs,
PRDs, research, decision-logs, LEARNINGS). Every word costs tokens on every reload.
Use this skill when the requested artifact benefits from explicit compression, or
the user selects this writing mode. Ordinary short answers do not require an extra
style-skill read. Preserve the user's and host's tone and readability requirements.

> Scope: this skill governs how you WRITE artifacts. It is NOT `writing-skills` (that one
> is for authoring SKILL.md files). It pairs with `documentation-standards.md` (CommonMark,
> no time estimates) — caveman sets concision, documentation-standards sets structure.

## Persistence

Active for the entire artifact once invoked. No filler drift mid-document. Default level
**full**. Switch with `/caveman lite|full|ultra` or a note in the task.

## Rules

Drop: articles (a/an/the), filler (just/really/basically/actually/simply/essentially),
pleasantries (sure/certainly/happy to/I'd recommend), hedging (it might be worth/you could
consider). Fragments OK. Short synonyms (big not extensive, fix not "implement a solution
for", use not utilize). "in order to" → "to". "make sure to" → "ensure".

Pattern: `[thing] [action] [reason]. [next step].`

- Not: "Sure! The issue you're experiencing is likely caused by the authentication
  middleware, which appears to be checking token expiry incorrectly."
- Yes: "Bug in auth middleware. Token expiry check uses `<` not `<=`. Fix:"

## Preserve EXACTLY (never compress)

- Code blocks (fenced + indented), inline `code`
- File paths, commands, URLs/links, env vars
- Technical terms, API/function names, proper nouns
- Dates, version numbers, numeric values, error strings (quote exact)
- Requirement IDs, decision IDs (FR-001, D-01, SC-001), capability IDs
- Markdown structure: headings, list nesting, table structure, frontmatter

## Intensity

| Level | What changes |
|-------|------|
| **lite** | No filler/hedging. Keep articles + full sentences. Professional but tight. Use for user-facing docs (README, public guides). |
| **full** | Drop articles, fragments OK, short synonyms. Default for internal artifacts (specs, PRDs, research, plans, decision-logs). |
| **ultra** | Abbreviate prose words (DB/auth/config/req/impl), arrows for causality (X → Y), one word when one word enough. Code/API/error strings never abbreviated. Use for scratch notes + LEARNINGS. |

Example — "Why does the component re-render?"
- lite: "The component re-renders because a new object reference is created each render. Wrap it in `useMemo`."
- full: "New object ref each render → re-render. Wrap in `useMemo`."
- ultra: "Inline obj prop → new ref → re-render. `useMemo`."

## Auto-Clarity (drop caveman, write normal)

Switch back to clear full language when:
- Security warnings or risk callouts
- Irreversible / destructive action confirmations
- Multi-step sequences where fragment order or omitted conjunctions risk misread
- Compression itself creates ambiguity (e.g. "migrate table drop column backup first" —
  order unclear without articles/conjunctions)
- User asks to clarify or repeats a question

Handle the critical part completely in clear language, then resume caveman.

## Boundaries

- Code, commit messages, PR descriptions: follow their own conventions (commits stay
  conventional-commit format; code comments stay readable).
- "stop caveman" / "normal mode": revert for the rest of the turn.
- Never sacrifice a load-bearing fact to save a token. Concise ≠ incomplete.

See `RULES.md` for the quick checklist. See `caveman-compress` to retro-compress an
existing verbose artifact or memory file.
