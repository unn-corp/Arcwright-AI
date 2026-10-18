# Sources: design-md

The `design-md` skill teaches the **DESIGN.md** format from **google-labs-code/design.md**
(https://github.com/google-labs-code/design.md), an open format for describing a product's
visual design system in a single self-contained file so it persists across AI design
sessions, agents, and tools.

- **Upstream:** https://github.com/google-labs-code/design.md
- **License:** Apache License 2.0
- **Companion CLI:** `@google/design.md` on npm (`lint`, `diff`, `export`, `spec`)

The skill distills the format spec (`docs/spec.md`), philosophy (`PHILOSOPHY.md`), and the
worked examples (`examples/`) into an authoring-and-reference protocol in Arcwright's own
words. No upstream text is copied verbatim.

| Skill dir | Topic | Primary source |
|-----------|-------|----------------|
| `design-md` | DESIGN.md format, token schema, section order, create/reference/update protocol | `README.md`, `docs/spec.md`, `PHILOSOPHY.md`, `examples/paws-and-paths/DESIGN.md` |

## Maintenance

The format is at version `alpha` upstream and may add token categories or sections. When
refreshing, re-read `docs/spec.md` and the `examples/`, and re-run the token-schema and
section-order lists against the current spec. The `@google/design.md` CLI surface (subcommand
names, export formats) can change, verify against the current README before documenting flags.

## Reviewed format revision

Checked `6e5da5382f41edbba9d73b2c62f33f32e9971f15` (October 16, 2026), `docs/spec.md`: frontmatter and interleaved YAML blocks share one token tree, duplicate top-level keys are errors, and `omitted` records intentional section omissions. Arcwright retains its root canonicality, self-contained values, and copy preferences. This is an independently worded protocol; no upstream runtime or dependency is bundled.
