---
description: Route a .NET / C# task to the right vendored .NET skill (interop, AOT, MSBuild, local SDK).
---

# /dotnet — .NET / C# skill router

Curated .NET skills vendored from the official [dotnet/skills](https://github.com/dotnet/skills)
marketplace (MIT). Use this to load the right skill for a .NET task.

## Instructions

1. Identify what the task touches, then load the matching `SKILL.md`:

   | Task | Skill |
   |------|-------|
   | Calling native C/C++ libs from .NET (P/Invoke, `LibraryImport`, marshalling, SafeHandle) | `.agents/skills/dotnet-pinvoke/SKILL.md` |
   | Running C# as a script (`dotnet run app.cs`, file-based programs) | `.agents/skills/dotnet-csharp-scripts/SKILL.md` |
   | Pinning / installing a local .NET SDK (`global.json`, dotnet-install) | `.agents/skills/dotnet-setup-local-sdk/SKILL.md` |
   | Making code Native AOT / trimming compatible | `.agents/skills/dotnet-aot-compat/SKILL.md` |
   | Enabling / migrating to nullable reference types | `.agents/skills/dotnet-migrate-nullable-references/SKILL.md` |
   | Organizing `Directory.Build.props/targets` across a repo | `.agents/skills/dotnet-directory-build-organization/SKILL.md` |
   | Diagnosing slow / incorrect MSBuild builds (antipatterns) | `.agents/skills/dotnet-msbuild-antipatterns/SKILL.md` |
   | Fixing broken incremental builds (rebuilds-everything) | `.agents/skills/dotnet-incremental-build/SKILL.md` |

2. Follow the loaded skill's procedure. Several skills have a `references/` folder — read the
   relevant reference file when the skill points to it.

3. If the task needs a .NET skill **not** in this curated set (testing, diagnostics/dumps, NuGet
   CPM, full upgrade matrices), tell the user to install the full upstream marketplace:
   `claude plugin marketplace add dotnet/skills` then `claude plugin install dotnet@dotnet-agent-skills`.

## Arguments

`$ARGUMENTS` — optional: the .NET task or skill area. If empty, ask what the task involves.
