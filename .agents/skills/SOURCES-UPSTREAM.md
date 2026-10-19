# Upstream source maintenance

Arcwright combines curated upstream material with local workflows and adapters. A version number or active repository alone does not establish which files changed. Preserve the license and source notices shipped with each skill, including additional terms in nested collections. The package's license does not replace those terms.

The October 16 audit and October 17 refresh record 35 source families with canonical repositories, immutable revisions, source paths, licenses, local adaptations, and SHA-256 file identities. The workshop maintains the complete record in `docs/skill-sources.json`, with the audit and implementation notes under `docs/research/`. These records distinguish a reviewed source from a wholesale import and an unchanged curated pack from an API revalidation.

The subsequent Taste v2 installation adds the `taste-skill` source family, pinned to its reviewed revision. Its [local source notes](design-taste-frontend/UPSTREAM.md) document the complete default skill and Arcwright-specific adaptations. The October 19 skill refresh adds Caveman 4.0.1 and Ponytail 5.3.2 with licenses, immutable revisions, and local adaptation notes. The current source manifest contains 38 families.

For deliberate updates, read the pinned source, inspect semantic differences and its license, preserve Arcwright namespaces and optional pack choices, and test changed helpers and meaningful behaviors. Keep valid host metadata, native/T3 routing, existing authorization, and the user's output-attribution preferences. Source/license notices remain necessary even when generated commits, PRs, comments, and artifacts omit AI attribution.

The Matt Pocock family is maintained as local Arcwright source under `matt-pocock*/`, including its scripts, templates, references, and licenses. Its upstream revision and hashes record origin; they do not require a Git submodule or automatic regeneration. Edit the local versions directly for authorized maintenance. Collie's setup guide is also maintained locally. The Herdr skill is retired; its standalone application's opt-in configuration remains separate from skill installation.

Do not import a replacement bootloader, tracker, cloud setup, recurring task, model choice, publication step, or incompatible prerelease as a side effect of refreshing a reference. Use installed-version guidance or an explicit compatibility adapter where upstream's architecture changed. Do not copy material whose terms do not permit the intended use.

The build checks required sidecars and declared local Markdown resources, including sibling skills, and carries shared `SOURCES-*` and `VENDORED-*` notices. This catches missing dependencies even when an upstream skill's own files match.
