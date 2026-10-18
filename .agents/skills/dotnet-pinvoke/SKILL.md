---
name: dotnet-pinvoke
description: "Implement or debug .NET native interop with P/Invoke, marshalling, and native lifetime management. Excludes COM, C++/CLI, and purely managed code."
license: MIT
---

<!-- Adapted from github.com/dotnet/skills at 10d85e25fb42d5f65c568d5e979a005ee69eecb3 — MIT, Copyright (c) .NET Foundation and Contributors. See LICENSE and ../VENDORED-DOTNET.md. -->

# .NET P/Invoke

Implement or review the requested native boundary from its header, ABI, platform,
and ownership contract. A review remains analytical unless fixes are authorized.
For one function, map that signature and only load relevant string, memory, or
callback recipes. Do not migrate working declarations or add generators unless
requested or required by the target's AOT/trimming contract.

## Establish the ABI

Read the native header and target framework/architectures. Resolve discrepancies
between headers and simplified documentation before writing declarations; don't
guess packing, calling conventions, allocators, or lifetime. Use `DllImport` for
.NET Framework and prefer `LibraryImport` for new supported .NET 7+ code. Existing
imports need no wholesale migration. AOT requires checking supported marshalling,
not merely changing an attribute.

Map widths deliberately:

- C `long` is platform-dependent: use `CLong`/`CULong` when supported or an explicit
  platform-aware declaration. With generated marshalling, verify the required
  `DisableRuntimeMarshalling` configuration.
- `size_t` is pointer-sized: use `nuint`/`UIntPtr`, never a fixed-width `ulong`.
- Win32 `BOOL` is four bytes; C `bool` is commonly one. Specify the native boolean
  representation rather than assuming managed `bool` matches it.
- Match struct field order, packing, alignment, pointer widths, and export names.
  Use explicit calling conventions for Windows x86; keep callback conventions
  consistent with the header.

## Encoding and lifetime

Specify string encoding explicitly, avoiding `CharSet.Auto`. Prefer Windows `W`
APIs for UTF-16 and the actual library's encoding elsewhere; `wchar_t` is not
universally UTF-16. Use bounded buffers with verified units and termination rules;
avoid introducing `StringBuilder` output buffers.

Document who allocates, owns, and frees each buffer/handle. Match the exact
allocator/free function. A marshalled temporary ends with the call; if native code
retains its pointer, manage/pin storage until native completion. Use `SafeHandle`
for owned native handles, preserve its marshalling constructor, and keep raw
pointers contained in the wrapper. Do not free borrowed handles.

Root delegate callbacks for the entire native registration, or use supported
`UnmanagedCallersOnly` static blittable callbacks. Never let exceptions unwind
through native frames. `GC.KeepAlive` covers a synchronous call, not an indefinite
registration; release roots only after native callbacks cannot occur.

## Errors and verification

Follow the native API's success/failure contract. Both import attributes use
`SetLastError = true` when appropriate; retrieve the captured error immediately
with the supported `Marshal` API. HRESULT and returned status codes have their
own contracts.

Build affected TFMs/RIDs with the relevant interop analyzers. Compare managed
struct sizes/layout with native `sizeof`/offsets. Exercise known input/output,
non-ASCII text, error paths, and cleanup where relevant using existing fixtures.
Report platform coverage and unavailable native binaries; a managed build alone
does not verify the ABI. Do not add callbacks or wrapper machinery the API lacks.

## Conditional detail

- [Type mapping and layout](references/type-mapping.md) for unfamiliar native types.
- [Declarations, strings, ownership and callback recipes](references/workflow-guide.md#workflow)
  for the specific boundary being implemented.
- [Library loading](references/workflow-guide.md#cross-platform-library-loading)
  for portable names/resolvers; OS preprocessor symbols require OS-specific TFMs.
- [Diagnostics](references/diagnostics.md) for crashes, loading failures or corruption.
- [Migration](references/workflow-guide.md#migrating-dllimport-to-libraryimport)
  only for an authorized migration; CsWin32 applies to Win32, not every C library.
