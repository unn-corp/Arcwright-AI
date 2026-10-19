---
name: caveman
description: "Use an explicitly requested concise writing mode or compress a prose artifact. Answer first, remove filler, and preserve every fact, technical detail, and readability requirement."
---

# Caveman

Answer first. Remove filler. Keep every fact. Clarity beats compression.
Adapted from Caveman 4.0.1; see [source and license notes](UPSTREAM.md).

Use when the user selects this mode or requests a compressed artifact. Ordinary
short replies need no extra style-skill read. Installing or reading this skill for
maintenance does not activate a mode. Host instructions and user readability,
language, and reporting requirements govern the output.

## Scope and persistence

An explicitly selected chat mode persists for the session until "normal mode",
"stop caveman", or `/caveman off`. Artifact compression applies only to the
requested artifact. `/caveman status` reports the mode actually used; it does not
activate one. Without host state, report that the mode is not tracked; never infer
activation from an installed skill or configured default.

`/caveman lite|full|ultra` selects intensity; default **full**. These are local
Arcwright levels, with no dependency on upstream's separate mode skills.

| Level | Behavior |
| --- | --- |
| lite | Remove ceremony and filler. Keep full sentences and articles. |
| full | Use short words and clear fragments where they read in one pass. |
| ultra | Use the shortest unambiguous phrasing for explicitly requested scratch notes. No invented abbreviations. |

## Writing rules

- Lead with the answer, then its reason and needed next step.
- Remove greetings, pleasantries, filler, repetitive recaps, and empty closers.
  Preserve uncertainty when it changes the meaning or confidence of a claim.
- Prefer "fix", "use", and "to" over longer equivalents. Standard technical
  acronyms are fine; invented shorthand usually costs clarity.
- Omit articles only when the sentence still reads in one pass. Prefer one idea
  per sentence, active verbs, and pronouns with clear referents.
- Preserve every negation, condition, exception, requirement, number, and unit.
  Never drop "not", "never", "no", "only", or "except" to shorten a sentence.
- Follow the user's language. Quoted text does not select the reply language.
- Do not perform a persona, add mode prefixes, or provide duplicate versions.
  If plain wording is shorter or clearer, use it.
- Follow the host's required progress updates, questions, and final format.
  A style mode does not suppress required communication.

Pattern: `[thing] [action] [reason]. [next step].`

Example: "Auth middleware uses `<` instead of `<=` for token expiry. Fix:"

## Preserve exactly

Code blocks, inline code, commands, paths, URLs, links, environment variables,
API names, technical terms, proper nouns, dates, versions, numeric values, units,
quoted errors, and requirement/decision/capability IDs stay intact. Keep Markdown
headings, list hierarchy, tables, and frontmatter. Existing code and comments are
payload; a writing mode does not authorize editing them.

## Use full sentences when needed

Use plain prose for user questions, confusing sequences, security explanations,
consequential decisions, or a user who is confused. Preserve the session's existing
authorization; compression creates no additional approval requirement.

Write persisted code, comments, commits, PRs, issues, external messages, and shared
documentation in their required style. Compress a persisted prose artifact only
when the task explicitly calls for it; use [caveman-compress](../caveman-compress/SKILL.md)
for an existing file. No fixed token or cost savings are promised.

Before sending, check that every fact and qualifier survived, technical payloads
are exact, and no sentence has two plausible meanings.
