# Vendored .NET skills (dotnet-*)

The `dotnet-*` skill directories in this folder are a **curated subset** vendored
from the official **.NET team** plugin marketplace:

- Source: https://github.com/dotnet/skills (`dotnet-agent-skills`)
- License: MIT — Copyright (c) .NET Foundation and Contributors

Only directory names were prefixed with `dotnet-` (and the matching `name:` field
updated) so the Arcwright installer can include/exclude them as one group via the
`--dotnet` opt-in flag. Skill content is otherwise unmodified.

Curated essentials (mapped to headless .NET CLI / native-interop / AOT / cross-platform build):

| Vendored dir | Upstream plugin/skill |
|---|---|
| `dotnet-pinvoke` | dotnet / dotnet-pinvoke |
| `dotnet-csharp-scripts` | dotnet / csharp-scripts |
| `dotnet-setup-local-sdk` | dotnet / setup-local-sdk |
| `dotnet-aot-compat` | dotnet-upgrade / dotnet-aot-compat |
| `dotnet-migrate-nullable-references` | dotnet-upgrade / migrate-nullable-references |
| `dotnet-directory-build-organization` | dotnet-msbuild / directory-build-organization |
| `dotnet-msbuild-antipatterns` | dotnet-msbuild / msbuild-antipatterns |
| `dotnet-incremental-build` | dotnet-msbuild / incremental-build |

For the **full** .NET skill set (test, diag, nuget, upgrade matrices, etc.), install
the upstream marketplace directly:

```
claude plugin marketplace add dotnet/skills
claude plugin install dotnet@dotnet-agent-skills   # + dotnet-msbuild, dotnet-upgrade, dotnet-diag, …
```

To refresh this vendored subset, re-copy from the marketplace cache and re-run
`node build/build.js`.
