# Skills, commands, and agent cleanup

All six approved cleanup items are implemented. Stable invocation names, model
invocation, task authorization, source notices, and installation choices remain
in force. Measurements below are UTF-8 file sizes.

## Changes

| Item | Result |
| --- | --- |
| Review-loop menu | Dev's `RL` explicitly invokes the canonical skill, including initial model selection. Story/code-review workflows retain their own stages. |
| Forwarding commands | 141 additional description-only forwarding commands can resolve directly. Original command and source hashes protect customizations; extra instructions or metadata keep the authored command route. |
| Recipe-heavy skills | Codable Patterns, MapKit Location, and Background Processing retain their decisions and lifecycle constraints inline, with 14 conditional topic references. |
| Agent menus | All 17 profiles reference conditional module help resources. All 303 menu command IDs, order, and workflow/resource mappings remain available. |
| Application instructions | Detailed delivery, identity, retention, maintenance, version, and launcher rules moved into `t3code/AGENTS.md`; the root requires reading them before app work. |
| Discovery metadata | One dependency-free helper supplies descriptions, names, invocation policy, and optional-module classification to source audits, portable helpers, installer filters, and launcher generation. |

The installed checks exposed an additional packaging issue: generated launchers
could replace maintained delivery mode sentences. The build now preserves source
Markdown launchers verbatim and adapts their operative body for Kiro. Full Send
and Full Stop retain their explicit modes in portable and native entrypoints.

## Initial-load footprint

| Surface | Before | After |
| --- | ---: | ---: |
| Codable Patterns | 15,602 B | 3,689 B |
| MapKit Location | 15,456 B | 3,830 B |
| Background Processing | 15,306 B | 5,532 B |
| Three skill entrypoints | 46,364 B | 13,051 B |
| 17 agent profiles | 147,122 B | 86,271 B |
| Root AGENTS.md | 8,321 B | 5,442 B |

The three skill entrypoints shrink 71.9%, and agent profiles shrink 41.4%.
All 58 original code blocks and substantive recipe sections remain reachable;
existing reference files and frontmatter are unchanged. Menu help loads for
navigation, explicit menu commands, needed workflow routing, or no-action help.
Ordinary task execution keeps its compact role instructions.

The library is not loaded together. These measurements do not establish token,
billing, latency, or model-quality gains. Full menus and recipes remain on disk.

## Validation

- Focused routing and packaging checks reproduce the old wrapper hop and lost
  delivery mode text, then pass with the fixes. Customized commands, permission
  metadata, stale guards, optional packs, and missing menu resources retain their
  intended boundaries.
- Full package coverage gates pass all 373 tests. The package build and dry run
  include the shared helper, conditional menus, and references.
- Preservation checks cover all 303 menu commands, 58 code blocks, original
  frontmatter/references, and moved application hard rules. The app documentation
  checker passes all ten guides.
- Reviewed footprints and model-invocation checks pass for all 281 source skills;
  provenance checks pass for 36 source families with upstream pins unchanged.
- Installed verification checks five skill scopes, owned profiles and conditional
  help, capability briefs, direct forwarding, delivery modes, and manifest hashes.
  Each scope resolves all 122 enabled forwarding commands directly; all 16
  installed profiles reach their menu help. The optional AWS profile stays absent.
  All eight native delivery entrypoints retain their modes. Checked 3,045 manifest
  entries, with 220 shared skill names and zero entrypoint drift. Saved choices
  and personal customizations remain protected.

The independent audit found no substantive issue in routing, filtering, menu
reachability, or the final launcher preservation change. Validation uses static
preservation and executable helper/package checks; a complete live native-host
UI matrix was not run. No application build, release, publication, commit, or push
was commissioned by this maintenance task.
