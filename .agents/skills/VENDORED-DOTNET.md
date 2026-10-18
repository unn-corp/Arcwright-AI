# Vendored .NET skills (dotnet-*)

The `dotnet-*` directories are a curated subset of the official [.NET team
skills](https://github.com/dotnet/skills), installed only with Arcwright's
`--dotnet` opt-in. Keep that packaging choice and the installed names unchanged.

- Reviewed upstream source: [`10d85e25fb42d5f65c568d5e979a005ee69eecb3`](https://github.com/dotnet/skills/commit/10d85e25fb42d5f65c568d5e979a005ee69eecb3), checked 2026-10-16.
- License: MIT, Copyright (c) .NET Foundation and Contributors. The full upstream
  notice is included as `LICENSE` in each vendored skill directory.
- Original Arcwright import: `1013f0b97c694dc0ee9c96c99841b84687ab3f7f`
  (2026-06-27). Its 22 skill/reference/script files match upstream
  `691cd472a108927024b575e4599d273bca62c60c` after the namespace/comment adaptations.

| Arcwright directory | Path under the reviewed upstream source |
|---|---|
| `dotnet-pinvoke` | `plugins/dotnet-advanced/skills/dotnet-pinvoke` |
| `dotnet-csharp-scripts` | `plugins/dotnet-advanced/skills/csharp-scripts` |
| `dotnet-setup-local-sdk` | `plugins/dotnet/skills/setup-local-sdk` |
| `dotnet-aot-compat` | `plugins/dotnet-upgrade/skills/dotnet-aot-compat` |
| `dotnet-migrate-nullable-references` | `plugins/dotnet-upgrade/skills/migrate-nullable-references` |
| `dotnet-directory-build-organization` | `plugins/dotnet-msbuild/skills/directory-build-organization` |
| `dotnet-msbuild-antipatterns` | `plugins/dotnet-msbuild/skills/msbuild-antipatterns` |
| `dotnet-incremental-build` | `plugins/dotnet-msbuild/skills/incremental-build` |

## Arcwright adaptations

Directory names and `name:` fields use the `dotnet-*` namespace. Attribution
comments identify the source; preserve these and the upstream license notices.

The 2026-10-16 refresh updates five files in four skills: P/Invoke library naming,
Directory.Build routing/import-order/entrypoint guidance, incremental-build
correctness and diagnostic evidence, and MSBuild import/reference anti-patterns
(including AP-23 in `references/additional-antipatterns.md`). The other four
skills and the remaining supporting files already match the reviewed source.

Content adapters preserve portable behavior:

- Intent guards distinguish advice/review from implementation while honoring
  authorization already present in the conversation.
- Binlog analysis discovers the host's callable MCP operations and retains a
  diagnostic text-log fallback; it does not require the Unnamed Development MCP.
- New packed-forwarding and project-instance checks include the necessary
  explanation locally. Additional upstream `extension-points` and
  `check-bin-obj-clash` guides are optional pinned links, not required skills
  missing from this curated pack.

## Refreshing deliberately

Read the reviewed upstream commit and compare actual skill files, including
references and scripts. Use an immutable source revision and record its paths,
hashes, license, and adaptations in the package's provenance record. Reapply the
namespace/host adapters without overwriting local changes. Run proportionate
helper and instruction checks before the normal Arcwright build. A skill update
does not itself authorize publishing or installing a release.

Users who want the complete upstream catalog can install the official
`dotnet/skills` marketplace directly using the host's supported plugin tools.
