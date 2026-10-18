<!-- Conditional reference. The current SKILL.md and host policy take precedence. Paths are relative to this skill folder. -->

## Arcwright contract

These rules take precedence over examples and references in this bundle.

- Read the project's `DESIGN.md` before styling. Preserve its visual direction, tokens,
  accessibility requirements, and existing behavior. Use [design-md](../design-md/SKILL.md)
  to persist deliberate decisions. Do not replace an established design system with a random draw.
  For a small change, match the surrounding page; only draw a new direction when the task calls for it.
- No eyebrow, kicker, or overline text above headings. No em dashes in user-facing copy.
  These rules cannot be waived with an allowance or an ignore comment.
- Omit AI/model attribution, generated-by badges, review-model blurbs, and coauthor trailers
  from commits, PRs, comments, and deliverables. Preserve source copyright, licenses,
  and any required photographer, artist, or media credits.
- Keep the installed skill read-only. Notes, copy decks, direction sheets, history,
  downloaded working assets, reports, and standalone browser profiles belong under
  `<project>/_arcwright/_memory/skill-runs/taste-<run>/`. Run from the project root;
  set `TASTE_SKILL_RUN` to one simple name per task and reuse it throughout that task
  (default `default`). All writing helpers accept `--project-root <project>`.
  `--out`, `--to`, and `TASTE_SKILL_HISTORY` must stay under that project's skill-runs area.
  Helpers reject installed skill directories, path escapes, and symlinked outputs.
  Promote selected media into the app's normal asset folder as part of implementation,
  carrying its credits and updating the page's asset URLs.
- In Arcwright Code/T3 Code, prefer the native collaborative browser. Read
  [the browser procedure](references/arcwright-browser.md) for exact calls, tab ownership,
  viewport checks, evidence storage, and the standalone inspector fallback. Do not start
  another browser just because the native preview is initially closed.
- Keep work within the requested page or component. Do not add features, dependencies,
  fabricated business facts, payments, deployments, commits, or publishing steps just
  to satisfy an aesthetic quota. Existing design and accessibility requirements take
  precedence over optional picture counts, motion counts, or house-style preferences.
  Document specific justified exceptions; never hide a broken layout or failed check.
- Use at most three visual critique rounds. Fix the top three substantive problems in
  each round, stopping when the result meets the brief and only optional polish remains.
  Resolve routine choices autonomously; ask only for information or authorization
  that actually blocks the requested work. Report remaining limitations honestly.


A page built by a model usually looks like the average of every page the model has seen: a centred
headline over three lines, a little label above it, a row of icon cards, a soft gradient, a few thin
rules and a monospace caption. Nothing in it is wrong and nothing in it was decided.

This skill replaces those defaults with decisions, in four ways:

1. **A script deals the directions, you choose among them.** Asked to invent a look, a model picks
   the category default every time. `scripts/draw.mjs` deals three of twenty researched directions;
   you choose the one that carries the subject's idea, and the script then deals its type system,
   palette, hero and section compositions from a library distilled from 247 real sites.
2. **The idea comes from the subject.** In the study, what separated the best sites from the forgettable
   ones was a concept taken from the thing itself, not the styling.
3. **A house style with no ornaments,** measured in a real browser by `scripts/inspect.mjs`, so the
   rules are checked rather than hoped for.
4. **You look at what you made.** Screenshots at three widths, a juror's rubric, fix, look again.

One warning learned in testing. Taking the ornaments away is only half the job; a page that has lost its
labels, rules and cards and gained nothing in their place reads as thin, and blind jurors rightly prefer
a richer page with tells over an empty page without them. The other half is substance: type set
larger, whole fields of colour, real pictures of this subject's world (found or drawn), and every
section carrying its full content. The skill is built to give you that; do not trade it for restraint.

In the commands below `<skill>` is this skill's folder. Run them from the project's root, so the
working files land in `_arcwright/_memory/skill-runs/taste-<run>/` there. Direction drawing,
source lint, and asset discovery need Node 18+; the optional standalone inspector needs Node 22+
and an installed Chrome, Edge, or Chromium. The scripts install nothing. `assets.mjs` also
needs network access; it uses no API keys.
