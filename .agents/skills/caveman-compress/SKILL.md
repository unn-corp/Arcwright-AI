---
name: caveman-compress
description: >
  Retro-compress an existing verbose natural-language file (AGENTS.md, host instructions, memory files,
  specs, briefs, notes) into caveman format to save input tokens on every reload.
  Preserves all code, paths, URLs, IDs, and structure. Trigger: /caveman-compress FILEPATH
  or "compress this doc / memory file".
---

# Caveman Compress

Compress an existing prose-heavy file into caveman-speak to cut input tokens on reload.
Apply the `caveman` skill's rules to a file that already exists, rather than to new output.

## When to use

- A `.planning/`, `_arcwright-output/`, or memory file has grown verbose.
- An agent-instruction / config-prose file reloads on every turn and is bloated.
- A spec/brief/report was written before caveman discipline and now wastes context.

## Process

1. Read the target file.
2. Save a human-readable backup as `<filename>.original.md` (skip if `.original.md`
   already exists — never compress a backup).
3. Rewrite prose using `caveman` rules (default level **full**).
4. Write the compressed version over the original. Report before/after rough token delta.

## Compress

- Remove: articles, filler (just/really/basically/actually/simply/essentially/generally),
  pleasantries, hedging (it might be worth / you could consider), connective fluff
  (however/furthermore/additionally), redundant phrasing (in order to → to).
- Short synonyms; fragments OK; drop "you should / make sure to / remember to".
- Merge bullets that say the same thing. Keep one example where several show one pattern.

## Preserve EXACTLY (read-only regions)

Code blocks (fenced + indented), inline `code`, URLs/links, file paths, commands,
technical/proper nouns, dates, versions, numbers, env vars, requirement/decision IDs.
Keep all headings (exact text), list nesting, numbering, table structure, frontmatter.

If unsure whether something is code or prose → leave unchanged.

## Boundaries

- ONLY compress prose files: `.md`, `.txt`, extensionless.
- NEVER modify: `.py`, `.js`, `.ts`, `.json`, `.yaml/.yml`, `.toml`, `.env`, `.lock`,
  `.css`, `.html`, `.xml`, `.sql`, `.sh`.
- Mixed prose+code file: compress prose only, treat code as read-only.
- Never compress `*.original.md` backups.

## Pattern

Original:
> You should always make sure to run the test suite before pushing changes to the main
> branch. This is important because it helps catch bugs early and prevents broken builds.

Compressed:
> Run tests before push to main. Catch bugs early, prevent broken prod deploys.
