---
name: caveman-compress
description: "Compress an explicitly named prose file while preserving code, structure, facts, and negations. Keep a recoverable backup outside instruction and skill loader folders. Use for /caveman-compress FILEPATH or a request to compress a document."
---

# Caveman Compress

Compress an existing prose artifact using [caveman](../caveman/SKILL.md).
Adapted from Caveman 4.0.1; see [source and license notes](UPSTREAM.md).
Use the active host's normal file tools and model. This adaptation does not run
upstream's subprocess compression scripts or configure an additional provider.

## Process

1. Resolve the explicit target path and the requested scope. If raw text was
   supplied instead of a file, use the current text request without overwriting
   an inferred file; ask for a path only if a file rewrite is required.
2. Reject secret-bearing files such as `.env`, credentials, secrets, `.netrc`,
   private keys, and authentication stores before reading them. Use the session's
   existing data-handling rules for ordinary prose.
3. Read the target and check applicable instructions. Save an exact backup outside
   all skill and instruction loader trees before editing. Use host-managed evidence
   storage when available; otherwise use `$XDG_DATA_HOME/caveman-compress/backups/`
   (default `~/.local/share/caveman-compress/backups/`) or
   `%LOCALAPPDATA%\caveman-compress\backups\` on Windows. Use a unique run directory
   and record the original absolute path. Never overwrite an earlier backup.
4. Draft the compressed prose at full intensity. Preserve technical payloads,
   code, meaning, facts, conditions, negations, IDs, and Markdown structure exactly.
   Never insert commentary about the request into the saved artifact.
5. Compare the draft with the backup. Check read-only regions byte for byte and
   verify that requirements, qualifiers, numbers, sequence, and exceptions survived.
   If validation fails, repair the draft or leave the source untouched.
6. Replace the target only after those checks pass. Report the backup path and
   measured before/after bytes or words. Label estimates; do not claim exact token
   or cost savings without measurements from the actual tokenizer or provider.

## Boundaries

- Compress only prose files: `.md`, `.txt`, `.typ`, `.typst`, `.tex`, or explicitly
  identified extensionless prose. Leave embedded syntax and markup unchanged.
- Never rewrite source code, scripts, JSON, YAML, TOML, `.env`, lockfiles, CSS,
  HTML, XML, SQL, or binary files using this procedure.
- Code blocks, inline code, paths, commands, URLs, links, environment variables,
  API names, dates, versions, units, IDs, and quoted errors are read-only regions.
- Keep heading text, list nesting, numbering, table structure, and frontmatter.
- Never compress `*.original.md`, backup directories, or the backup from this run.
- If prose versus syntax is ambiguous, leave it unchanged.
- Do not rewrite unrelated files or activate a session-wide writing mode.
