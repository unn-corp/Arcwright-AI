# Taste source and adaptations

Source: [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill/tree/f624f37a8c650b9cc550253104925efe4c8de246/skills/taste-skill),
revision `f624f37a8c650b9cc550253104925efe4c8de246`, reviewed October 17, 2026.
The default v2 skill is named `design-taste-frontend`. The repository's alternative
styles, image-generation skills, plugins, and install scripts are separate and are
not dependencies of this skill.

The MIT [license](LICENSE) retains Leonxlnx's copyright. Photographs, fonts, and
downloaded media have their own terms. Preserve the source links and required media
credits; omitting AI attribution does not remove third-party copyright obligations.

Arcwright preserves the direction and composition libraries, references, base
assets, evaluation briefs, and zero-dependency helpers. Local adaptations:

- Established `DESIGN.md`, requested scope, accessibility, no eyebrows, no em dashes,
  and the user's output-attribution preference take precedence over aesthetic defaults.
- Native collaborative preview tools take priority over the standalone browser.
- Working output, draw history, downloaded media, and standalone browser profiles
  use the active project's Arcwright skill-runs area. Output overrides are bounded
  to it and reject symlinks or installed skill directories.
- The source scanner skips Arcwright runtime output and enforces the no-em-dash
  rule. The browser rule engine cannot waive the no-eyebrow rule.
- Review is bounded to three rounds. Existing design systems and user requirements
  can justify specific aesthetic exceptions without prompting for routine choices.

The workshop's `docs/skill-sources.json` records the immutable upstream identities
and the adapted local identities separately. Updating local hashes does not change
the upstream pin. Review upstream diffs and rerun helper, reference, and packaging
checks before updating it.
