---
name: design-taste-frontend
description: Art direction and visual review for landing pages, marketing sites, portfolios, and product pages. Use to build, redesign, or polish a public page; not dashboards or app screens.
---

# Taste frontend design

Read the project's `DESIGN.md` and preserve its established direction, tokens,
accessibility, and working behavior. Match existing components for a small edit;
draw a new art direction only when the task calls for one.

## Work within the brief

1. Inventory the real subject, audience, primary action, stack, content, and available
   imagery. Resolve routine choices yourself; ask only for a fact that blocks the result.
2. Write the argument as section claims and evidence, then a complete copy deck.
   Never invent customers, reviews, statistics, or real business details.
3. For a new direction, use `node "<skill>/scripts/draw.mjs" --sector <sector> --brief "<brief>"
   --sections <roles> --options 3`, choose what fits the subject, then deal it with
   `--direction <id>` and the same arguments. Use `--keep palette,type` for an existing
   brand. State a reason for a redraw; do not randomize until the familiar option appears.
4. Build with tokens, clear type hierarchy, full content, honest imagery, semantic
   controls, visible focus, responsive composition, and reduced-motion support.
   Use the detailed run guide below only for the step you are executing.
5. Run `node "<skill>/scripts/lint.mjs" <changed source>`. Follow the
   [native browser procedure](references/arcwright-browser.md) at 1440, 768, and 390px.
   Inspect the actual screenshots and interactions, fix the top three substantive
   issues, and repeat for at most three visual critique rounds.
6. Report the result, checks actually observed, justified exceptions, remaining
   limitations, and required media credits. Use [the critique rubric](references/critique.md)
   when evaluating composition; passing a source scanner alone does not prove the page works.

## Rules that survive every direction

No eyebrow/kicker/overline above headings and no em dashes in user-facing copy.
No AI/model attribution in deliverables; retain required source and media credits.
Read [imagery](references/imagery.md) before sourcing or promoting media and
[the source notes](UPSTREAM.md) when maintaining this skill.

Keep the installed bundle read-only. Set `TASTE_SKILL_RUN` to one simple task name
and reuse it throughout the task. Drawing, working assets, history, notes, and
standalone browser profiles use `<project>/_arcwright/_memory/skill-runs/taste-<run>/`
(default `taste-default`). Run helpers from the project root or pass
`--project-root <project>`. Output overrides must stay under its skill-runs area;
helpers reject path escapes and symlinks. Native captures use host evidence storage;
the standalone inspector supports `--evidence-dir <host directory>` for captures.
Promote final assets to the app's normal asset folder with their credits.

Drawing, lint, and asset discovery need Node 18+; asset discovery needs network
access. The optional standalone inspector needs Node 22+ and Chrome/Edge/Chromium.
Prefer native Arcwright Code/T3 Code preview tools. Do not add features, dependencies,
extra imagery, or motion merely to satisfy an aesthetic quota. Established design,
accessibility, and user requirements take precedence over optional style preferences.
No publication, deployment, or tracker work is implied.

## Conditional detail

Load only the guide for the current decision, then any specific reference it names.
Do not preload all guides or repeat their examples in the output.

| Topic | Guide |
| --- | --- |
| Taste v2 for Arcwright | [guide-00-taste-v2-for-arcwright.md](guide-00-taste-v2-for-arcwright.md) |
| Arcwright contract | [guide-01-arcwright-contract.md](guide-01-arcwright-contract.md) |
| The run | [guide-02-the-run.md](guide-02-the-run.md) |
| House rules | [guide-03-house-rules.md](guide-03-house-rules.md) |
| Laws of the craft | [guide-04-laws-of-the-craft.md](guide-04-laws-of-the-craft.md) |
| Special cases | [guide-05-special-cases.md](guide-05-special-cases.md) |
| Files | [guide-06-files.md](guide-06-files.md) |
