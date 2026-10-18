# Public repository history

Arcwright's public history excludes Unnamed Development procedures and retired
project-specific outputs. The original Git history, issues, pull requests, and
other repository records are retained in the private
[Arcwright-AI archive](https://github.com/unn-corp/Arcwright-AI-private-archive).
Organization skills are maintained separately in the optional private pack; see
[organization packs](organization-packs.md).

The public repository keeps the `unn-corp/Arcwright-AI` URL and uses `main` as its
maintained default branch. Historical branch names are preserved where possible;
older code may refer to removed private integrations. Use current `main` for
builds and installations.

After the migration, use a fresh clone. If local work must be retained, back it up,
fetch the new public refs, and reapply only the intended source changes to current
`main`. Do not merge or push an old private branch into the public repository.
Commit IDs changed; private recovery mirrors and the rewrite map are kept outside
tracked source. Ordinary updates do not authorize another history rewrite.

Public CI runs the package build, test/coverage gates, website checks, and pinned
security scanners on GitHub-hosted runners. It needs no private organization
checkout, baseline workflow, credentials, or notification endpoint.
